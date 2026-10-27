# Guide d'installation (étape 1)

Ce guide met en ligne la connexion et l'espace privé par entreprise. Comptez 20 à 30 minutes. Il n'y a rien à installer sur votre ordinateur.

## 1. Créer la base de données (Supabase)

1. Créez un compte sur https://supabase.com puis cliquez sur **New project**.
2. Donnez un nom (par exemple `collectflow`), choisissez un mot de passe de base de données (notez-le dans un gestionnaire de mots de passe) et une région en Europe.
3. Quand le projet est prêt, ouvrez **SQL Editor** puis **New query**.
4. Ouvrez le fichier `supabase/migrations/0001_init.sql` de ce dépôt, copiez tout son contenu, collez-le dans l'éditeur et cliquez sur **Run**. Le message attendu est « Success ».
5. Ouvrez **Project Settings** puis **API**. Notez deux valeurs :
   - **Project URL** (de la forme `https://xxxx.supabase.co`)
   - la clé publique **anon public**

   N'utilisez jamais la clé `service_role` dans ce projet.

## 2. Mettre le site en ligne (Vercel)

1. Créez un compte sur https://vercel.com en choisissant **Continue with GitHub**.
2. Cliquez sur **Add New… > Project**, puis **Import** le dépôt `CollectFlow`.
3. Avant de cliquer sur **Deploy**, ouvrez **Environment Variables** et ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = la Project URL notée plus haut
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clé anon public
4. Cliquez sur **Deploy**. À la fin, Vercel affiche l'adresse de votre site (par exemple `https://collectflow-xxxx.vercel.app`).

Si le déploiement échoue, copiez le message d'erreur (onglet **Build Logs**) et envoyez-le moi : c'est la première compilation du projet, et il peut rester une correction à faire.

## 3. Autoriser votre site dans Supabase

Dans Supabase, ouvrez **Authentication > URL Configuration** :

- **Site URL** : l'adresse de votre site Vercel.
- **Redirect URLs** : ajoutez `https://votre-adresse.vercel.app/auth/callback`.

Sans cela, le lien de confirmation reçu par e-mail ne ramène pas au site.

## 4. Vérifier que tout fonctionne

1. Ouvrez votre site et cliquez sur **Créer un compte**.
2. Ouvrez l'e-mail de confirmation, cliquez sur le lien : vous arrivez sur « Bienvenue ».
3. Saisissez le nom d'une entreprise : vous voyez l'écran avec les prochaines étapes.
4. Cliquez sur **Se déconnecter**, puis reconnectez-vous.
5. Essayez d'ouvrir `/app` dans une fenêtre de navigation privée : vous devez être renvoyé vers la connexion.

## Bon à savoir

- L'envoi d'e-mails par défaut de Supabase est limité et prévu pour les tests. Avant d'accueillir de vrais clients, on branchera Resend comme expéditeur.
- L'offre gratuite de Vercel est destinée à un usage non commercial. Avant de vendre le service, vérifiez leurs conditions : un abonnement payant sera probablement nécessaire.
- Ne partagez jamais vos clés secrètes dans un message ou un fichier du dépôt.

---

# Mise à jour : étape 2 (factures)

Après chaque dépôt de code sur GitHub, Vercel redéploie le site tout seul en 1 à 2 minutes (onglet **Deployments** pour suivre).

## 1. Ajouter la table des factures (Supabase)

1. Supabase, **SQL Editor**, **New query**.
2. Ouvrez `supabase/migrations/0002_invoices.sql` dans GitHub, copiez tout son contenu, collez-le et cliquez sur **Run**. Résultat attendu : « Success. No rows returned ».
3. Ne rejouez pas `0001_init.sql` : il est déjà appliqué.

## 2. Tester

1. Connectez-vous au site : le menu en haut affiche maintenant **Accueil** et **Factures**.
2. **Factures**, puis **Importer un fichier CSV**, puis **Télécharger un modèle**.
3. Ouvrez le modèle, remplacez les lignes par quelques factures de test (échéances passées ou futures), enregistrez en CSV et déposez-le : un aperçu apparaît avant l'enregistrement.
4. Cliquez sur **Importer** : la liste s'affiche avec les retards en couleur.
5. Essayez **Mettre en pause**, **Marquer payée**, puis **Remettre en impayée** et **Supprimer**.
6. Réimportez le même fichier : le message indique que les numéros déjà connus sont ignorés.
7. Faites un test d'erreur : mettez une date « 31/02/2026 » ou un e-mail sans @ dans une ligne, l'aperçu doit la signaler avec son numéro de ligne.

Utilisez de fausses adresses e-mail pour ces tests : rien n'est envoyé à ce stade.

---

# Mise à jour : étape 3 (scénarios de relance)

## 1. Ajouter les tables (Supabase)

1. Supabase, **SQL Editor**, **New query**.
2. Copiez le contenu de `supabase/migrations/0003_reminder_steps.sql` (dossier `supabase`, puis `migrations` sur GitHub), collez-le et cliquez sur **Run**. Résultat attendu : « Success. No rows returned ».
3. Ne rejouez pas `0001` ni `0002`.

## 2. Tester (après le redéploiement Vercel, 1 à 2 minutes)

1. Le menu en haut affiche maintenant **Scénarios**. À la première visite, 4 étapes sont créées : J+3 amical, J+10 formel, J+20 ferme, J+35 mise en demeure.
2. Dans **Réglages**, saisissez le taux de pénalités et l'indemnité de vos conditions de vente, ainsi que vos instructions de paiement (IBAN…), puis **Enregistrer les réglages**.
3. Ouvrez une étape, modifiez le message : l'aperçu à droite change en direct. Si vous avez importé des factures en retard, l'aperçu utilise la plus en retard.
4. Cliquez sur une variable (par exemple `{montant}`) : elle s'insère à l'endroit du curseur.
5. Tapez volontairement une variable fausse (`{nom_clent}`) : un message d'erreur apparaît et le bouton d'enregistrement se bloque.
6. **Enregistrer l'étape**, rechargez la page : vos changements sont conservés.
7. Ajoutez une étape à J+15, puis supprimez-la. Essayez d'en ajouter une deuxième au même jour : un message l'interdit.

Rien n'est envoyé à ce stade. Les modèles sont indicatifs : faites relire la mise en demeure par votre conseil avant tout envoi réel.

---

# Mise à jour : étape 4 (envoi des relances)

Cette étape envoie de vrais e-mails, après validation de votre part. Faites d'abord tous les essais avec vos propres adresses.

## 1. Ajouter le journal (Supabase)

1. **SQL Editor**, **New query**, collez le contenu de `supabase/migrations/0004_reminders.sql`, **Run**. Résultat attendu : « Success. No rows returned ».
2. Faites-le **avant** d'ouvrir le site après le redéploiement : la page Scénarios lit une colonne ajoutée par ce fichier.

## 2. Créer le service d'envoi (Resend)

1. Créez un compte sur https://resend.com.
2. Menu **API Keys**, **Create API Key**, droit **Sending access**. Copiez la clé (elle commence par `re_` et ne s'affiche qu'une fois).
3. **Ne collez jamais cette clé dans une conversation ni dans GitHub.** Elle va uniquement dans Vercel.
4. Sur Vercel : votre projet, **Settings**, **Environment Variables**, ajoutez `RESEND_API_KEY` avec la clé. Puis **Deployments**, trois points sur le dernier déploiement, **Redeploy** (sans cela, la clé n'est pas prise en compte).

## 3. Tester sans risque

1. Sur le site, **Scénarios**, **Réglages** : renseignez votre adresse e-mail de réponse, puis enregistrez.
2. **Relances**, bouton **M'envoyer un e-mail de test** : vous recevez un exemple à l'adresse de votre compte. Vérifiez aussi les courriers indésirables.
3. Tant que vous n'avez pas de domaine vérifié chez Resend, l'adresse d'expédition de test de Resend ne peut écrire **qu'à l'adresse e-mail de votre compte Resend**. Pour tester une vraie relance, utilisez donc, dans votre fichier CSV, **votre propre adresse** comme e-mail du client (la même que celle de votre compte Resend).
4. Importez cette facture de test avec une échéance dépassée de plus de 3 jours : elle apparaît dans **À valider**. Lisez le message, cliquez sur **Envoyer**, puis vérifiez le **Journal**.
5. Cliquez une seconde fois ou rechargez : la relance ne peut pas partir deux fois.

## 4. Avant de contacter de vrais clients

- Il faudra un **nom de domaine** vérifié chez Resend (quelques lignes DNS à ajouter chez votre registraire), puis la variable `MAIL_FROM_ADDRESS` sur Vercel (par exemple `relances@votre-domaine.fr`). Sans cela, les e-mails ne peuvent pas partir vers vos clients.
- La **mise en demeure** n'est pas envoyée par e-mail : CollectFlow affiche la lettre et vous la postez en recommandé avec accusé de réception, puis vous cliquez sur « J'ai envoyé le courrier ».
