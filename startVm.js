const express = require('express');
const { exec } = require('child_process'); // Import child_process to execute bash scripts
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', (req, res) => {
    // Access the JSON data sent in the request body
    const { uid, email } = req.body;

    // Log the received data
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

        // Output from the script
        console.log(`Script output: ${stdout}`);

        // Send success response
        res.status(200).json({
            message: 'Script executed successfully!',
            scriptOutput: stdout
        });
    });
});

// Set the server to listen on port 3000
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
