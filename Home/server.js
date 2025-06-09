/**
 * SmartHub - AI powered Smart Home
 * App which is running and read rules and try to validate them with AI and send command to a Controller 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.0
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt');
const axios = require('axios');
const ini = require('ini');
const cmd = require('../Shared/command-node');

const environment = require('../Shared/env-node');
const env = environment.load();

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
// === LOAD CONFIG ===
const config = ini.parse(fs.readFileSync('./index.cfg', 'utf-8'));

const RULES_DIR = config.general.rules_dir;
const SETTINGS_FILE = config.general.settings_file;
ACTIONS_FILE = config.general.actions_file;
const LOG_URL = config.general.log_url;
//const DEBUG = config.general.debug === 'true';
let DEBUG = true;

const MQTT_URL = config.mqtt.url;

const LLM_PROVIDER = config.llm.provider.toLowerCase();
const LLM_MODEL = config.llm.model;


const LLM_URLS = {
    openai: config.openai.url,
    ollama: config.ollama.url,
    claude: config.claude.url,
    deepseek: config.deepseek.url,
    grok: config.grok.url,
    gemini: config.gemini.url,
};

const MODEL_NAMES = {
    openai: config.openai.model || LLM_MODEL,
    ollama: config.ollama.model || LLM_MODEL,
    claude: config.claude.model || LLM_MODEL,
    deepseek: config.deepseek.model || LLM_MODEL,
    grok: config.grok.model || LLM_MODEL,
    gemini: config.gemini.model || LLM_MODEL,
};

let receivedFirstMessage = false;

// === MQTT CONNECTION ===
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('#', { qos: 0 });
});

const mqttState = { };

client.on('message', (topic, message) => {
    try {
        const value = JSON.parse(message.toString()).value;
        mqttState[topic] = value;
        receivedFirstMessage = true;
    } catch (err) {
        console.error(`MQTT parse error on ${topic}:`, err.message);
    }
});


async function callOpenAI({ url, model, prompt, apiKey }) {
    const response = await axios.post(url, {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data?.choices?.[0]?.message?.content?.trim();
}

async function callOllama({ url, model, prompt, apiKey }) {
    const response = await axios.post(url, {
        model,
        prompt,
        stream: false
    });

    return response.data?.response?.trim();
}

async function callClaude({ url, model, prompt, apiKey }) {
    const response = await axios.post(url, {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.7
    }, {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
    });

    return response.data?.content?.[0]?.text?.trim();
}

async function callDeepseek({ url, model, prompt, apiKey }) {
    try {
        const response = await axios.post(url, {
            model: model || 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('No content in response');
        }

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('DeepSeek API Error:', error.response?.data || error.message);
        throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
    }
}

async function callGemini({ url, model, prompt, apiKey }) {

    const defaultSafetySettings = [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 3 },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 3 },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 3 },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 3 }
    ];

    const defaultGenerationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
    };

    const response = await axios.post(`${url}${model}:generateContent`, {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }]
        }],
        safetySettings: defaultSafetySettings,
        generationConfig: defaultGenerationConfig
    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        }
    });

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function callGrok({ url, model, prompt, apiKey }) {
    const response = await axios.post(url, {
        model: model || 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    });

    return response.data?.choices?.[0]?.message?.content?.trim();
}

// Универсальный маршрутизатор
async function queryLLM(prompt) {

    const model = MODEL_NAMES[LLM_PROVIDER];
    const url = LLM_URLS[LLM_PROVIDER];
    const apiKey = env.ai[LLM_PROVIDER + "_api_key"];

    if (false) {
        console.log(model);
        console.log(url);
        console.log(apiKey);
    }

    let response;

    try {
        switch (LLM_PROVIDER) {
            case 'openai':
                return await callOpenAI({ url, model, prompt, apiKey });
            case 'ollama':
                return await callOllama({ url, model, prompt, apiKey });
            case 'claude':
                return await callClaude({ url, model, prompt, apiKey });
            case 'deepseek':
                return await callDeepseek({ url, model, prompt, apiKey });
            case 'gemini':
                return await callGemini({ url, model, prompt, apiKey });
            case 'grok':
                return await callGrok({ url, model, prompt, apiKey });
            default:
                throw new Error(`Unknown LLM provider: ${LLM_PROVIDER}`);
        }
    } catch (error) {
        if (error.response) {
            console.error(`Error from ${LLM_PROVIDER}:`);
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
        throw error;
    }
}


// === RULE PROCESSOR ===
async function processRulesWithState() {
    const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} rule files`);

    for (const file of files) {
        const ruleText = fs.readFileSync(path.join(RULES_DIR, file), 'utf-8').trim();
        const settingsText = fs.readFileSync(SETTINGS_FILE, 'utf-8').trim();
        const actions = fs.readFileSync(ACTIONS_FILE, 'utf-8').trim();
        const timeStamp = formatDate(new Date()).trim();
        const shState = JSON.stringify(mqttState, null, 2).trim();

        console.log(`Правило:\n  ${ruleText}\n`);

        let prompt = `Состояние умного дома: ${shState}\nСейчас: ${timeStamp}\nПравило: ${ruleText}\nОграничения: ${settingsText}\nДоступные функции: ${actions}`;
        if (DEBUG) {
            prompt += ' Подробно объясни почему ты так решила?. Вывести значение всех переменных учавствоваших в принятии решения.';
        } else {
            prompt += ' Не выводить никаких размышлений. Только конечный результат.';
        }

        try {

            const fullPath = path.join(OUTPUT_DIR, file + ".json");
            fs.writeFileSync(fullPath, prompt + '\n', 'utf-8');
            

            const output = await queryLLM(prompt);
            console.log(output);
            cmd.execCommand(output);
        } catch (err) {
            console.error(`Failed to query LLM for ${file}:`, err.message);
        }
    }

    client.end();
}

function formatDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// === WAIT FOR RETAINED SNAPSHOT THEN EXECUTE ===
console.log('Waiting for retained MQTT state...');
setTimeout(() => {
    if (!receivedFirstMessage) {
        console.warn('No MQTT state received. Proceeding anyway...');
    }
    processRulesWithState();
}, 3000);