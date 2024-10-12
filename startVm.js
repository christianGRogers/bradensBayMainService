const express = require('express');
const cors = require('cors'); // Import the CORS library
const { exec } = require('child_process');
const app = express();

// Enable CORS for all routes and origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', (req, res) => {
    const { uid, email } = req.body;

    console.log('Received JSON:', { uid, email });

    // Execute the Bash script and pass uid and email as arguments
    exec(`./newUser.sh ${uid} ${email}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).json({ message: 'Error executing script', error: error.message });
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
            return res.status(500).json({ message: 'Script error', error: stderr });
        }

        console.log(`Script output: ${stdout}`);
        res.status(200).json({
            message: 'Script executed successfully!',
            scriptOutput: stdout
        });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
