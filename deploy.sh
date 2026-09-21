#!/usr/bin/env bash
# Deploiement back / front sur l'Optiplex. A lancer SUR l'Optiplex (ou via
# deploy.ps1 depuis le PC). Idempotent.
#
#   bash deploy.sh            # back + front
#   bash deploy.sh back
#   bash deploy.sh front
set -euo pipefail
[ -f "$HOME/.profile" ] && . "$HOME/.profile"

TARGET="${1:-all}"
REPO="/opt/apihour2"
WEBROOT="/var/www/apihour2"
SERVICE="apihour2-back"
SITE_FRONT="https://apihour2.pi-cto.top"
SITE_BACK="https://apihour2back.pi-cto.top"

log() { printf '\n\033[36m== %s ==\033[0m\n' "$*"; }

# Charge nvm : en SSH non-interactif le PATH ne contient que le node systeme
# (souvent trop vieux). nvm.sh n'aime pas set -u -> on relache autour.
load_node() {
    set +eu
    for d in "$NVM_DIR" "$HOME/.config/nvm" "$HOME/.nvm"; do
        if [ -n "$d" ] && [ -s "$d/nvm.sh" ]; then
            export NVM_DIR="$d"
            . "$d/nvm.sh"
            nvm use --lts >/dev/null 2>&1 || nvm use node >/dev/null 2>&1
            break
        fi
    done
    set -eu
}

log "git pull"
git -C "$REPO" pull --ff-only

deploy_back() {
    log "Backend — build"
    cd "$REPO/backend"
    sudo rm -rf target
    mvn -q package -DskipTests
    sudo chown -R apihour2-svc:apihour2-svc target
    log "Backend — restart $SERVICE"
    sudo systemctl restart "$SERVICE"
    sleep 3
    if systemctl is-active --quiet "$SERVICE"; then
        echo "  $SERVICE actif"
    else
        echo "  $SERVICE inactif — 40 dernieres lignes :"
        journalctl -u "$SERVICE" -n 40 --no-pager
        exit 1
    fi
    deploy_nginx_back
}

deploy_front() {
    log "Front — build"
    cd "$REPO/frontend"
    load_node
    echo "  node $(node -v 2>/dev/null)  ($(command -v node))"
    node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
    if [ "$node_major" -lt 20 ]; then
        echo "!! Node $(node -v 2>/dev/null) trop ancien — le front exige Node >= 20."
        echo "   nvm introuvable ou version < 20. Sur l'Optiplex : nvm install --lts"
        exit 1
    fi
    npm ci
    npm run build
    log "Front — publication"
    sudo rm -rf "${WEBROOT:?}"/*
    sudo cp -r dist/. "$WEBROOT/"
    deploy_nginx_front
}

deploy_nginx_front() {
    log "nginx — config front (cache + gzip)"
    sudo cp "$REPO/deploy/nginx/apihour2.pi-cto.top" /etc/nginx/sites-available/apihour2.pi-cto.top
    sudo ln -sf /etc/nginx/sites-available/apihour2.pi-cto.top /etc/nginx/sites-enabled/apihour2.pi-cto.top
    sudo nginx -t
    sudo systemctl reload nginx
}

deploy_nginx_back() {
    log "nginx — config back (reverse-proxy)"
    sudo cp "$REPO/deploy/nginx/apihour2back.pi-cto.top" /etc/nginx/sites-available/apihour2back.pi-cto.top
    sudo ln -sf /etc/nginx/sites-available/apihour2back.pi-cto.top /etc/nginx/sites-enabled/apihour2back.pi-cto.top
    sudo nginx -t
    sudo systemctl reload nginx
}

case "$TARGET" in
    back)  deploy_back ;;
    front) deploy_front ;;
    all)   deploy_back; deploy_front ;;
    *) echo "usage: bash deploy.sh [all|back|front]"; exit 1 ;;
esac

log "Vérification"
code_front=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_FRONT/")
echo "  front  $code_front   $SITE_FRONT/"

# Le backend peut prendre quelques secondes a finir son demarrage apres le
# restart du service : on repolle l'API plutot que de la taper une seule
# fois, pour eviter un faux "KO" pendant que Spring Boot boot.
code_api=""
for _ in $(seq 1 12); do
    code_api=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_BACK/api/health")
    [ "$code_api" = "200" ] && break
    sleep 5
done
echo "  api    $code_api   $SITE_BACK/api/health"

if [ "$code_front" = "200" ] && [ "$code_api" = "200" ]; then
    echo "OK"
else
    echo "!! codes HTTP inattendus"
    exit 1
fi
