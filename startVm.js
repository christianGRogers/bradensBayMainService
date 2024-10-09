const express = require('express');
const firebase = require('firebase/app'); // Import Firebase app
const { getAuth } = require('firebase/auth'); // Import Firebase Auth
const { initializeApp } = require('firebase/app');
const crypto = require('crypto');

const firebaseConfig = {
    apiKey: "AIzaSyDmdf8NhoFAzXKGuBWYq5XoDrM5eNClgOg",
    authDomain: "bradensbay-1720893101514.firebaseapp.com",
    projectId: "bradensbay-1720893101514",
    storageBucket: "bradensbay-1720893101514.appspot.com",
    messagingSenderId: "280971564912",
    appId: "1:280971564912:web:989fff5191d0512c1b21b5",
    measurementId: "G-DNJS8CVKWD"
};

// Initialize Firebase app
initializeApp(firebaseConfig);

const app = express();
app.use(express.json());

// Generate RSA key pair (for example purposes, this part is still here)
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Function to verify Firebase user by UID
async function verifyUser(uid, email) {
  try {
    // Fetch the user by UID from Firebase
    const userRecord = await admin.auth().getUser(uid);

    // Check if the email matches
    if (userRecord.email === email) {
      console.log(`User exists: ${email}`);
      return true;
    } else {
      console.log(`Email mismatch for UID ${uid}: expected ${email}, got ${userRecord.email}`);
      return false;
    }
  } catch (error) {
    console.log('Error verifying user:', error.message);
    return false;
  }
}

// Function to run Bash script with UID and email
function runBashScript(uid, email) {
  const scriptPath = './newUser.sh'; // Replace with your actual script path
  const command = `${scriptPath} ${uid} ${email}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log(`stdout: ${stdout}`);
  });
}

// Endpoint to serve public key (optional)
app.get('/public-key', (req, res) => {
  res.send(publicKey);
});

// Endpoint to receive UID and email
app.post('/verify-and-execute', async (req, res) => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required' });
  }

  try {
    // Verify the user via Firebase Authentication
    const userVerified = await verifyUser(uid, email);

    if (userVerified) {
      // Run the bash script with UID and email as parameters
      runBashScript(uid, email);
      res.json({ message: 'User verified and script executed successfully' });
    } else {
      res.status(400).json({ error: 'User verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while verifying user' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
