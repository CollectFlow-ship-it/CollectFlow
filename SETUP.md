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
