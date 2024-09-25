// Node.js backend using Firebase Admin SDK for listing users and executing bash scripts
const admin = require('firebase-admin');
const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Path to the Firebase service account key file
const serviceAccount = require('key/bradensbay-1720893101514-firebase-adminsdk-5czfh-9bee707839.json');

// Initialize Firebase Admin SDK with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bradensbay-1720893101514.firebaseio.com"
});

// Endpoint to list users from Firebase Authentication
app.get('/list-users', async (req, res) => {
  try {
    let users = [];
    let listUsersResult = await admin.auth().listUsers();

    listUsersResult.users.forEach(userRecord => {
      const uid = userRecord.uid;
      const username = userRecord.email || userRecord.displayName || 'unknown';
      users.push({ uid, username });
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users');
  }
});

// Endpoint to run a bash script for a specific user
app.get('/run-bash-script', (req, res) => {
  const { uid, username } = req.query;

  // Execute bash script with UID and username as arguments
  const script = `./myScript.sh '${uid}' '${username}'`;
  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).send('Error executing script');
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).send('Script error');
    }
    console.log(`Script output: ${stdout}`);
    res.send('Script executed successfully');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
