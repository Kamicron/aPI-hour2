# API Hour – application Android

Client Android natif (Kotlin + Jetpack Compose + Material 3) pour le backend `backend/` du dépôt.

## Fonctionnalités (v0.1)

- Connexion (JWT + refresh token automatique, stockés dans DataStore)
- Tableau de bord : chronomètre de session en direct, Pointer / Pause / Reprendre / Arrêter,
  objectif hebdo, heures sup., historique de la semaine, pull-to-refresh
- Calendrier mensuel avec détail par jour (bottom sheet)
- Paramètres : compte, serveur, déconnexion
- Couleurs dynamiques Material You, edge-to-edge, icône adaptative thématisée

## Build

1. Ouvrir le dossier `android/` dans Android Studio (version récente, SDK Platform 37 installé).
2. Laisser Gradle synchroniser, puis lancer sur le téléphone.

En ligne de commande : `./gradlew installDebug` (appareil branché en USB, débogage activé).

L'URL de l'API se règle dans `app/build.gradle.kts` (`API_BASE_URL`, doit finir par `/`).
Par défaut : `https://apihour2back.pi-cto.top/api/`.

## Stack

AGP 9.5 · Kotlin 2.3 · Compose BOM 2026.06 · minSdk 31 · target/compile SDK 37 ·
Retrofit + OkHttp + kotlinx.serialization · DataStore.

## Endpoints utilisés

`POST /auth/login`, `POST /auth/refresh-token`, `GET /session/current`,
`POST /session/{start,pause,resume,stop}`, `GET /stats/{weekly-hours,overtime,range,calendar/{y}/{m}}`.

## Pistes suivantes

Congés, ajout de note / modification de session, notification « Live Update » pendant une session,
widget d'écran d'accueil, tuile Quick Settings pour pointer, cache hors-ligne.
