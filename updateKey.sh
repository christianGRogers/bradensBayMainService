#!/bin/bash

# Check if the user has provided the required arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <USER_ID> <PUBLIC_KEY>"
    exit 1
fi

USER_ID=$1
PUBLIC_KEY=$2



# Write the public key to the authorized_keys file inside the container
lxc exec -u root $USER_ID bash -c "mkdir -p ~/.ssh && echo \"$PUBLIC_KEY\" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"

echo "Public key added to container $USER_ID."
