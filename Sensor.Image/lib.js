/**
 * SmartHub - AI powered Smart Home
 * Image parsing Node.JS Library (Async Version)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

const fs = require('fs').promises;
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const mqtt = require('../Shared/mqtt-node');
const { createCanvas, loadImage } = require('canvas');

const CONFIG = {
    imageDir: path.join(__dirname, 'images')
};

function getImageArea(filePath) {
    const fileName = path.basename(filePath);
    const parts = fileName.split(/[^a-zA-Z0-9]+/); // Split on any non-letter/digit
    return parts[0];
}

async function getImageObjects(filePath, modelPromise) {
    const model = await modelPromise;
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const input = tf.browser.fromPixels(canvas);
    const predictions = await model.detect(input);

    const area = getImageArea(filePath);
    const car = predictions.find(obj => obj.class === 'car');

    return {
        [area + "_car_presence"]: car ? 1 : 0
    };
}

async function getImageData(common) {
    console.log("   - getImageData");

    let result = []; // array of objects

    try {
        const modelPromise = cocoSsd.load();

        const files = await fs.readdir(CONFIG.imageDir);
        const imageFiles = files.filter(f =>
            f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')
        );

        for (const filename of imageFiles) {
            const filePath = path.join(CONFIG.imageDir, filename);

            try {
                const imageResult = await getImageObjects(filePath, modelPromise);
                result.push(imageResult); // add each result as its own object
            } catch (err) {
                console.error(`Error processing image ${filename}:`, err);
            }

            await fs.unlink(filePath).catch(err =>
                console.warn(`Could not delete ${filePath}: ${err.message}`)
            );
        }

    } catch (err) {
        console.error("General error in getImageData:", err);
    }

    return result;
}

module.exports = { getImageData };
