# Port 80 Conflict Troubleshooting Guide

If you're getting a "404 page not found" error when accessing port 80, or if the application isn't working on port 80, there's likely another service using that port.

## Quick Fix: Use Port 8080

The easiest solution is to use port 8080 instead of port 80. The `docker-compose.yml` is configured for this by default.

**Access the application:**
- Student Sign-In: `http://your-ip:8080`
- Admin Portal: `http://your-ip:8080/admin/login`

## Identifying What's Using Port 80

### Method 1: Using lsof (Recommended)

```bash
sudo lsof -i :80
```

**Common outputs and what they mean:**

```
COMMAND     PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
apache2     1234    root    4u  IPv6  12345      0t0  TCP *:http (LISTEN)
```
**Solution:** Apache is running. Stop it with `sudo systemctl stop apache2`

```
COMMAND     PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
nginx       5678    root    6u  IPv4  67890      0t0  TCP *:http (LISTEN)
```
**Solution:** Native nginx is running. Stop it with `sudo systemctl stop nginx`

```
COMMAND       PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
docker-proxy  9012    root    4u  IPv6  45678      0t0  TCP *:http (LISTEN)
```
**Solution:** Docker container is using port 80. Check which container with `docker ps`

### Method 2: Using netstat

```bash
sudo netstat -tulpn | grep :80
```

### Method 3: Using ss (Modern Alternative)

```bash
sudo ss -tulpn | grep :80
```

### Method 4: Using fuser

```bash
sudo fuser -v 80/tcp
```

## Common Culprits and Solutions

### 1. Apache Web Server

**Check if running:**
```bash
systemctl status apache2    # Debian/Ubuntu
systemctl status httpd      # CentOS/RHEL
```

**Stop Apache:**
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2   # Prevent starting on boot
```

### 2. Native Nginx

**Check if running:**
```bash
systemctl status nginx
ps aux | grep nginx | grep -v docker
```

**Stop Nginx:**
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 3. Another Docker Container

**Find containers using port 80:**
```bash
docker ps --format "{{.Names}}: {{.Ports}}" | grep ":80"
```

**Options:**
- Stop the other container: `docker stop <container-name>`
- Change that container's port
- Use port 8080 for KSW-Signin

### 4. Lighttpd, Caddy, or Other Web Servers

**Check all web servers:**
```bash
ps aux | grep -E 'apache|nginx|lighttpd|caddy|httpd' | grep -v grep
```

**Find and stop the service:**
```bash
# List all systemd services
systemctl list-units --type=service | grep -E 'apache|nginx|lighttpd|caddy|httpd'

# Stop the service
sudo systemctl stop <service-name>
```

### 5. Portainer or Other Management Tools

Sometimes Portainer or other Docker management tools use port 80. Check:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

If you see Portainer or another tool on port 80, either:
- Keep KSW-Signin on port 8080
- Change the other service's port

## Permanently Solving Port Conflicts

### Option A: Use Port 8080 (Recommended)

Already configured in `docker-compose.yml`. Just access via:
```
http://your-ip:8080
```

### Option B: Free Up Port 80

1. **Identify the service:**
   ```bash
   sudo lsof -i :80
   ```

2. **Stop and disable it:**
   ```bash
   sudo systemctl stop <service-name>
   sudo systemctl disable <service-name>
   ```

3. **Verify port 80 is free:**
   ```bash
   sudo lsof -i :80
   # Should return nothing
   ```

4. **Update docker-compose.yml:**
   ```yaml
   frontend:
     ports:
       - "80:80"  # Change from 8080:80
   ```

5. **Restart containers:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Option C: Use a Reverse Proxy

Set up Nginx Proxy Manager or Traefik to:
- Handle all services on port 80/443
- Route to different containers based on domain/path
- Provide SSL/TLS certificates

**Example with Nginx Proxy Manager:**
1. Keep KSW-Signin on port 8080
2. Configure Nginx Proxy Manager to route:
   - `attendance.yourdomain.com` → `localhost:8080`
   - `portainer.yourdomain.com` → `localhost:9000`
   - etc.

## Testing After Changes

### Test localhost:
```bash
curl -v http://localhost:8080/health
# Should return: healthy
```

### Test with your IP:
```bash
curl -v http://YOUR_IP:8080/health
# Should return: healthy
```

### Test from browser:
```
http://YOUR_IP:8080
```

## Firewall Considerations

If using a non-standard port, ensure it's open:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8080/tcp
sudo ufw status

# FirewallD (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

## Docker Network Troubleshooting

If containers can't communicate:

```bash
# Check networks
docker network ls

# Inspect the network
docker network inspect ksw-signin_default

# Verify containers are on the same network
docker inspect ksw-frontend | grep NetworkMode
docker inspect ksw-backend | grep NetworkMode
```

## Still Having Issues?

1. **Check container logs:**
   ```bash
   docker logs ksw-frontend
   docker logs ksw-backend
   ```

2. **Verify all containers are running:**
   ```bash
   docker ps | grep ksw
   ```

3. **Test from inside the container:**
   ```bash
   docker exec ksw-frontend wget -qO- http://localhost/health
   ```

4. **Completely rebuild:**
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Summary

**Quickest Solution:** Use port 8080 (already configured)
- Access: `http://your-ip:8080`

**If you need port 80:**
1. Find what's using it: `sudo lsof -i :80`
2. Stop that service
3. Change docker-compose.yml to use port 80
4. Restart containers

Most common causes:
- Apache web server (`apache2` or `httpd`)
- Native nginx installation
- Another Docker container
- Web-based management tools
