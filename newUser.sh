#!/bin/bash

# Ensure script is run with one argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <vm-name>"
    exit 1
fi

VM_NAME=$1

# Create an LXD VM with the specified name
echo "Creating LXD VM: $VM_NAME"

lxc launch ubuntu:focal $VM_NAME --vm --config image.architecture=amd64 --config image.description="Ubuntu focal amd64 (20240724_0023)" --config image.os=Ubuntu --config image.release=focal --config image.serial="20240724_0023" --config image.type=disk-kvm.img --config image.variant=desktop
# Wait for the VM to be fully initialized
sleep 100

# Install Apache2 on the LXD VM
echo "Installing Apache2 on the LXD VM: $VM_NAME"
lxc exec $VM_NAME -- bash -c "export http_proxy=http://10.0.0.11:3128; apt update"
lxc exec $VM_NAME -- bash -c "export http_proxy=http://10.0.0.11:3128; apt install -y apache2"

# Create the folder named by the argument in /var/www/html and move index.html into that folder
echo "Setting up Apache2 directory structure"
lxc exec $VM_NAME -- bash -c "mkdir -p /var/www/html/$VM_NAME"
lxc exec $VM_NAME -- bash -c "mv /var/www/html/index.html /var/www/html/$VM_NAME/"

# Get the LXD VM IP address
VM_IP=$(lxc list $VM_NAME -c 4 | grep enp5s0 | awk '{print $2}')

# Append to the Nginx configuration file
NGINX_CONFIG="/etc/nginx/sites-available/bradensbay.com"
echo "Updating Nginx configuration: $NGINX_CONFIG"
sudo bash -c "cat <<EOL > $NGINX_CONFIG
server {
    listen 81;
    server_name bradensbay.com;

    location /$VM_NAME {
        proxy_pass http://$VM_IP:80;
EOL

echo '
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        return 404;
    }
}' | cat - >>$NGINX_CONFIG"

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

echo "Script completed successfully. The LXD VM '$VM_NAME' has been created, and Apache2 has been configured."
