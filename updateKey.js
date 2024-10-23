const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const port = 3002;

app.use(bodyParser.json());

app.post('/addkey', (req, res) => {
    const { uid, key } = req.body;

    if (!uid || !key) {
        return res.status(400).json({ error: 'USER_ID and PUBLIC_KEY are required.' });
    }

    // Sanitize inputs to prevent command injection
    const sanitizedUid = uid.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedKey = key.replace(/[^a-zA-Z0-9@:.+\/= -]/g, '');

    const command = `
        #!/bin/bash

        USER_ID="${sanitizedUid}"
        PUBLIC_KEY="${sanitizedKey}"

        # Write the public key to the authorized_keys file inside the container
        lxc exec $USER_ID -- bash -c "
            NON_ROOT_USER=\$(ls /home | head -n 1) && \
            mkdir -p /home/\$NON_ROOT_USER/.ssh && \
            echo \"$PUBLIC_KEY\" >> /home/\$NON_ROOT_USER/.ssh/authorized_keys && \
            chmod 600 /home/\$NON_ROOT_USER/.ssh/authorized_keys && \
            chmod 700 /home/\$NON_ROOT_USER/.ssh && \
            chown -R \$NON_ROOT_USER:\$NON_ROOT_USER /home/\$NON_ROOT_USER/.ssh"
    `;

    // Execute the bash command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error adding key: ${error.message}`);
            return res.status(500).json({ error: 'Failed to add key to the container.' });
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({ error: 'Error occurred during key addition.' });
        }

        console.log(`stdout: ${stdout}`);
        return res.status(200).json({ message: `Public key added to container ${sanitizedUid}.` });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
