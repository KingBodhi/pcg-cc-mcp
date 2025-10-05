# PCG Dashboard Deployment Guide

Deploy PCG Dashboard on a public domain while keeping the database on your local machine.

## Architecture

- **Cloud Server**: Hosts the web application at console.powerclubglobal.com
- **Local Machine**: Runs PostgreSQL database securely
- **Tailscale VPN**: Secure tunnel connecting cloud to local database

## Prerequisites

1. Cloud server (DigitalOcean, AWS, Linode, etc.) with Ubuntu 22.04+
2. Local machine with database (your Pop!_OS desktop)
3. Domain name pointing to cloud server IP
4. Tailscale account (free)

## Step 1: Setup Local Database Machine

On your local machine (192.168.1.219):

```bash
cd ~/pcg-dashboard-mcp
chmod +x deploy/setup-local-db.sh
bash deploy/setup-local-db.sh
```

**Save the Tailscale IP and connection string displayed!**

## Step 2: Setup Cloud Server

On your cloud server:

```bash
# Clone repository
git clone https://github.com/PowerClubGlobal/pcg-dashboard-mcp.git
cd pcg-dashboard-mcp

# Run setup script
chmod +x deploy/setup-cloud-server.sh
bash deploy/setup-cloud-server.sh
```

## Step 3: Configure Database Connection

On cloud server, create environment file:

```bash
# Replace TAILSCALE_IP with the IP from Step 1
echo "DATABASE_URL=postgresql://postgres:pcg_secure_password@TAILSCALE_IP:5432/pcg" > .env
```

Update systemd service:

```bash
# Edit the service file to replace TAILSCALE_IP
sed -i 's/TAILSCALE_IP/<actual-tailscale-ip>/' deploy/pcg-server.service

# Install service
sudo cp deploy/pcg-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pcg-server
sudo systemctl start pcg-server
```

## Step 4: Configure Nginx and SSL

On cloud server:

```bash
chmod +x deploy/setup-nginx.sh
sudo bash deploy/setup-nginx.sh console.powerclubglobal.com
```

## Step 5: Verify Deployment

1. Check server status:
```bash
sudo systemctl status pcg-server
```

2. Check logs:
```bash
sudo journalctl -u pcg-server -f
```

3. Visit https://console.powerclubglobal.com

## Troubleshooting

### Database Connection Issues

Check Tailscale connectivity:
```bash
tailscale ping <local-machine-tailscale-ip>
```

Test database connection:
```bash
psql postgresql://postgres:pcg_secure_password@<local-tailscale-ip>:5432/pcg
```

### Service Not Starting

Check logs:
```bash
sudo journalctl -u pcg-server -n 50
```

### SSL Certificate Issues

Renew certificate:
```bash
sudo certbot renew
```

## Updating the Application

On cloud server:

```bash
cd ~/pcg-dashboard-mcp
git pull
pnpm install
pnpm run build
cargo build --release
sudo systemctl restart pcg-server
```

## Security Notes

- Database is only accessible via Tailscale VPN
- All web traffic uses HTTPS
- GitHub OAuth required for authentication
- Keep Tailscale running on both machines
- Regular backups recommended for local database

## Alternative: Cloudflare Tunnel (No VPN Required)

If you prefer not to use Tailscale, you can use Cloudflare Tunnel to expose your local database:

**On local machine:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

cloudflared tunnel login
cloudflared tunnel create pcg-db
cloudflared tunnel route dns pcg-db db.powerclubglobal.com
```

Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/bodhi/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: db.powerclubglobal.com
    service: tcp://localhost:5432
  - service: http_status:404
```

Run tunnel:
```bash
cloudflared tunnel run pcg-db
```

Then use `db.powerclubglobal.com:5432` as your database host.
