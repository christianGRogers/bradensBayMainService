const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json()); // for parsing application/json

// Endpoint to run the bash script after user signup
app.post('/run-bash-script', (req, res) => {
  const { uid, email } = req.body; // Extract UID and email from the request body
  console.log(`Received UID: ${uid}, Email: ${email}`); // Log the UID and email

  const bashScriptPath = path.join(__dirname, 'scripts', 'newUser.sh'); // Path to your bash script

  // Run the bash script, potentially using the UID and email if needed
  exec(`bash ${bashScriptPath}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error executing script: ${error.message}`);
          return res.status(500).json({ message: 'Failed to run script' });
      }

      if (stderr) {
          console.error(`Script error output: ${stderr}`);
          return res.status(500).json({ message: 'Script ran with errors' });
      }

      console.log(`Script output: ${stdout}`);
      res.status(200).json({ message: 'Script executed successfully', output: stdout });
  });
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});
