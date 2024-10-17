#!/bin/bash

# Get the UID and email from the arguments
USER_ID=$1
EMAIL=$2

# Function to run the long-running process
long_running_process() {
    echo "Starting long-running process for UID: $UID and EMAIL: $EMAIL"
    
    # Simulate a long process (e.g., 2-minute sleep for demo)
    sudo ./newUser.sh $UID $EMAIL
    
    # Here you would put the actual commands that do the work
    echo "Long-running process completed for UID: $UID and EMAIL: $EMAIL"
}

# Start the long-running process in the background
long_running_process &

# Disown the child process so it runs independently
disown

# Exit the script immediately
exit 0
