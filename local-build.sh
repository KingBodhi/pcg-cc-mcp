#!/bin/bash

set -e  # Exit on any error

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist/macos-arm64

echo "🔨 Building frontend..."
(cd frontend && npm run build)

echo "🔨 Building Rust binaries..."
cargo build --release --manifest-path Cargo.toml
cargo build --release --bin mcp_task_server --manifest-path Cargo.toml

echo "📦 Creating distribution package..."

APP_BASENAME="pcg-cc"
MCP_BASENAME="pcg-cc-mcp"

# Copy the main binary
cp target/release/server "${APP_BASENAME}"
zip -q "${APP_BASENAME}.zip" "${APP_BASENAME}"
rm -f "${APP_BASENAME}"
mv "${APP_BASENAME}.zip" "npx-cli/dist/macos-arm64/${APP_BASENAME}.zip"

# Copy the MCP binary
cp target/release/mcp_task_server "${MCP_BASENAME}"
zip -q "${MCP_BASENAME}.zip" "${MCP_BASENAME}"
rm -f "${MCP_BASENAME}"
mv "${MCP_BASENAME}.zip" "npx-cli/dist/macos-arm64/${MCP_BASENAME}.zip"

echo "✅ NPM package ready!"
echo "📁 Files created:"
echo "   - npx-cli/dist/macos-arm64/${APP_BASENAME}.zip"
echo "   - npx-cli/dist/macos-arm64/${MCP_BASENAME}.zip"
