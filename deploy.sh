#!/usr/bin/env bash
# Deploiement back / front sur le serveur (Optiplex). A lancer SUR le serveur
# (ou via deploy.ps1 depuis le PC). Idempotent.
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
SVC_USER="apihour2-svc"
SITE_FRONT="https://apihour2.pi-cto.top"
SITE_BACK="https://apihour2back.pi-cto.top"

log() { printf '\n\033[36m== %s ==\033[0m\n' "$*"; }

log "git pull"
git -C "$REPO" pull --ff-only

deploy_back() {
    log "Backend — build"
    cd "$REPO/backend"
    # Le dossier appartient a $SVC_USER (le service tourne avec cet utilisateur) :
    # on se le reattribue le temps du build, puis on le rend au service.
    sudo chown -R "$(id -un):$(id -gn)" "$REPO/backend"
    mvn -q package -DskipTests
    sudo chown -R "$SVC_USER:$SVC_USER" "$REPO/backend"

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
}

deploy_front() {
    log "Front — build"
    cd "$REPO/frontend"
    echo "  node $(node -v 2>/dev/null)  ($(command -v node))"
    npm ci
    npm run build

    log "Front — publication"
    sudo find "$WEBROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    sudo cp -r dist/. "$WEBROOT/"
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
