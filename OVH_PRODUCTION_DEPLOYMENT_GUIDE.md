# Smart Farm Application - OVH Production Deployment Guide

This document outlines the comprehensive process for deploying the Smart Farm application (Angular frontend, NestJS backend, MySQL/PostgreSQL databases) to an OVH production environment from a senior developer's perspective.

---

## 1. Architecture Overview
For a reliable production deployment on OVH, the recommended architecture is:
- **Server:** OVH VPS (e.g., VPS Elite) or OVH Public Cloud Compute Instance running **Ubuntu 22.04 LTS or 24.04 LTS**.
- **Reverse Proxy / Web Server:** **Nginx** (Handles load balancing, SSL, static file serving, and reverse proxy to the backend).
- **Backend:** **NestJS** application running as a Node.js process managed by **PM2**.
- **Frontend:** **Angular** serving static pre-compiled files via Nginx.
- **Database:** **PostgreSQL/MySQL** running natively or via Docker, isolated from public internet access.
- **Security & SSL:** Let's Encrypt / Certbot, UFW Firewall, and OVH Network Firewall.

---

## 2. Initial Server Provisioning & Security (OVH Control Panel)

### 2.1 Server Setup
1. **Provision Instance**: Purchase providing adequate resources based on load (minimum 4GB RAM, 2 vCPUs recommended for combined DB + Backend). 
2. **Assign Static/Failover IP**: Ensure your OVH instance has a dedicated IPv4 address.
3. **Configure OVH Network Firewall**: Log into the OVH Control Panel, navigate to your IP, and enable the infrastructure-level firewall. Allow only inbound ports `22` (SSH), `80` (HTTP), and `443` (HTTPS).

### 2.2 OS Hardening
Log into your server to configure basic security:

```bash
# Update System Packages
sudo apt update && sudo apt upgrade -y

# Create a dedicated, non-root user for deployment
sudo adduser farm_admin
sudo usermod -aG sudo farm_admin

# Switch to new user
su - farm_admin

# Setup SSH key authentication for farm_admin (upload your public key to ~/.ssh/authorized_keys)

# Disable root login and password authentication
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

# Restart SSH service
sudo systemctl restart ssh

# Enable UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Install Fail2Ban to prevent brute-force attacks
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 3. Environment Preparation

### 3.1 Install Node.js & Process Manager
Install Node.js (v20+ LTS recommended) via NVM to avoid permission issues and allow easy version management.

```bash
# Install NVM and Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Install PM2 (Process Manager for NestJS) globally
npm install -g pm2
# Set PM2 to start on boot
pm2 startup systemd
```

### 3.2 Install & Configure Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

---

## 4. Database Setup & Migration (PostgreSQL / MySQL)

### 4.1 Native Installation (PostgreSQL Example)
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 4.2 Hardening the Database
Ensure the database does **NOT** accept connections from outside.
For PostgreSQL, edit `/etc/postgresql/14/main/postgresql.conf` (ensure `listen_addresses = 'localhost'`).
Create the database and the DB user:
```sql
sudo -u postgres psql
# In the psql shell:
CREATE DATABASE smart_farm_db;
CREATE USER farm_db_user WITH ENCRYPTED PASSWORD 'StrongSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE smart_farm_db TO farm_db_user;
\q
```

### 4.3 Database Migration
Your migrations should be executed automatically via NestJS tooling during deployment.

---

## 5. NestJS Backend Deployment

### 5.1 Clone & Build
In the `/var/www/` or your user directory, clone the repository.
```bash
# Setup directory 
mkdir -p ~/smart-farm/backend && cd ~/smart-farm/backend
# (Assume code is cloned here via Git)

# Install Dependencies securely
npm ci

# Build the project
npm run build
```

### 5.2 Environment Variables
Create the production environment file `~/smart-farm/backend/.env`:
```env
NODE_ENV=production
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=farm_db_user
DB_PASS=StrongSecurePassword123!
DB_NAME=smart_farm_db
JWT_SECRET=super_secret_production_key_here
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
DB_MIGRATIONS_RUN=true
DB_SYNCHRONIZE=false
```

### 5.3 Backend Production Optimizations
Ensure your `main.ts` includes:
- **Helmet**: `app.use(helmet());` to set security-related HTTP headers.
- **Rate Limiting**: `app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));` to protect against DDoS.
- **CORS Handling**: `app.enableCors({ origin: process.env.FRONTEND_URL });`
- **Validation Pipes**: Disable detailed error messages in prod (`disableErrorMessages: true`).

### 5.4 Run with PM2 (Cluster Mode)
Using Cluster mode allows NestJS to utilize all available CPU cores.
```bash
# Start backend in cluster mode
pm2 start dist/main.js --name "smart-farm-api" -i max
pm2 save
```
Set up log rotation to prevent infinite disk usage by logs:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 6. Angular Frontend Deployment

### 6.1 Production Build
Locally or via CI/CD, build the Angular app. Make sure `environment.prod.ts` points to your production API URL (e.g., `https://api.your-domain.com`).

```bash
# From the frontend directory:
npm run build -- --configuration production
```

### 6.2 Transfer Files
Copy the contents of the generated `dist/` folder to `/var/www/smart-farm-frontend`.

```bash
sudo mkdir -p /var/www/smart-farm-frontend
# Ensure correct ownership
sudo chown -R www-data:www-data /var/www/smart-farm-frontend
```

---

## 7. Domain Configuration & Nginx Reverse Proxy

### 7.1 DNS Configuration (OVH)
In the OVH Control Panel, add the following `A` Records pointing to your Server's IP:
- `@` (Root domain) -> `Server_IP`
- `www` -> `Server_IP`
- `api` -> `Server_IP`

### 7.2 Nginx Server Blocks
Create a new configuration block: `sudo nano /etc/nginx/sites-available/smart-farm.conf`

```nginx
# Map for WebSocket support if used in your NestJS app
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# ---------------------------------------------
# FRONTEND CONFIGURATION (Angular)
# ---------------------------------------------
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/smart-farm-frontend/browser; # Or /html depending on Angular version output
    index index.html;

    # Gzip Compression for Frontend Assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_min_length 1000;

    location / {
        # History API Fallback for Angular Routing
        try_files $uri $uri/ /index.html;
    }

    # Caching Static Assets
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|webp)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public, max-age=15552000, immutable";
    }
}

# ---------------------------------------------
# BACKEND CONFIGURATION (NestJS Reverse Proxy)
# ---------------------------------------------
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for longer requests (if required for data processing)
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/smart-farm.conf /etc/nginx/sites-enabled/
# Remove default Nginx config
sudo rm /etc/nginx/sites-enabled/default
# Test Config and Reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL Certificates (HTTPS) Setup

Install Certbot for automatic Let's Encrypt certificates.

```bash
sudo apt install certbot python3-certbot-nginx -y

# Generate and apply certificates automatically
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Auto-renewal is automatically set up by Certbot via systemd timers. Check its status:
sudo systemctl status certbot.timer
```

*(Note: The `proxy_set_header X-Forwarded-Proto $scheme;` in Nginx enables NestJS to properly understand requests are over HTTPS after termination).*

---

## 9. Backup & Disaster Recovery Strategy

### 9.1 Database Backups
Create a cron job to automatically backup the database and push it securely to OVH Object Storage or an S3-compatible service using tools like `s3cmd` or `aws-cli`.

Create `~/scripts/db_backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/farm_admin/backups"
TIMESTAMP=$(date +%F_%T)
DB_NAME="smart_farm_db"
FILENAME="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql.gz"

# Dump and zip
sudo -u postgres pg_dump $DB_NAME | gzip > $FILENAME

# Keep only the last 7 days of backups
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

# (Optional) AWS CLI upload command:
# aws s3 cp $FILENAME s3://my-ovh-backup-bucket/
```
Make executable and add to crontab:
```bash
chmod +x ~/scripts/db_backup.sh
crontab -e
# Add line to run every day at 3:00 AM:
# 0 3 * * * /home/farm_admin/scripts/db_backup.sh >/dev/null 2>&1
```

---

## 10. Load Balancing & Scaling (Optional Next Steps)
If traffic exceeds a single node's capacity:
1. **OVH Load Balancer**: Purchase an OVH Managed Load Balancer. Point your DNS to the LB IP.
2. **Horizontal Scaling**: Provision a second VPS/Public Cloud node. Clone the NestJS/Nginx configuration. 
3. **Externalize Database**: Move the PostgreSQL database from a single VPS to **OVH Managed Databases for PostgreSQL** or a dedicated underlying bare metal server.
4. **State Management**: If nodes are balanced, avoid local session storage (NestJS should use Redis) and ensure files are stored on an S3-compatible object store, not the local file system.

---

## 11. Monitoring Setup
For comprehensive health observability:
- **Server Health**: Install **Netdata** (`bash <(curl -Ss https://my-netdata.io/kickstart.sh)`) for instant real-time metrics on CPU, Memory, Disk I/O, and Nginx. Secure Netdata behind Nginx basic auth or restrict to VPN IP.
- **Application Monitoring**: Integrate **Sentry** (`@sentry/node` and `@sentry/angular-ivy`) directly into the codebase to track runtime errors.
- **Uptime Monitoring**: Configure a free tier of **UptimeRobot** or use **OVH's built-in monitoring alerts** to notify you via email/SMS if the server stops answering on port 443.

---

## Continuous Deployment Note
For future deployments outside of this exact guide setup, it is highly recommended to automate this pipeline using **GitHub Actions**, **GitLab CI/CD**, or **Bitbucket Pipelines**. They can automatically build the apps, SSH into your server, `git pull`, `npm install`, and run `pm2 reload smart-farm-api` to achieve near zero-downtime deployments.
