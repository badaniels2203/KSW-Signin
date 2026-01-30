# Reverse Proxy Setup Guide for student.forgelab.duckdns.org

This guide explains how to configure your KSW Student Attendance app to work with your existing nginx reverse proxy.

## Overview

Your setup:
- **Existing nginx** running in Docker on ports 80 and 443
- **WordPress site** already hosted
- **KSW App** needs to be accessible at `student.forgelab.duckdns.org`

## Changes Made to KSW App

### 1. docker-compose.yml
The frontend port mapping has been changed from `8080:80` to `127.0.0.1:8081:80`

This means:
- The app is only accessible from localhost (not from external network)
- Your main nginx will proxy requests to `localhost:8081`
- No port conflicts with your existing nginx

### 2. frontend/nginx.conf
Updated server configuration:
- Removed `default_server` directive (since it's behind a proxy)
- Set `server_name` to `student.forgelab.duckdns.org`

## Steps to Deploy

### Step 1: Update and Rebuild the App

```bash
cd /home/user/KSW-Signin

# Stop the current containers
docker-compose down

# Rebuild with new configuration
docker-compose build

# Start the containers
docker-compose up -d

# Verify containers are running
docker-compose ps

# Test that frontend is accessible on localhost
curl http://localhost:8081
```

### Step 2: Configure Your Main Nginx

You have two options for nginx configuration:

#### Option A: If your nginx is running on the Docker host (recommended)

1. Copy the provided config to your nginx sites-available:
```bash
sudo cp nginx-reverse-proxy-config.conf /etc/nginx/sites-available/student-forgelab
```

2. Create symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/student-forgelab /etc/nginx/sites-enabled/
```

3. Update SSL certificate paths in the config file:
```bash
sudo nano /etc/nginx/sites-available/student-forgelab
```
Update these lines to match your certificate locations:
```nginx
ssl_certificate /etc/letsencrypt/live/student.forgelab.duckdns.org/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/student.forgelab.duckdns.org/privkey.pem;
```

4. Test nginx configuration:
```bash
sudo nginx -t
```

5. Reload nginx:
```bash
sudo systemctl reload nginx
```

#### Option B: If your nginx is running in Docker

If your nginx is containerized, you'll need to:

1. Ensure both your nginx container and KSW containers are on the same Docker network, OR
2. Use `host.docker.internal:8081` instead of `127.0.0.1:8081` in the proxy_pass directive
3. Add the configuration to your nginx container's config directory

### Step 3: SSL Certificate Setup

If you don't have an SSL certificate for `student.forgelab.duckdns.org` yet:

```bash
# Install certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d student.forgelab.duckdns.org

# Certbot will automatically configure nginx for you
# If using manual config, update the paths in the nginx config file
```

### Step 4: DNS Configuration

Ensure your DNS is configured:
1. Go to DuckDNS dashboard
2. Make sure `student.forgelab.duckdns.org` points to your server's IP address

### Step 5: Test the Setup

1. Test HTTP redirect:
```bash
curl -I http://student.forgelab.duckdns.org
# Should return 301 redirect to HTTPS
```

2. Test HTTPS access:
```bash
curl -I https://student.forgelab.duckdns.org
# Should return 200 OK
```

3. Open in browser:
```
https://student.forgelab.duckdns.org
```

## Troubleshooting

### 502 Bad Gateway
- Check if KSW containers are running: `docker-compose ps`
- Check if frontend is accessible: `curl http://localhost:8081`
- Check nginx error logs: `sudo tail -f /var/log/nginx/student-forgelab-error.log`

### Connection Refused
- Verify port 8081 is listening: `sudo netstat -tlnp | grep 8081`
- Check docker logs: `docker-compose logs frontend`

### SSL Certificate Issues
- Verify certificate paths exist
- Check certificate ownership and permissions
- Run: `sudo certbot certificates`

### Database Connection Issues
- Check if postgres container is running
- View backend logs: `docker-compose logs backend`

## File Structure

```
KSW-Signin/
├── docker-compose.yml              (Updated with new port mapping)
├── frontend/
│   └── nginx.conf                  (Updated with server_name)
├── nginx-reverse-proxy-config.conf (New - for main nginx)
└── REVERSE_PROXY_SETUP.md         (This file)
```

## Important Notes

1. **Port 8081** is used internally - the app is only accessible via reverse proxy
2. **SSL is required** - HTTP traffic is redirected to HTTPS
3. **Main nginx** handles SSL termination
4. **App nginx** handles routing between frontend and backend API

## Network Diagram

```
Internet
   ↓
Port 443 (HTTPS)
   ↓
Main Nginx (Docker on host) - student.forgelab.duckdns.org
   ↓
Proxy to localhost:8081
   ↓
KSW Frontend Container (ksw-frontend) - Internal nginx
   ↓
Proxy /api to backend:3001
   ↓
KSW Backend Container (ksw-backend) - Express API
   ↓
PostgreSQL Container (ksw-postgres)
```

## Security Considerations

1. The app is not directly accessible from the internet (only via proxy)
2. SSL/TLS encryption is enforced
3. Security headers are added by the main nginx
4. Database is only accessible from backend container
5. JWT tokens are used for admin authentication

## Maintenance

### Updating the App
```bash
cd /home/user/KSW-Signin
git pull  # if using git
docker-compose down
docker-compose build
docker-compose up -d
```

### Viewing Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres

# Nginx logs
sudo tail -f /var/log/nginx/student-forgelab-access.log
sudo tail -f /var/log/nginx/student-forgelab-error.log
```

### Backup Database
```bash
docker exec ksw-postgres pg_dump -U ksw_user ksw_attendance > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i ksw-postgres psql -U ksw_user -d ksw_attendance
```
