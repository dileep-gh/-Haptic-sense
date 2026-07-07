const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/generative-ai'); // AI Engine Module

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize the AI Engine (Replace 'YOUR_API_KEY' with your actual free API key)
const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

// Universal Voice Command Processing Route
app.post('/api/command', async (req, res) => {
    const { phrase, operator, currentMode } = req.body;
    
    if (!phrase) {
        return res.status(400).json({ error: "No voice payload identified." });
    }

    const command = phrase.toLowerCase().trim();
    let responsePayload = {
        speak: "",
        action: "NONE",
        targetMode: currentMode
    };

    // --- STEP A: CHECK FOR HARDCODED APP CONTROLS FIRST ---
    if (command.includes("blind") || command.includes("navigation")) {
        responsePayload.speak = `Initializing blind interface matrix for operator ${operator}.`;
        responsePayload.action = "SWITCH_MODE";
        responsePayload.targetMode = "blind";
        return res.json(responsePayload);
    } 
    else if (command.includes("deaf") || command.includes("alert")) {
        responsePayload.speak = `Activating deaf environmental sound monitor.`;
        responsePayload.action = "SWITCH_MODE";
        responsePayload.targetMode = "deaf";
        return res.json(responsePayload);
    } 
    else if (command.includes("dumb") || command.includes("vocal")) {
        responsePayload.speak = `Broadcaster interface active.`;
        responsePayload.action = "SWITCH_MODE";
        responsePayload.targetMode = "dumb";
        return res.json(responsePayload);
    }
    else if (command.includes("map") || command.includes("coordinates")) {
        if (currentMode === "blind") {
            responsePayload.speak = "Initializing spatial tracking map layers now.";
            responsePayload.action = "LAUNCH_MAP";
        } else {
            responsePayload.speak = "Mapping modules are only authorized inside blind mode protocols.";
        }
        return res.json(responsePayload);
    }
    else if (command.includes("go home") || command.includes("go back") || command.includes("menu")) {
        responsePayload.speak = "Returning to main mode selection interface panel.";
        responsePayload.action = "GO_HOME";
        return res.json(responsePayload);
    }

    // --- STEP B: LIVE CONVERSATIONAL AI BACKEND DEPLOYMENT ---
    try {
        // We instruct the AI model how to behave using a system prompt
        const model = ai.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `You are the onboard voice assistant for a system called Haptic Sense. The current operator's name is ${operator}. The current interface mode is ${currentMode}. Answer concisely, naturally, and supportively in under two sentences so it reads well as voice audio. If they ask who created you, proudly tell them you were built by ${operator}.`
        });

        // Generate the text live using AI
        const aiResult = await model.generateContent(phrase);
        responsePayload.speak = aiResult.response.text();
        responsePayload.action = "CONVERSATION_REPLY";

    } catch (error) {
        console.error("AI Generation error:", error);
        responsePayload.speak = `Telemetry processing error. Standing by for instructions, operator ${operator}.`;
    }

    res.json(responsePayload);
});

app.listen(PORT, () => {
    console.log(`Haptic Sense Gemini AI Backend active on port ${PORT}`);
});
