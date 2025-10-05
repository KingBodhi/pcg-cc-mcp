#!/bin/bash
# Setup script for local database machine
# Run this on your local machine (192.168.1.219)

set -e

echo "🔧 Setting up local database server..."

# Install Tailscale for secure networking
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up
else
    echo "✓ Tailscale already installed"
fi

# Install PostgreSQL if not already installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
else
    echo "✓ PostgreSQL already installed"
fi

# Get Tailscale IP
TAILSCALE_IP=$(tailscale ip -4)
echo "📡 Tailscale IP: $TAILSCALE_IP"

# Configure PostgreSQL to accept Tailscale connections
echo "Configuring PostgreSQL for remote access..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'pcg_secure_password';"

# Update pg_hba.conf to allow Tailscale network
echo "host    all             all             100.64.0.0/10           md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Update postgresql.conf to listen on Tailscale
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '$TAILSCALE_IP,localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "✅ Local database setup complete!"
echo "📝 Connection string: postgresql://postgres:pcg_secure_password@$TAILSCALE_IP:5432/pcg"
echo "📝 Save this connection string for cloud deployment"
