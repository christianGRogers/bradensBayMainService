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


# Get the LXD VM IP address
VM_IP=$(lxc list $USER_ID -c 4 | grep enp5s0 | awk '{print $2}')

# Append to the Nginx configuration file
NGINX_CONFIG="/etc/nginx/sites-available/bradensbay.com"
echo "Updating Nginx configuration: $NGINX_CONFIG"
sudo sed -i "/server_name bradensbay.com;/a \
    location /$USERNAME { \
        proxy_pass http://$VM_IP:80; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto \$scheme; \
    }" /etc/nginx/sites-available/bradensbay.com

# Test Nginx configuration
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "Nginx configuration test failed"
    exit 1
fi

sudo systemctl restart nginx

if [ $? -ne 0 ]; then
    echo "Failed to restart Nginx after http"
    exit 1
fi



##############################################


LISTEN_IP="10.0.0.11"


NEW_SERVER_BLOCK="
    server {
        listen ${LISTEN_IP}:${LISTEN_PORT};
        proxy_pass ${VM_IP}:22;
    }
"
sudo sed -i "/stream {/a \
    server {\
        listen ${LISTEN_IP}:${LISTEN_PORT};\
        proxy_pass ${VM_IP}:22;\
    }" /etc/nginx/nginx.conf


sudo nginx -t && sudo systemctl reload nginx
if [ $? -ne 0 ]; then
    echo "Failed to restart Nginx after ssh"
    exit 1
fi
#######################################


sudo ufw allow $LISTEN_PORT

