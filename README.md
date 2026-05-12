# aPI-hour2

Application de gestion des heures de travail avec backend Spring Boot et frontend React.

## 📋 Prérequis

- **Java 17** ou supérieur
- **Maven 3.6+**
- **Node.js 18+** et npm
- **MySQL 8.0+**
- Accès à la base de données MySQL configurée

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd aPI-hour2
```

### 2. Configuration Backend

#### Variables d'environnement

**🔒 Sécurité des credentials**

Les informations sensibles (URL de base de données, username, password) ne doivent **JAMAIS** être commitées dans Git. Le fichier `application.properties` est ignoré par Git et contient vos vraies credentials.

**Étapes de configuration :**

1. **Copiez le fichier d'exemple** :
```bash
cd backend/src/main/resources
cp application.properties.example application.properties
```

2. **Modifiez `application.properties`** avec vos vraies credentials :
```properties
spring.application.name=backend

# Database Configuration
spring.datasource.url=jdbc:mysql://votre-serveur:3306/votre-base
spring.datasource.username=votre_username
spring.datasource.password=votre_mot_de_passe
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
# ... (autres configurations)
```

3. **Vérifiez que `.gitignore` contient** :
```
**/backend/src/main/resources/application.properties
```

**⚠️ IMPORTANT :** 
- `application.properties` = Vos vraies credentials (ignoré par Git)
- `application.properties.example` = Fichier template sans credentials (commité dans Git)

#### Installation des dépendances

```bash
cd backend
mvn clean install
```

### 3. Configuration Frontend

#### Variables d'environnement

**🔒 Sécurité de la configuration**

L'URL de l'API backend ne doit **JAMAIS** être hardcodée. Le fichier `.env` est ignoré par Git et contient votre configuration locale.

**Étapes de configuration :**

1. **Copiez le fichier d'exemple** :
```bash
cd frontend
cp .env.example .env
```

2. **Modifiez `.env`** avec votre URL d'API :
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

3. **Vérifiez que `.gitignore` contient** :
```
.env
.env.local
.env.*.local
```

**⚠️ IMPORTANT :** 
- `.env` = Votre vraie configuration (ignoré par Git)
- `.env.example` = Fichier template (commité dans Git)

#### Installation des dépendances

```bash
cd frontend
npm install
# ou
yarn install
```

## 🏃 Lancement de l'application

### Démarrer le Backend

Depuis le dossier `backend` :

```bash
cd backend
mvn spring-boot:run
```

Le serveur backend sera accessible sur **http://localhost:8080**

**Endpoints API disponibles :**
- `GET /api/users` - Liste tous les utilisateurs
- `GET /api/users/{id}` - Récupère un utilisateur par ID
- `POST /api/users` - Crée un nouvel utilisateur
- `PUT /api/users/{id}` - Met à jour un utilisateur
- `DELETE /api/users/{id}` - Supprime (soft delete) un utilisateur

### Démarrer le Frontend

Depuis le dossier `frontend` :

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur **http://localhost:5173**

## 🧪 Tests

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd frontend
npm test
```

## 📦 Build pour production

### Backend

```bash
cd backend
mvn clean package
```

Le fichier JAR sera généré dans `backend/target/backend-0.0.1-SNAPSHOT.jar`

Pour lancer le JAR :

```bash
java -jar backend/target/backend-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd frontend
npm run build
```

Les fichiers de production seront générés dans `frontend/dist/`

## 🛠️ Stack Technique

### Backend
- **Spring Boot 4.0.6**
- **Spring Data JPA**
- **MySQL Connector**
- **Hibernate**
- **Maven**

### Frontend
- **React 18.3.1**
- **Vite 5.4.0**
- **Axios 1.13.2**
- **Vitest 2.0.0**

## 📝 Structure du projet

```
aPI-hour2/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/apihour/backend/
│   │   │   │   ├── config/         # Configuration (Security, CORS, JWT)
│   │   │   │   ├── controller/     # Contrôleurs REST
│   │   │   │   ├── filter/         # Filtres JWT
│   │   │   │   ├── model/          # Entités JPA
│   │   │   │   ├── repository/     # Repositories JPA
│   │   │   │   └── service/        # Logique métier
│   │   │   └── resources/
│   │   │       ├── application.properties (ignoré par Git)
│   │   │       └── application.properties.example
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/                    # Configuration Axios
│   │   ├── components/             # Composants React (Login, Register, etc.)
│   │   ├── context/                # Context API (AuthContext)
│   │   ├── services/               # Services API
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── .env (ignoré par Git)
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🐛 Dépannage

### Erreur : "No plugin found for prefix 'spring-boot'"

Assurez-vous d'être dans le dossier `backend` avant d'exécuter `mvn spring-boot:run`.

### Erreur de connexion à la base de données

Vérifiez que :
1. MySQL est démarré
2. Les credentials dans `application.properties` sont corrects
3. La base de données `aPi-hour` existe
4. L'utilisateur a les permissions nécessaires

### Port déjà utilisé

Si le port 8080 (backend) ou 5173 (frontend) est déjà utilisé, vous pouvez :

**Backend :** Ajouter dans `application.properties` :
```properties
server.port=8081
```

**Frontend :** Le serveur Vite proposera automatiquement un autre port.

## 📄 Licence

[Votre licence ici]

## 👥 Contributeurs

[Vos contributeurs ici]
