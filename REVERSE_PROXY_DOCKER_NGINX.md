# Reverse Proxy Setup for Dockerized Nginx

This guide is for when your main nginx server is running in a Docker container (not natively on Ubuntu).

## Key Differences from Native Nginx

1. **Network connectivity** - Docker containers can't access `localhost:8081` on the host by default
2. **Configuration files** - Need to be mounted into the nginx container
3. **SSL certificates** - Must be accessible to the container
4. **Reload commands** - Use Docker commands instead of systemctl

## Network Setup Options

You have three options for allowing your nginx container to access the KSW app:

### Option 1: Use the Same Docker Network (Recommended)

This is the cleanest approach - both containers communicate via Docker's internal network.

#### Step 1: Create a shared network (if you don't have one)
```bash
docker network create webproxy
```

#### Step 2: Update your nginx container to use this network
Add to your nginx's docker-compose.yml or docker run command:
```yaml
networks:
  - webproxy
```

#### Step 3: Update KSW app's docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    # ... existing postgres config ...
    networks:
      - ksw-internal

  backend:
    # ... existing backend config ...
    networks:
      - ksw-internal

  frontend:
    build: ./frontend
    container_name: ksw-frontend
    ports:
      # Remove the port mapping or keep for direct access during testing
      # - "127.0.0.1:8081:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - ksw-internal
      - webproxy  # Add this to connect to nginx

networks:
  ksw-internal:
    driver: bridge
  webproxy:
    external: true  # Use the existing network
```

#### Step 4: Update nginx config to use container name
In your nginx configuration, use the container name instead of localhost:
```nginx
proxy_pass http://ksw-frontend:80;
```

---

### Option 2: Use host.docker.internal (Docker Desktop/Mac/Windows)

If you're using Docker Desktop on Mac or Windows, you can use `host.docker.internal`.

#### Step 1: Keep KSW app port mapping
Keep this in docker-compose.yml:
```yaml
frontend:
  ports:
    - "127.0.0.1:8081:80"
```

#### Step 2: Update nginx config
```nginx
proxy_pass http://host.docker.internal:8081;
```

**Note:** This doesn't work on native Linux Docker. Use Option 1 or 3 instead.

---

### Option 3: Use Host Network Mode (Linux Only)

This makes the container use the host's network directly.

#### Step 1: Keep KSW app port mapping
```yaml
frontend:
  ports:
    - "127.0.0.1:8081:80"
```

#### Step 2: Update your nginx container
Add `network_mode: host` to your nginx container configuration:

```yaml
# In your nginx docker-compose.yml
services:
  nginx:
    image: nginx:latest
    network_mode: host
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt
    restart: unless-stopped
```

#### Step 3: Use localhost in nginx config
```nginx
proxy_pass http://127.0.0.1:8081;
```

**Drawback:** The container shares all host network interfaces, which may have security implications.

---

## Complete Setup Steps (Using Option 1 - Recommended)

### 1. Create Shared Network
```bash
docker network create webproxy
```

### 2. Update KSW App Configuration

Edit `/home/user/KSW-Signin/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: ksw-postgres
    environment:
      POSTGRES_DB: ksw_attendance
      POSTGRES_USER: ksw_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change_this_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - ksw-internal

  backend:
    build: ./backend
    container_name: ksw-backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ksw_attendance
      DB_USER: ksw_user
      DB_PASSWORD: ${DB_PASSWORD:-change_this_password}
      JWT_SECRET: ${JWT_SECRET:-change_this_secret_key}
      PORT: 3001
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - ksw-internal

  frontend:
    build: ./frontend
    container_name: ksw-frontend
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - ksw-internal
      - webproxy

networks:
  ksw-internal:
    driver: bridge
  webproxy:
    external: true

volumes:
  postgres_data:
```

### 3. Create Nginx Configuration File

Create a file for your nginx container to use. Let's say your nginx config directory is at `/path/to/nginx/conf.d/`:

```bash
# Copy the config file
cp /home/user/KSW-Signin/nginx-reverse-proxy-config.conf /path/to/nginx/conf.d/student-forgelab.conf
```

Edit the file and change the `proxy_pass` line:
```nginx
# Change from:
proxy_pass http://127.0.0.1:8081;

# To:
proxy_pass http://ksw-frontend:80;
```

**Complete nginx configuration for Docker:**

```nginx
# HTTP server - redirects to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name student.forgelab.duckdns.org;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name student.forgelab.duckdns.org;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/student.forgelab.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/student.forgelab.duckdns.org/privkey.pem;

    # SSL Configuration (Modern)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL Session Cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/student-forgelab-access.log;
    error_log /var/log/nginx/student-forgelab-error.log;

    # Client body size
    client_max_body_size 10M;

    # Proxy to KSW frontend container (using container name)
    location / {
        proxy_pass http://ksw-frontend:80;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Disable buffering for real-time applications
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Ensure Your Nginx Container Has Correct Setup

Your nginx docker-compose.yml should look something like this:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    container_name: main-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # Mount your configuration directory
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      # Mount SSL certificates
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /etc/ssl/certs:/etc/ssl/certs:ro
      # Optional: custom nginx.conf
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      # Mount log directory (optional)
      - ./nginx/logs:/var/log/nginx
    networks:
      - webproxy
    restart: unless-stopped

networks:
  webproxy:
    external: true
```

### 5. Deploy the Changes

```bash
# Step 1: Stop and rebuild KSW app with new network config
cd /home/user/KSW-Signin
docker-compose down
docker-compose up -d

# Step 2: Verify KSW containers are on the webproxy network
docker network inspect webproxy
# You should see ksw-frontend in the containers list

# Step 3: Reload your nginx container
cd /path/to/your/nginx/
docker-compose restart nginx

# Or if using docker run:
docker restart main-nginx

# Or reload nginx without restarting:
docker exec main-nginx nginx -t  # Test config
docker exec main-nginx nginx -s reload  # Reload
```

### 6. Verify Connectivity

```bash
# Test that nginx can reach the KSW app
docker exec main-nginx curl -I http://ksw-frontend:80
# Should return 200 OK

# Check nginx error logs
docker logs main-nginx

# Or view live logs
docker logs -f main-nginx
```

### 7. Test from Outside

```bash
# Test HTTP redirect
curl -I http://student.forgelab.duckdns.org
# Should return 301 redirect

# Test HTTPS
curl -I https://student.forgelab.duckdns.org
# Should return 200 OK

# Or open in browser
https://student.forgelab.duckdns.org
```

---

## SSL Certificate Setup with Dockerized Nginx

If you need to obtain SSL certificates with a dockerized nginx:

### Using Certbot with Nginx Container

```bash
# Option 1: Run certbot in standalone mode (stop nginx first)
docker stop main-nginx

docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 -p 443:443 \
  certbot/certbot certonly --standalone \
  -d student.forgelab.duckdns.org

docker start main-nginx

# Option 2: Use webroot method (nginx stays running)
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /path/to/nginx/html:/var/www/html \
  certbot/certbot certonly --webroot \
  -w /var/www/html \
  -d student.forgelab.duckdns.org
```

### Certificate Renewal

Set up a cron job for automatic renewal:

```bash
# Edit crontab
crontab -e

# Add this line (runs twice daily)
0 0,12 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/lib/letsencrypt:/var/lib/letsencrypt certbot/certbot renew --quiet && docker exec main-nginx nginx -s reload
```

---

## Troubleshooting

### 1. Nginx Can't Connect to KSW App

**Error:** `502 Bad Gateway` or `connect() failed`

**Solutions:**
```bash
# Check if containers are on same network
docker network inspect webproxy

# Check if ksw-frontend is running
docker ps | grep ksw-frontend

# Test connectivity from nginx container
docker exec main-nginx ping ksw-frontend
docker exec main-nginx curl http://ksw-frontend:80

# Check KSW frontend logs
docker logs ksw-frontend
```

### 2. SSL Certificate Not Found

**Error:** `cannot load certificate` or `no such file or directory`

**Solutions:**
```bash
# Verify certificates exist on host
ls -la /etc/letsencrypt/live/student.forgelab.duckdns.org/

# Verify certificates are mounted in nginx container
docker exec main-nginx ls -la /etc/letsencrypt/live/student.forgelab.duckdns.org/

# Check volume mounts
docker inspect main-nginx | grep -A 10 Mounts
```

### 3. Configuration File Not Loading

**Solutions:**
```bash
# Verify config file exists and is mounted
docker exec main-nginx cat /etc/nginx/conf.d/student-forgelab.conf

# Test nginx configuration
docker exec main-nginx nginx -t

# Check for syntax errors
docker logs main-nginx
```

### 4. DNS Not Resolving

```bash
# Test from inside nginx container
docker exec main-nginx nslookup student.forgelab.duckdns.org

# Test DNS from host
nslookup student.forgelab.duckdns.org
```

### 5. Port Already in Use

**Error:** `address already in use`

**Solutions:**
```bash
# Find what's using the port
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting service or container
docker ps  # Find conflicting container
docker stop <container-name>
```

---

## Directory Structure Example

```
/home/user/
├── KSW-Signin/                          # Your KSW app
│   ├── docker-compose.yml               # Updated with webproxy network
│   ├── frontend/
│   ├── backend/
│   └── ...
│
└── nginx/                               # Your nginx setup
    ├── docker-compose.yml               # Nginx container config
    ├── conf.d/
    │   ├── student-forgelab.conf        # KSW proxy config
    │   └── wordpress.conf               # Your WordPress config
    ├── nginx.conf                       # Main nginx config (optional)
    └── logs/                            # Log directory
        ├── student-forgelab-access.log
        └── student-forgelab-error.log
```

---

## Quick Reference Commands

```bash
# Restart nginx container
docker restart main-nginx

# Reload nginx configuration
docker exec main-nginx nginx -s reload

# Test nginx configuration
docker exec main-nginx nginx -t

# View nginx logs
docker logs -f main-nginx

# View KSW app logs
docker logs -f ksw-frontend
docker logs -f ksw-backend

# Check network connectivity
docker network inspect webproxy

# Access nginx container shell
docker exec -it main-nginx bash

# Access KSW frontend container shell
docker exec -it ksw-frontend sh
```

---

## Summary of Key Changes

| Native Nginx | Dockerized Nginx |
|-------------|------------------|
| Config in `/etc/nginx/sites-available/` | Config mounted via volume |
| `sudo systemctl reload nginx` | `docker exec main-nginx nginx -s reload` |
| `proxy_pass http://127.0.0.1:8081;` | `proxy_pass http://ksw-frontend:80;` |
| Direct file system access | Must mount volumes |
| System logs in `/var/log/nginx/` | Container logs or mounted volume |

The main difference is using **container names** instead of `localhost` and using **Docker commands** instead of systemctl.
