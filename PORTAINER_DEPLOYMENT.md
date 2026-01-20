# Portainer Deployment Guide

This guide covers deploying the KSW Attendance System using Portainer.

## Common Issues and Solutions

### Issue 1: Cannot Access Frontend on Port 80

**Problem**: The frontend container is running but you can't access it via browser.

**Solutions**:

1. **Check Port Bindings in Portainer**:
   - Go to Containers → ksw-frontend → inspect
   - Verify that port 80 is mapped: `0.0.0.0:80->80/tcp`
   - If using a different host port, access via `http://your-ip:PORT`

2. **Network Mode**:
   - Ensure containers are on the same network
   - In Portainer Stack settings, verify network mode is `bridge` (default)

3. **Firewall Settings**:
   - Check if port 80 is open on your host:
     ```bash
     sudo ufw status
     sudo ufw allow 80/tcp
     ```

4. **Port Already in Use**:
   - Check if another service is using port 80:
     ```bash
     sudo netstat -tulpn | grep :80
     ```
   - If port 80 is taken, modify `docker-compose.yml`:
     ```yaml
     frontend:
       ports:
         - "8080:80"  # Use port 8080 instead
     ```

### Issue 2: Backend Cannot Connect to Database

**Problem**: Backend shows database connection errors.

**Solutions**:

1. **Environment Variables**:
   - In Portainer, go to Stacks → Your Stack → Environment Variables
   - Ensure these are set:
     ```
     JWT_SECRET=your-secret-key
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=admin123
     ```

2. **Container Network**:
   - All containers must be on the same Docker network
   - Portainer automatically creates a network per stack

3. **Database Initialization**:
   - Wait 30-60 seconds for database to fully initialize
   - Check postgres container logs in Portainer

### Issue 3: Environment Variables Not Loading

**Problem**: Environment variables from `.env` file not working.

**Solution**:

In Portainer, you need to manually add environment variables:

1. Go to: Stacks → Your Stack → Editor
2. Scroll down to "Environment variables"
3. Add each variable:
   ```
   JWT_SECRET=your-very-secure-random-secret-key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   ```
4. Click "Update the stack"

**OR** use the Web Editor to paste your variables:
```
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Deployment Steps for Portainer

### Method 1: Deploy from Git Repository (Recommended)

1. In Portainer, go to **Stacks** → **Add stack**

2. Select **Repository** option

3. Enter repository details:
   - **Repository URL**: `https://github.com/badaniels2203/KSW-Signin`
   - **Repository reference**: `claude/student-attendance-tracker-N757H`
   - **Compose path**: `docker-compose.yml`

4. Add Environment Variables:
   ```
   JWT_SECRET=your-very-secure-random-secret-key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=change-this-password
   ```

5. Click **Deploy the stack**

6. Wait 30-60 seconds for containers to start

7. Access the application:
   - Frontend: `http://your-server-ip`
   - Admin: `http://your-server-ip/admin/login`

### Method 2: Deploy from Uploaded docker-compose.yml

1. In Portainer, go to **Stacks** → **Add stack**

2. Select **Web editor**

3. Copy and paste your `docker-compose.yml` content

4. Add Environment Variables as described above

5. Click **Deploy the stack**

### Method 3: Deploy Individual Containers

If you prefer manual control:

1. **Create a network**:
   - Networks → Add network
   - Name: `ksw-network`
   - Driver: `bridge`

2. **Deploy PostgreSQL**:
   - Containers → Add container
   - Name: `ksw-postgres`
   - Image: `postgres:15-alpine`
   - Network: `ksw-network`
   - Environment variables:
     - `POSTGRES_DB=ksw_attendance`
     - `POSTGRES_USER=ksw_user`
     - `POSTGRES_PASSWORD=ksw_password`
   - Volume: Create volume `postgres_data` → `/var/lib/postgresql/data`
   - Port: `5432:5432`

3. **Deploy Backend**:
   - Build image from repository or upload Dockerfile
   - Name: `ksw-backend`
   - Network: `ksw-network`
   - Environment variables (see docker-compose.yml)
   - Port: `3001:3001`
   - Restart policy: `unless-stopped`

4. **Deploy Frontend**:
   - Build image from repository or upload Dockerfile
   - Name: `ksw-frontend`
   - Network: `ksw-network`
   - Port: `80:80`
   - Restart policy: `unless-stopped`

## Verifying Deployment

### Check Container Status

1. Go to **Containers** in Portainer
2. Verify all 3 containers are running (green status):
   - `ksw-postgres`
   - `ksw-backend`
   - `ksw-frontend`

### Check Logs

1. Click on each container
2. Go to **Logs** tab
3. Look for:
   - **Postgres**: `database system is ready to accept connections`
   - **Backend**: `Server running on port 3001`
   - **Frontend**: Nginx startup messages

### Test Connectivity

1. **Frontend Health Check**:
   ```bash
   curl http://your-server-ip/health
   # Should return: healthy
   ```

2. **Backend Health Check**:
   ```bash
   curl http://your-server-ip:3001/api/health
   # Should return: {"status":"OK","timestamp":"..."}
   ```

3. **Database Connection**:
   ```bash
   docker exec ksw-postgres psql -U ksw_user -d ksw_attendance -c "SELECT 1;"
   # Should return: 1
   ```

## Troubleshooting Commands

### View Container Logs
```bash
# Via Portainer UI: Containers → Select Container → Logs

# Or via CLI:
docker logs ksw-frontend
docker logs ksw-backend
docker logs ksw-postgres
```

### Restart Containers
```bash
# Via Portainer UI: Containers → Select Container → Restart

# Or via CLI:
docker restart ksw-frontend
docker restart ksw-backend
docker restart ksw-postgres
```

### Rebuild Frontend After nginx.conf Change
```bash
# Via Portainer UI:
# Stacks → Your Stack → Editor → Pull and redeploy

# Or via CLI:
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Check Network Configuration
```bash
docker network ls
docker network inspect ksw-signin_default
```

### Access Container Shell
```bash
# Via Portainer UI: Containers → Select Container → Console → Connect

# Or via CLI:
docker exec -it ksw-frontend sh
docker exec -it ksw-backend sh
docker exec -it ksw-postgres sh
```

## Port Configuration for Different Scenarios

### Scenario 1: Standard Port 80 (Default)
```yaml
frontend:
  ports:
    - "80:80"
```
Access: `http://your-ip`

### Scenario 2: Alternative Port (e.g., 8080)
```yaml
frontend:
  ports:
    - "8080:80"
```
Access: `http://your-ip:8080`

### Scenario 3: Behind Reverse Proxy (e.g., Nginx Proxy Manager)
```yaml
frontend:
  ports:
    - "3000:80"  # Internal port
  networks:
    - proxy-network
    - default
```
Configure your reverse proxy to point to `ksw-frontend:80`

## Security Recommendations for Production

1. **Change Default Credentials**:
   - Update `ADMIN_PASSWORD` immediately
   - Use strong, random passwords

2. **Secure JWT Secret**:
   - Generate a random secret:
     ```bash
     openssl rand -base64 32
     ```
   - Update `JWT_SECRET` environment variable

3. **Use HTTPS**:
   - Set up SSL/TLS certificate
   - Use Nginx Proxy Manager or Traefik
   - Or use Cloudflare Tunnel

4. **Restrict Database Access**:
   - Remove database port mapping in production:
     ```yaml
     postgres:
       # Comment out or remove:
       # ports:
       #   - "5432:5432"
     ```

5. **Network Isolation**:
   - Use custom Docker networks
   - Don't expose internal services publicly

6. **Regular Backups**:
   - Schedule database backups
   - Store backups off-site

## Updating the Application

### Via Portainer UI

1. Go to **Stacks** → Your Stack
2. Click **Editor**
3. Make changes or update repository reference
4. Click **Update the stack**
5. Check **Re-pull image and redeploy** if using latest tag
6. Click **Update**

### Via CLI

```bash
cd /path/to/KSW-Signin
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Support

If you encounter issues:

1. Check container logs in Portainer
2. Verify environment variables are set correctly
3. Ensure all containers are on the same network
4. Check firewall settings
5. Review this troubleshooting guide

For additional help, check the main README.md or open an issue on GitHub.
