#!/usr/bin/env bash
# ============================================================================
# One-shot setup for a fresh Ubuntu VM (Oracle Cloud Always Free, EC2, etc.)
#
# Installs Docker, builds ForenSync, and runs it on port 80 so the site is
# reachable at http://<your-server-ip>/ with nothing else to configure.
# Safe to re-run: it rebuilds and replaces the running container.
#
# Usage on the server:
#   curl -fsSL https://raw.githubusercontent.com/Sanidhya-Jindal/forensync/main/deploy_vm.sh | bash
# or, if the repo is already cloned:
#   bash deploy_vm.sh
# ============================================================================
set -euo pipefail

REPO_URL="https://github.com/Sanidhya-Jindal/forensync.git"
APP_DIR="$HOME/forensync"
CONTAINER="forensync"

log() { echo ""; echo "=== $* ==="; }

log "1/6 Installing Docker (if needed)"
if ! command -v docker >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl git
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
    sudo systemctl enable --now docker
else
    echo "Docker already installed."
fi

log "2/6 Getting the code"
if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" fetch --all -q
    git -C "$APP_DIR" reset --hard origin/main -q
    echo "Updated existing checkout."
else
    sudo apt-get install -y git >/dev/null 2>&1 || true
    git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

log "3/6 Opening port 80 in the OS firewall"
# Oracle images ship with restrictive iptables rules by default.
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
if command -v netfilter-persistent >/dev/null 2>&1; then
    sudo netfilter-persistent save || true
fi

log "4/6 Building the image (this takes 15-25 minutes the first time)"
sudo docker build -t forensync:latest .

log "5/6 Starting the app"
sudo docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
sudo docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p 80:8000 \
    -v forensync_qdrant:/app/qdrant_data \
    -v forensync_photos:/app/photos \
    forensync:latest

log "6/6 Waiting for it to come up"
IP="$(curl -fsSL --max-time 10 https://api.ipify.org 2>/dev/null || echo 'YOUR-SERVER-IP')"
for i in $(seq 1 60); do
    if curl -fsS --max-time 3 http://localhost/health >/dev/null 2>&1; then
        echo ""
        echo "============================================================"
        echo "  ForenSync is LIVE at:  http://$IP/"
        echo "============================================================"
        echo ""
        echo "If that link doesn't open, the cloud firewall still needs port 80"
        echo "allowed in the Oracle console (Security List / ingress rule)."
        exit 0
    fi
    sleep 5
done

echo ""
echo "Server didn't answer in time. Check the logs with:"
echo "  sudo docker logs -f $CONTAINER"
exit 1
