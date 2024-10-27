const express = require('express');
const { exec } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3003;

// Replace with your actual API key
const API_KEY = 'YOUR_API_KEY'; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(express.json());

// Function to run commands inside the LXD VM
function runCommandsInLXDVM(uid, commands) {
    const formattedCommands = commands.replace(/\s+/g, ';');
    const lxdCommand = `lxc exec ${uid} -- bash -c "${formattedCommands}"`;

    exec(lxdCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing commands: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

// Define the route to handle the user prompt
app.post('/execute', async (req, res) => {
    const { uid, prompt } = req.body;

    if (!uid || !prompt) {
        return res.status(400).json({ error: 'uid and prompt are required.' });
    }

    try {
        // Generate commands using the Gemini model
        const result = await model.generateContent(prompt);
        const commands = result.response.text().trim();

        if (commands) {
            runCommandsInLXDVM(uid, commands);
            return res.status(200).json({ message: 'Commands executed successfully.' });
        } else {
            return res.status(500).json({ error: 'Failed to generate commands from Gemini.' });
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
