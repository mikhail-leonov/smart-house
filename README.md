# Define the README content
Smart House Automation System

A cross-platform intelligent automation system for smart homes using LLMs (local or cloud-based) and MQTT to manage and react to environmental state.

Supports Windows, macOS, and Linux.

---

Core Concepts

- Executes natural language automation rules via LLMs
- Uses MQTT to store and communicate smart house state
- Hierarchical state resolution with fallback:
  1. High priority: Live sensor data (most accurate)
  2. Medium priority: Data from web sources
  3. Low priority: Randomly generated data (debugging/testing)

---

## Rule Engine

- Loads plain-text rule files from a directory
- Each rule is interpreted by an LLM (local via Ollama or remote like OpenAI/Claude)
- Rules are executed with full context from the current smart house state
- Example rule:

