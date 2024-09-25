// getUserData.js
const admin = require('firebase-admin');
const { exec } = require('child_process');


// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Function to get all users
async function getUsers() {
  let users = [];
  let listUsersResult = await admin.auth().listUsers();
  
  listUsersResult.users.forEach(userRecord => {
    // Capture UID and email (or displayName if applicable)
    const uid = userRecord.uid;
    const username = userRecord.email || userRecord.displayName || 'unknown';

    users.push({ uid, username });
  });

  return users;
}

// Run bash script with UID and username as arguments
function runBashScript(uid, username) {
  const script = `./newUser.sh '${uid}' '${username}'`;
  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return;
    }
    console.log(`Script output: ${stdout}`);
  });
}

// Main function
async function main() {
  const users = await getUsers();

  // Iterate over users and pass UID/username to the bash script
  users.forEach(user => {
    runBashScript(user.uid, user.username);
  });
}

// Execute the main function
main().catch(console.error);
