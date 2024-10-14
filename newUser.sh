#!/bin/bash



USER_ID=$1
EMAIL=$2
LISTEN_PORT=$3

USERNAME="${EMAIL%@*}"


# Create an LXD VM with the specified name
echo "Creating LXD VM: $USER_ID"

lxc launch ubuntu:focal $USER_ID --vm --config image.architecture=amd64 --config image.description="Ubuntu focal amd64 (20240724_0023)" --config image.os=Ubuntu --config image.release=focal --config image.serial="20240724_0023" --config image.type=disk-kvm.img --config image.variant=desktop
# Wait for the VM to start (if it dose not start in 20 sec ur cooooked)
sleep 40

# Install Apache2 on the LXD VM
echo "Installing Apache2 on the LXD VM: $USER_ID"
lxc exec $USER_ID -- bash -c "export http_proxy=http://10.0.0.11:3128; apt update"
lxc exec $USER_ID -- bash -c "export http_proxy=http://10.0.0.11:3128; apt install -y apache2"

# Create the folder named by the argument in /var/www/html and move index.html into that folder
echo "Setting up Apache2 directory structure"
lxc exec $USER_ID -- bash -c "mkdir -p /var/www/html/$USERNAME"
lxc exec $USER_ID -- bash -c "mv /var/www/html/index.html /var/www/html/$USERNAME/"

# Get the LXD VM IP address
VM_IP=$(lxc list $USER_ID -c 4 | grep enp5s0 | awk '{print $2}')

# Append to the Nginx configuration file
NGINX_CONFIG="/etc/nginx/sites-available/bradensbay.com"
echo "Updating Nginx configuration: $NGINX_CONFIG"
sudo sed -i "/server {/a \
    location /$USERNAME { \
        proxy_pass http://$VM_IP:80"'; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    }' /etc/nginx/sites-available/bradensbay.com

# Test Nginx configuration
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "Nginx configuration test failed"
    exit 1
fi

# Restart Nginx to apply the changes
echo "Restarting Nginx to apply changes"
sudo systemctl restart nginx

if [ $? -ne 0 ]; then
    echo "Failed to restart Nginx"
    exit 1
fi

PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 12)

# Create the new user on the LXD VM
lxc exec "$USER_ID" -- bash -c "useradd -m -G sudo $USERNAME && echo '$USERNAME:$PASSWORD' | chpasswd"
if [ $? -ne 0 ]; then
    echo "Failed to add user '$USERNAME' on LXD VM '$USER_ID'."
    exit 1
fi

# Print the new user's details
echo "User '$USERNAME' has been created on LXD VM '$USER_ID'."
echo "Password: $PASSWORD"



LISTEN_IP="10.0.0.11"


NGINX_CONF="/etc/nginx/nginx.conf"  # Adjust this path if needed

# Check if both arguments are provided
if [ -z "$LISTEN_PORT" ] || [ -z "$VM_IP" ]; then
    echo "Usage: ./add_vm_proxy.sh <listen_port> <vm_ip>"
    exit 1
fi

# Create the server block configuration
NEW_SERVER_BLOCK="
    server {
        listen ${LISTEN_IP}:${LISTEN_PORT};
        proxy_pass ${VM_IP}:22;
    }
"

# Append the new server block to the existing stream section in nginx.conf
# Ensure the configuration file already has a `stream` block
if grep -q "stream {" "$NGINX_CONF"; then
    # Append before the closing '}' of the stream block
    sed -i "/^}/i${NEW_SERVER_BLOCK}" "$NGINX_CONF"
    echo "Added new VM proxy configuration to ${NGINX_CONF}:"
    echo "$NEW_SERVER_BLOCK"
else
    echo "Error: No 'stream' block found in ${NGINX_CONF}. Please ensure it exists."
    exit 1
fi

# Test and reload NGINX configuration
sudo nginx -t && sudo systemctl reload nginx


echo "NGINX configuration reloaded."

sudo ufw allow $LISTEN_PORT

echo "Script completed successfully. The LXD VM '$USER_ID' has been created, and Apache2 has been configured."
