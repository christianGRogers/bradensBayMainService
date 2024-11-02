#/bin/bash


if [ "$HOSTNAME" = "testservera" ]; then
    sudo chmod +x newUserSchedular.sh
    sudo chmod +x newUser.sh
    sudo screen -dmS runPromptSession DEBUG=* node runPrompt.js
    sudo screen -dmS startVmSession DEBUG=* node startVm.js
    sudo screen -dmS updateKeySession DEBUG=* node updateKey.js
    echo started api's
fi
