const functions = require('firebase-functions');
const { exec } = require('child_process');

exports.onUserCreate = functions.auth.user().onCreate((user) => {
  const email = user.email; // User's email
  const uid = user.uid;     // User's UID

  // Define the Bash script path and pass the email and UID as arguments
  const script = `./newUser.sh  "${uid}" "${email}"`;

  // Execute the Bash script
  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Output: ${stdout}`);
  });
});
