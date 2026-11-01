import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL, val } from "@/lib/legal";

export const metadata: Metadata = { title: "Conditions d’utilisation" };

export default function Page() {
  return (
    <LegalPage title="Conditions d’utilisation">
      <h2>1. Objet</h2>
      <p>
        CollectFlow est un service en ligne qui aide les professionnels à relancer leurs factures
        impayées par e-mail. Les présentes conditions encadrent son utilisation. En créant un
        compte, vous les acceptez.
      </p>

      <h2>2. Qui peut utiliser le service</h2>
      <p>
        Le service est réservé aux professionnels (entreprises, indépendants, associations) qui
        relancent des clients dans le cadre de leur activité. Vous déclarez avoir la capacité de
        vous engager au nom de votre entreprise.
      </p>

      <h2>3. Votre compte</h2>
      <p>
        Vous donnez une adresse e-mail valable et un mot de passe que vous gardez confidentiel.
        Vous êtes responsable de ce qui est fait depuis votre compte.
      </p>

      <h2>4. Comment fonctionnent les relances</h2>
      <ul>
        <li>Rien n’est envoyé à vos clients sans votre validation.</li>
        <li>Chaque relance part une seule fois par facture et par étape.</li>
        <li>
          La mise en demeure n’est pas envoyée par e-mail : le service vous rappelle de
          l’envoyer vous-même par courrier recommandé.
        </li>
        <li>
          Le récapitulatif quotidien vous prévient seulement qu’il y a des relances à valider.
          Vous pouvez le désactiver dans les réglages.
        </li>
      </ul>

      <h2>5. Vos responsabilités</h2>
      <ul>
        <li>Vous ne relancez que des sommes réellement dues et des clients avec lesquels vous êtes en relation d’affaires.</li>
        <li>Vous vérifiez l’exactitude des factures importées, des textes et des montants calculés.</li>
        <li>
          Vous choisissez le taux de pénalités et l’indemnité forfaitaire en respectant la loi
          et vos conditions de vente. Le service les calcule à partir de vos réglages.
        </li>
        <li>Vous n’utilisez pas le service pour du harcèlement, du spam ou des contenus illicites.</li>
      </ul>
      <p>
        CollectFlow est un outil. Il ne fournit pas de conseil juridique et ne garantit pas le
        paiement des factures.
      </p>

      <h2>6. Données</h2>
      <p>
        Vous restez propriétaire des données que vous importez. Leur traitement est décrit dans
        la <a href="/confidentialite">politique de confidentialité</a>. Vous garantissez avoir le
        droit de les utiliser pour relancer vos clients.
      </p>

      <h2>7. Disponibilité</h2>
      <p>
        Nous faisons au mieux pour que le service soit accessible en continu, sans pouvoir
        le garantir : maintenance, panne d’un prestataire ou événement hors de notre contrôle
        peuvent l’interrompre. La délivrabilité des e-mails dépend aussi des messageries des
        destinataires.
      </p>

      <h2>8. Tarifs</h2>
      <p>
        Les conditions tarifaires sont présentées avant toute souscription payante. Aucun
        paiement n’est prélevé sans votre accord explicite.
      </p>

      <h2>9. Responsabilité</h2>
      <p>
        Dans les limites permises par la loi, la responsabilité de l’éditeur est limitée aux
        dommages directs et, en cas de service payant, au montant payé sur les 12 derniers mois.
        L’éditeur n’est pas responsable des conséquences d’une relance validée par l’utilisateur
        sur la base de données inexactes.
      </p>

      <h2>10. Fin du contrat</h2>
      <p>
        Vous pouvez arrêter d’utiliser le service et demander la suppression de votre compte à
        tout moment en écrivant à {val(LEGAL.contactEmail)}. L’éditeur peut suspendre un compte
        en cas d’usage contraire à ces conditions.
      </p>

      <h2>11. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. La date de mise à jour figure en haut de la page. En cas
        de changement important, vous en serez informé par e-mail.
      </p>

      <h2>12. Droit applicable</h2>
      <p>
        Ces conditions sont régies par le droit français. En cas de litige, une solution amiable
        est recherchée d’abord ; à défaut, les tribunaux français sont compétents.
      </p>
      <p>Éditeur : voir les <a href="/mentions-legales">mentions légales</a>.</p>
    </LegalPage>
  );
}
