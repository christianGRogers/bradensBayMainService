#!/bin/bash

# Check if the user has provided the required arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <USER_ID> <PUBLIC_KEY>"
    exit 1
fi

USER_ID=$1
PUBLIC_KEY=$2



# Write the public key to the authorized_keys file inside the container
lxc exec $USER_ID -- bash -c "
    NON_ROOT_USER=\$(ls /home | head -n 1) && \
    mkdir -p /home/\$NON_ROOT_USER/.ssh && \
    echo \"$PUBLIC_KEY\" >> /home/\$NON_ROOT_USER/.ssh/authorized_keys && \
    chmod 600 /home/\$NON_ROOT_USER/.ssh/authorized_keys && \
    chmod 700 /home/\$NON_ROOT_USER/.ssh && \
    chown -R \$NON_ROOT_USER:\$NON_ROOT_USER /home/\$NON_ROOT_USER/.ssh"


echo "Public key added to container $USER_ID."
