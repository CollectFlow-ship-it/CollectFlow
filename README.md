# CollectFlow

Relance automatisée des factures impayées par e-mail, pour les TPE, PME et indépendants.

## État

Projet en construction. Étapes prévues :

1. Connexion et espace privé par entreprise
2. Factures : import CSV, liste, pause, marquer comme payée
3. Scénarios et modèles d'e-mails modifiables
4. Envoi réel avec validation avant envoi et journal
5. Relances quotidiennes automatiques, arrêt au paiement, désinscription
6. Abonnement Stripe, conditions d'utilisation, politique de confidentialité

## Pile technique

Next.js, Supabase (comptes et base de données), Resend (e-mails), Vercel (hébergement et tâches planifiées), Stripe (abonnements, plus tard).
