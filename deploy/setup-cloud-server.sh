#!/bin/bash
# Setup script for cloud server hosting the application
# Run this on your cloud server (DigitalOcean, AWS, etc.)

set -e

echo "🌐 Setting up cloud application server..."

# Install dependencies
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    sudo npm install -g pnpm
fi

# Install Rust
if ! command -v cargo &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Install Tailscale for secure DB connection
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up
else
    echo "✓ Tailscale already installed"
fi

# Get Tailscale IP
TAILSCALE_IP=$(tailscale ip -4)
echo "📡 Cloud Server Tailscale IP: $TAILSCALE_IP"

# Clone repository
if [ ! -d "$HOME/pcg-dashboard-mcp" ]; then
    echo "Cloning repository..."
    cd $HOME
    git clone https://github.com/PowerClubGlobal/pcg-dashboard-mcp.git
    cd pcg-dashboard-mcp
else
    echo "Updating repository..."
    cd $HOME/pcg-dashboard-mcp
    git pull
fi

# Install dependencies and build
echo "Building application..."
pnpm install
pnpm run build
cargo build --release

echo "✅ Cloud server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Get the Tailscale IP from your local database machine"
echo "2. Create .env file with: DATABASE_URL=postgresql://postgres:pcg_secure_password@<LOCAL_TAILSCALE_IP>:5432/pcg"
echo "3. Run: sudo bash deploy/setup-nginx.sh console.powerclubglobal.com"
echo "4. Run: sudo systemctl enable pcg-server && sudo systemctl start pcg-server"
