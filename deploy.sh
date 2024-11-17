#/bin/bash
cd app
sudo git clone https://github.com/christianGRogers/bradensbay-start-vm-api
sudo git clone https://github.com/christianGRogers/bradensbay-update-key-api
sudo git clone https://github.com/christianGRogers/bradensbay-run-prompt-api
sudo chmod +x bradensbay-start-vm-api/newUserSchedular.sh
sudo chmod +x bradensbay-start-vm-api/newUser.sh
sudo npm install @google/generative-ai
sudo npm install cors
sudo npm install firebase
sudo npm install express
sudo screen -dmS runPromptSession bash -c 'DEBUG=* node bradensbay-run-prompt-api/index.js' >> deploy.log
sudo screen -dmS startVmSession bash -c 'DEBUG=* node bradensbay-start-vm-api/index.js' >> deploy.log
sudo screen -dmS updateKeySession bash -c 'DEBUG=* node bradensbay-update-key-api/index.js' >> deploy.log
echo "API processes started in screen sessions."



