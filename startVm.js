const express = require('express');
const cors = require('cors'); // Import the CORS library
const { exec } = require('child_process');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, update } = require('firebase/database');
const app = express();

// Enable CORS for all routes and origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDmdf8NhoFAzXKGuBWYq5XoDrM5eNClgOg",
    authDomain: "bradensbay-1720893101514.firebaseapp.com",
    databaseURL: "https://bradensbay-1720893101514-default-rtdb.firebaseio.com/",
    projectId: "bradensbay-1720893101514",
    storageBucket: "bradensbay-1720893101514.appspot.com",
    messagingSenderId: "280971564912",
    appId: "1:280971564912:web:989fff5191d0512c1b21b5",
    measurementId: "G-DNJS8CVKWD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Function to write or update data in Firebase
function updateUserData(uid, password, port) {
    const userRef = ref(database, 'users/' + uid);
    return update(userRef, {
        password: password,
        port: port
    });
}

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', (req, res) => {
    const { uid, email } = req.body;

    console.log('Received JSON:', { uid, email });

    // Execute the Bash script and pass uid and email as arguments
    exec(`sudo ./newUser.sh ${uid} ${email}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).json({ message: 'Error executing script', error: error.message });
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
            return res.status(500).json({ message: 'Script error', error: stderr });
        }

        // Parse password and port from the script output
        const [password, port] = stdout.trim().split(' ');

        console.log(`Password: ${password}, Port: ${port}`);

        // Save the data to Firebase
        updateUserData(uid, password, port)
            .then(() => {
                res.status(200).json({
                    message: 'Data saved and script executed successfully!',
                    password: password,
                    port: port
                });
            })
            .catch((error) => {
                console.error('Error saving data to Firebase:', error);
                res.status(500).json({ message: 'Error saving data to Firebase', error: error.message });
            });
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
