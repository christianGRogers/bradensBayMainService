const express = require('express');
const cors = require('cors'); // Import the CORS library
const { exec } = require('child_process');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const app = express();

// Enable CORS for all routes and origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Function to write data to Firebase
function writeUserData(uid, port, password, additionalField) {
    return set(ref(database, 'users/' + uid), {
        port: port,
        password: password,
        additionalField: additionalField
    });
}

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', (req, res) => {
    const { uid, email, port, password, additionalField } = req.body;

    console.log('Received JSON:', { uid, email, port, password, additionalField });

    // Save the data to Firebase
    writeUserData(uid, port, password, additionalField)
        .then(() => {
            console.log('Data saved to Firebase successfully!');

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
                    message: 'Data saved and script executed successfully!',
                    scriptOutput: stdout
                });
            });
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
            res.status(500).json({ message: 'Error saving data to Firebase', error: error.message });
        });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
