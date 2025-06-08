#!/bin/bash

# Update system
dnf update -y

# Install Node.js 18 (compatible with Amazon Linux 2023)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install nginx for reverse proxy (optional)
dnf install -y nginx

# Create application directory
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

# Create nginx configuration for reverse proxy (optional)
cat > /etc/nginx/conf.d/app.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Configure PM2 to start on boot
sudo -u ec2-user bash -c 'pm2 startup systemd -u ec2-user --hp /home/ec2-user'

# Create a simple status page
echo "EC2 instance for ${project_name} is ready!" > /var/log/user-data.log 