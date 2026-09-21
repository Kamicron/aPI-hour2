# Déploiement — Optiplex (réseau local)

Cible : MySQL partagé (`db.pi-cto.top`) + back Spring Boot (service systemd,
`127.0.0.1:8082`) + front statique servi par nginx. Front et back sont sur
deux sous-domaines séparés (`apihour2.pi-cto.top` / `apihour2back.pi-cto.top`),
le CORS est géré côté Spring (`CorsConfig.java`).

Remplace `OPTIPLEX_IP` par l'IP de l'Optiplex si besoin (`192.168.1.51`).

---

## 0. Depuis le PC — pousser le code

```bash
git add -A
git commit -m "chore: config déploiement Optiplex"
git push
```

---

## 1. Optiplex — prérequis

```bash
sudo apt update
sudo apt install -y git nginx openjdk-17-jdk maven nodejs npm
java -version   # doit afficher 17
node -v         # >= 20 souhaité ; sinon voir nvm
```

---

## 2. Base de données (MySQL)

La base `aPi-hour` sur `db.pi-cto.top` existe peut-être déjà (partagée avec
d'autres apps de la famille pi-cto). Si c'est le cas, passe directement à
l'étape 3 et récupère juste des identifiants dédiés. Sinon, sur le serveur
MySQL :

```sql
CREATE DATABASE `aPi-hour` CHARACTER SET utf8mb4;
CREATE USER 'apihour2'@'%' IDENTIFIED BY 'un_mot_de_passe';
GRANT ALL PRIVILEGES ON `aPi-hour`.* TO 'apihour2'@'%';
FLUSH PRIVILEGES;
```

La base reste **vide** : Hibernate (`ddl-auto=update`) crée les tables au 1er
démarrage du back.

---

## 3. Cloner

```bash
sudo mkdir -p /opt/apihour2 && sudo chown $USER:$USER /opt/apihour2
git clone https://github.com/Kamicron/aPI-hour2.git /opt/apihour2
cd /opt/apihour2
```

---

## 4. Backend

### 4.1 Build

```bash
cd /opt/apihour2/backend
mvn -q clean package -DskipTests
# -> target/backend-0.0.1-SNAPSHOT.jar
```

### 4.2 Config (env)

```bash
sudo mkdir -p /etc/apihour2
sudo tee /etc/apihour2/apihour2.env >/dev/null <<'EOF'
DB_URL=jdbc:mysql://db.pi-cto.top:3306/aPi-hour
DB_USERNAME=apihour2
DB_PASSWORD=un_mot_de_passe
SERVER_PORT=8082
JWT_SECRET=change_moi_en_une_valeur_longue_et_aleatoire
MAIL_USERNAME=apihour.contact@gmail.com
MAIL_PASSWORD=un_app_password_gmail
FRONTEND_URL=https://apihour2.pi-cto.top
EOF
sudo chmod 600 /etc/apihour2/apihour2.env
```

> `SERVER_PORT=8082` : sur un serveur qui héberge plusieurs apps, vérifie
> qu'aucune autre n'utilise déjà ce port (InsPI = 8081, PI-CTO2 = 8090).

### 4.3 Service systemd

```bash
sudo tee /etc/systemd/system/apihour2-back.service >/dev/null <<'EOF'
[Unit]
Description=aPI-hour2 backend
After=network.target

[Service]
User=apihour2-svc
Group=apihour2-svc
EnvironmentFile=/etc/apihour2/apihour2.env
WorkingDirectory=/opt/apihour2/backend
ExecStart=/usr/bin/java -jar /opt/apihour2/backend/target/backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo useradd -r -s /usr/sbin/nologin apihour2-svc 2>/dev/null || true
sudo chown -R apihour2-svc:apihour2-svc /opt/apihour2/backend/target

sudo systemctl daemon-reload
sudo systemctl enable --now apihour2-back
sudo systemctl status apihour2-back --no-pager
journalctl -u apihour2-back -f          # suivre les logs (Ctrl+C pour quitter)
```

Test local sur l'Optiplex :
```bash
curl http://127.0.0.1:8082/api/health
```

---

## 5. Frontend

### 5.1 Build

```bash
cd /opt/apihour2/frontend
# .env.production est déjà versionné (VITE_API_BASE_URL=https://apihour2back.pi-cto.top/api)
npm ci
npm run build
# -> dist/
sudo mkdir -p /var/www/apihour2
sudo rm -rf /var/www/apihour2/*
sudo cp -r dist/* /var/www/apihour2/
```

### 5.2 nginx

Les configs (front statique + reverse-proxy dédié pour le back, cache long
terme + gzip sur les assets buildés) sont versionnées dans
[`deploy/nginx/apihour2.pi-cto.top`](deploy/nginx/apihour2.pi-cto.top) et
[`deploy/nginx/apihour2back.pi-cto.top`](deploy/nginx/apihour2back.pi-cto.top).
`deploy.sh` les réinstalle et recharge nginx à chaque déploiement — pas
besoin de les retaper à la main :

```bash
sudo cp /opt/apihour2/deploy/nginx/apihour2.pi-cto.top /etc/nginx/sites-available/apihour2.pi-cto.top
sudo cp /opt/apihour2/deploy/nginx/apihour2back.pi-cto.top /etc/nginx/sites-available/apihour2back.pi-cto.top
sudo ln -sf /etc/nginx/sites-available/apihour2.pi-cto.top /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/apihour2back.pi-cto.top /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> Premier déploiement seulement : les fichiers versionnés supposent un
> certificat SSL déjà généré par Certbot (`# managed by Certbot`). Avant de
> les copier tels quels, déploie d'abord une version HTTP simple (sans les
> blocs `listen 443 ssl`), lance `sudo certbot --nginx -d apihour2.pi-cto.top`
> puis `sudo certbot --nginx -d apihour2back.pi-cto.top`, et enfin recopie
> le contenu généré par Certbot dans ces fichiers versionnés pour que
> `deploy.sh` puisse les réinstaller ensuite sans y retoucher.
>
> Le port du reverse-proxy du back (8082) doit correspondre à `SERVER_PORT`
> dans `/etc/apihour2/apihour2.env`.

---

## 6. Vérifier

Depuis n'importe quel appareil du réseau : `https://apihour2.pi-cto.top/`
→ l'app doit charger.

`https://apihour2back.pi-cto.top/api/health` → `{"ok":true,"service":"apihour"}`.

---

## Mettre à jour plus tard

### Script (recommandé)

Depuis le **PC**, à la racine du repo :

```powershell
.\deploy.ps1          # back + front
.\deploy.ps1 back     # backend seul
.\deploy.ps1 front    # front seul
```

`deploy.ps1` fait `git push` puis, en SSH sur l'Optiplex : `git pull` →
`bash deploy.sh <cible>`. `deploy.sh` build, redémarre `apihour2-back`,
republie le front, réinstalle les configs nginx et vérifie les codes HTTP.

Directement sur l'Optiplex : `cd /opt/apihour2 && git pull && bash deploy.sh`.

### À la main (si le script échoue)

```bash
cd /opt/apihour2 && git pull
cd backend && sudo rm -rf target && mvn -q package -DskipTests \
  && sudo chown -R apihour2-svc:apihour2-svc target && sudo systemctl restart apihour2-back
cd ../frontend && npm ci && npm run build \
  && sudo rm -rf /var/www/apihour2/* \
  && sudo cp -r dist/. /var/www/apihour2/
```
