#!/usr/bin/env bash
#
# AffiLink — Oracle Cloud (Always Free VM) setup script.
# Tested on Ubuntu 22.04 / 24.04 (Ampere A1 ARM or AMD micro).
#
# Run as a sudo-capable user (e.g. the default `ubuntu`):
#   curl -fsSL ... or: git clone, then  bash deploy/oracle-setup.sh
#
# What it does:
#   1. Installs Node 20 LTS, Caddy (auto-HTTPS), and build tools
#   2. Creates an app user + app/data directories
#   3. Builds the app, pushes the Prisma schema, seeds the admin
#   4. Installs + starts the systemd service and Caddy reverse proxy
#   5. Opens ports 80/443 in the VM firewall
#
# Edit the CONFIG block below (or export the vars) before running.
set -euo pipefail

# ---------- CONFIG ----------
APP_USER="${APP_USER:-affilink}"
APP_DIR="${APP_DIR:-/opt/affilink}"
DATA_DIR="${DATA_DIR:-/var/lib/affilink}"
REPO_URL="${REPO_URL:-https://github.com/minka1902/aliexpress-affiliate.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
DOMAIN="${DOMAIN:-}"            # e.g. affilink.example.com  (leave blank to serve on :80 only)
# ----------------------------

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

if [[ $EUID -eq 0 ]]; then
  echo "Run as a normal sudo user, not root." >&2; exit 1
fi

log "Installing system packages"
sudo apt-get update -y
sudo apt-get install -y curl git build-essential debian-keyring debian-archive-keyring apt-transport-https

if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  log "Installing Node.js 20 LTS"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null; then
  log "Installing Caddy (auto-HTTPS reverse proxy)"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y && sudo apt-get install -y caddy
fi

log "Creating app user and directories"
sudo id -u "$APP_USER" >/dev/null 2>&1 || sudo useradd --system --create-home --shell /bin/bash "$APP_USER"
sudo mkdir -p "$APP_DIR" "$DATA_DIR"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"

log "Fetching source into $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch origin "$REPO_BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" checkout "$REPO_BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/$REPO_BRANCH"
else
  sudo -u "$APP_USER" git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  log "No .env found — copying .env.example to .env (YOU MUST EDIT IT)"
  sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  sudo -u "$APP_USER" sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"file:$DATA_DIR/app.db\"#" "$APP_DIR/.env"
  echo "!!  Edit $APP_DIR/.env (secrets, admin, AliExpress keys), then re-run this script."
  echo "!!  Generate secrets with: openssl rand -base64 32"
  exit 0
fi

log "Installing dependencies + building"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npm ci && npm run build"

log "Applying Prisma schema + seeding admin"
sudo -u "$APP_USER" bash -lc "cd '$APP_DIR' && npx prisma db push && npx tsx prisma/seed.ts"

log "Installing systemd service"
sudo cp "$APP_DIR/deploy/affilink.service" /etc/systemd/system/affilink.service
sudo sed -i "s#@APP_USER@#$APP_USER#g; s#@APP_DIR@#$APP_DIR#g" /etc/systemd/system/affilink.service
sudo systemctl daemon-reload
sudo systemctl enable --now affilink

log "Configuring Caddy"
if [[ -n "$DOMAIN" ]]; then
  printf '%s {\n\treverse_proxy localhost:3000\n}\n' "$DOMAIN" | sudo tee /etc/caddy/Caddyfile >/dev/null
else
  printf ':80 {\n\treverse_proxy localhost:3000\n}\n' | sudo tee /etc/caddy/Caddyfile >/dev/null
fi
sudo systemctl restart caddy

log "Opening firewall ports 80/443 (iptables — OCI images block these by default)"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT  || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
if command -v netfilter-persistent >/dev/null; then sudo netfilter-persistent save || true; fi

log "Done. App service: 'systemctl status affilink'  |  Caddy: 'systemctl status caddy'"
[[ -n "$DOMAIN" ]] && echo "Visit: https://$DOMAIN" || echo "Visit: http://<your-public-ip>"
