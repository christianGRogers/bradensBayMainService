#/bin/bash
sudo chmod +x newUserSchedular.sh
sudo chmod +x newUser.sh
sudo npm install @google/generative-ai
sudo npm install cors
sudo npm install firebase
sudo npm install express
sudo screen -dmS runPromptSession bash -c 'DEBUG=* node runPrompt.js' >> deploy.log
sudo screen -dmS startVmSession bash -c 'DEBUG=* node startVm.js' >> deploy.log
sudo screen -dmS updateKeySession bash -c 'DEBUG=* node updateKey.js' >> deploy.log
echo "API processes started in screen sessions."



