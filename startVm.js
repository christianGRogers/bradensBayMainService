const express = require('express');
const cors = require('cors'); 
var exec = require('child_process').exec;
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




// Function to execute the script with a timeout
function executeScript(uid, email) {
    return new Promise((resolve, reject) => {
        console.log(uid);
        exec(`sudo /home/christian/bradensBayMainService/newUserSchedular.sh ${uid} ${email}`, { timeout: 120000 }, (error, stdout, stderr) => { // 2-minute timeout
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return reject(new Error(`Error executing script: ${error.message}`));
            }
            if (stderr) {
                console.error(`Script error: ${stderr}`);
                return reject(new Error(`Script error: ${stderr}`));
            }
            const [password, port] = stdout.trim().split(' ');
            resolve({ password, port });
        });
    });
}

// Define a POST endpoint at '/endpoint'
app.post('/endpoint', async (req, res) => {
    const { uid, email } = req.body;
    console.log('Received JSON:', { uid, email });

    try {
        await executeScript(uid, email);


        // Send a success response
        res.status(200).json({
            message: 'Data saved and script executed successfully!',
            password: password,
            port: port
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
