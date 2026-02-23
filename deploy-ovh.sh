#!/bin/bash

# --- CONFIGURATION ---
DOMAIN="feedingreen.com" # Change to feedint.tn if confirmed
EMAIL="admin@$DOMAIN"
REPO_URL="https://github.com/Oussamajm2255/Feedin-Agri.git"
DB_NAME="smart_farm_db"
DB_USER="farm_admin"
DB_PASS=$(openssl rand -base64 12)
JWT_SECRET=$(openssl rand -base64 32)

echo "🚀 Starting Smart Farm Deployment on OVH (Self-Hosted All-in-One)..."

# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
sudo apt install -y curl git nginx ufw postgresql postgresql-contrib certbot python3-certbot-nginx docker.io docker-compose

# 3. Enable Firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 1883    # MQTT Port
sudo ufw allow 8084    # MQTT WebSocket (if needed)
sudo ufw --force enable

# 4. Setup Redis & MQTT (Docker)
sudo docker run -d --name redis --restart always -p 6379:6379 redis:alpine
sudo docker run -d --name mosquitto --restart always -p 1883:1883 -p 9001:9001 eclipse-mosquitto

# 4. Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 5. Database Setup
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 6. Clone & Build Backend
mkdir -p ~/smart-farm
cd ~/smart-farm
git clone $REPO_URL app
cd app/smart-farm-backend

npm install
npm run build

# Create .env
cat <<EOT > .env
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
DB_MIGRATIONS_RUN=true
DB_SYNCHRONIZE=false
EOT

# Start Backend
pm2 start dist/main.js --name "smart-farm-api"
pm2 save
pm2 startup

# 7. Build & Deploy Frontend
cd ../smart-farm-frontend
npm install
npm run build:prod

sudo mkdir -p /var/www/smart-farm-frontend
sudo cp -r dist/smart-farm-frontend/browser/* /var/www/smart-farm-frontend/
sudo chown -R www-data:www-data /var/www/smart-farm-frontend

# 8. Nginx Configuration
cat <<EOT | sudo tee /etc/nginx/sites-available/smart-farm.conf
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/smart-farm-frontend;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOT

sudo ln -s /etc/nginx/sites-available/smart-farm.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 9. SSL with Certbot (Optional: requires DNS to be pointed)
# sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d api.$DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "------------------------------------------------"
echo "✅ Deployment Complete!"
echo "🌐 Domain: $DOMAIN"
echo "🔧 API: api.$DOMAIN"
echo "🔑 Database Password: $DB_PASS"
echo "------------------------------------------------"
