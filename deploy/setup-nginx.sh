#!/bin/bash
# Nginx and SSL setup script
# Usage: sudo bash setup-nginx.sh <domain>
# Example: sudo bash setup-nginx.sh console.powerclubglobal.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: sudo bash setup-nginx.sh <domain>"
    exit 1
fi

echo "🌐 Configuring Nginx for $DOMAIN..."

# Create Nginx config
cat > /etc/nginx/sites-available/pcg-console << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend static files
    location / {
        root /home/ubuntu/pcg-dashboard-mcp/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/pcg-console /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

echo "✅ Nginx configured for $DOMAIN"
echo ""
echo "📝 Getting SSL certificate..."

# Get SSL certificate
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@powerclubglobal.com

echo "✅ SSL certificate installed!"
echo ""
echo "🌐 Your application will be available at: https://$DOMAIN"
