# Migration Base de Données - Production

## ⚠️ IMPORTANT - À lire avant toute manipulation

Cette migration renomme les colonnes de la base de données du format **camelCase** vers **snake_case** pour correspondre à la convention de nommage Hibernate par défaut.

### Prérequis
- ✅ Faire une **sauvegarde complète** de la base de données avant toute opération
- ✅ Tester ces commandes sur un environnement de **développement/staging** d'abord
- ✅ Planifier une fenêtre de maintenance (l'application doit être arrêtée pendant la migration)
- ✅ Vérifier que vous avez les droits `ALTER TABLE` sur la base de données

### Ordre d'exécution
Les commandes doivent être exécutées dans l'ordre suivant pour éviter les erreurs de clés étrangères.

---

## 📋 Étape 1 : Sauvegarde de la base de données

```bash
# Créer une sauvegarde complète
mysqldump -u [username] -p aPi-hour > backup_api-hour_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que la sauvegarde a été créée
ls -lh backup_api-hour_*.sql
```

---

## 🔄 Étape 2 : Migration de la table `users`

La table `users` contient des **colonnes en double** (camelCase et snake_case). Nous devons d'abord migrer les données, puis supprimer les anciennes colonnes.

### 2.1 - Migrer les données vers les colonnes snake_case

```sql
UPDATE users 
SET weekly_hours_goal = COALESCE(weekly_hours_goal, weeklyHoursGoal),
    working_days = COALESCE(working_days, 
        CASE 
            WHEN workingDays LIKE '%,%' THEN LENGTH(workingDays) - LENGTH(REPLACE(workingDays, ',', '')) + 1
            ELSE 5
        END
    ),
    created_at = COALESCE(created_at, createdAt),
    updated_at = COALESCE(updated_at, updatedAt),
    deleted_at = COALESCE(deleted_at, deletedAt);
```

**Explication :**
- `COALESCE` prend la première valeur non-NULL entre les deux colonnes
- Pour `working_days`, on convertit la chaîne `'1,2,3,4,5'` en nombre de jours (5)

### 2.2 - Ajouter la colonne `hourly_rate`

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,4) DEFAULT NULL;
```

### 2.3 - Migrer les données de `hourlyRate` vers `hourly_rate`

```sql
UPDATE users 
SET hourly_rate = COALESCE(hourly_rate, hourlyRate);
```

### 2.4 - Supprimer les anciennes colonnes camelCase

```sql
ALTER TABLE users 
DROP COLUMN weeklyHoursGoal,
DROP COLUMN workingDays,
DROP COLUMN createdAt,
DROP COLUMN updatedAt,
DROP COLUMN deletedAt,
DROP COLUMN hourlyRate;
```

**⚠️ Attention :** Cette opération est **irréversible** sans restauration de la sauvegarde.

---

## 🔄 Étape 3 : Migration de la table `time_entries`

```sql
ALTER TABLE `time_entries` 
  CHANGE COLUMN `createdAt` `created_at` datetime(6) NOT NULL,
  CHANGE COLUMN `updatedAt` `updated_at` datetime(6) NOT NULL,
  CHANGE COLUMN `deletedAt` `deleted_at` datetime(6) DEFAULT NULL,
  CHANGE COLUMN `userId` `user_id` varchar(36) DEFAULT NULL,
  CHANGE COLUMN `startTime` `start_time` timestamp NOT NULL,
  CHANGE COLUMN `endTime` `end_time` timestamp NULL DEFAULT NULL;
```

**Colonnes renommées :**
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `deletedAt` → `deleted_at`
- `userId` → `user_id`
- `startTime` → `start_time`
- `endTime` → `end_time`

---

## 🔄 Étape 4 : Migration de la table `pauses`

```sql
ALTER TABLE `pauses` 
  CHANGE COLUMN `pauseStart` `pause_start` timestamp NOT NULL,
  CHANGE COLUMN `pauseEnd` `pause_end` timestamp NULL DEFAULT NULL,
  CHANGE COLUMN `createdAt` `created_at` datetime(6) NOT NULL,
  CHANGE COLUMN `updatedAt` `updated_at` datetime(6) NOT NULL,
  CHANGE COLUMN `timeEntryId` `time_entry_id` varchar(36) DEFAULT NULL,
  CHANGE COLUMN `deletedAt` `deleted_at` datetime(6) DEFAULT NULL;
```

**Colonnes renommées :**
- `pauseStart` → `pause_start`
- `pauseEnd` → `pause_end`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `timeEntryId` → `time_entry_id`
- `deletedAt` → `deleted_at`

---

## 🔄 Étape 5 : Migration de la table `user_sessions`

```sql
ALTER TABLE `user_sessions` 
  CHANGE COLUMN `createdAt` `created_at` datetime(6) NOT NULL,
  CHANGE COLUMN `updatedAt` `updated_at` datetime(6) NOT NULL,
  CHANGE COLUMN `userId` `user_id` varchar(36) DEFAULT NULL,
  CHANGE COLUMN `timeEntryId` `time_entry_id` varchar(36) DEFAULT NULL,
  CHANGE COLUMN `pauseId` `pause_id` varchar(36) DEFAULT NULL;
```

**Colonnes renommées :**
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `userId` → `user_id`
- `timeEntryId` → `time_entry_id`
- `pauseId` → `pause_id`

---

## ✅ Étape 6 : Vérification post-migration

### 6.1 - Vérifier la structure des tables

```sql
-- Vérifier la table users
DESCRIBE users;

-- Vérifier la table time_entries
DESCRIBE time_entries;

-- Vérifier la table pauses
DESCRIBE pauses;

-- Vérifier la table user_sessions
DESCRIBE user_sessions;
```

### 6.2 - Vérifier l'intégrité des données

```sql
-- Compter les enregistrements dans chaque table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'time_entries', COUNT(*) FROM time_entries
UNION ALL
SELECT 'pauses', COUNT(*) FROM pauses
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions;
```

### 6.3 - Tester une requête de jointure

```sql
-- Vérifier que les clés étrangères fonctionnent toujours
SELECT 
    u.email,
    te.start_time,
    te.end_time,
    COUNT(p.id) as pause_count
FROM users u
LEFT JOIN time_entries te ON te.user_id = u.id
LEFT JOIN pauses p ON p.time_entry_id = te.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, te.id
LIMIT 5;
```

---

## 🚀 Étape 7 : Redémarrage de l'application

1. **Vérifier** que toutes les migrations ont réussi
2. **Redémarrer** le backend Spring Boot
3. **Tester** les fonctionnalités principales :
   - Connexion utilisateur
   - Démarrage d'une session
   - Mise en pause
   - Arrêt de session
   - Affichage de l'historique

---

## 🔙 Procédure de rollback (en cas de problème)

Si quelque chose ne fonctionne pas après la migration :

```bash
# Arrêter l'application
# Restaurer la sauvegarde
mysql -u [username] -p aPi-hour < backup_api-hour_[timestamp].sql

# Redémarrer l'application avec l'ancienne version du code
```

---

## 📝 Checklist de migration

- [ ] Sauvegarde de la base de données créée et vérifiée
- [ ] Application arrêtée (backend + frontend)
- [ ] Migration testée sur environnement de staging
- [ ] Étape 2 : Table `users` migrée
- [ ] Étape 3 : Table `time_entries` migrée
- [ ] Étape 4 : Table `pauses` migrée
- [ ] Étape 5 : Table `user_sessions` migrée
- [ ] Vérifications post-migration effectuées
- [ ] Application redémarrée
- [ ] Tests fonctionnels validés
- [ ] Sauvegarde post-migration créée

---

## 📞 Support

En cas de problème pendant la migration :
1. **NE PAS PANIQUER** - vous avez une sauvegarde
2. Arrêter immédiatement les opérations
3. Restaurer la sauvegarde
4. Analyser les logs d'erreur
5. Contacter l'équipe technique si nécessaire

---

**Date de création :** 13 mai 2026  
**Version :** 1.0  
**Auteur :** Équipe technique aPI-hour
