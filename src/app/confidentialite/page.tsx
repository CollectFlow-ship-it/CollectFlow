import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL, val } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p>
        Cette page explique quelles données CollectFlow utilise, pourquoi, et comment exercer
        vos droits.
      </p>

      <h2>Qui est responsable de quoi ?</h2>
      <ul>
        <li>
          <strong>Pour votre compte</strong> (adresse e-mail, mot de passe, réglages), l’éditeur
          de CollectFlow est responsable du traitement.
        </li>
        <li>
          <strong>Pour les factures et les coordonnées de vos clients</strong> que vous importez,
          c’est vous qui décidez de leur usage : vous êtes responsable du traitement et
          CollectFlow agit comme sous-traitant, uniquement pour envoyer les relances que vous
          validez.
        </li>
      </ul>

      <h2>Données traitées</h2>
      <ul>
        <li>Compte : adresse e-mail, mot de passe (stocké chiffré, jamais lisible).</li>
        <li>Entreprise : nom, réglages de relance, adresse de réponse, instructions de paiement.</li>
        <li>Factures importées : nom et e-mail du client, numéro, montant, échéance, état de paiement.</li>
        <li>Journal : relances envoyées, date et résultat.</li>
      </ul>

      <h2>Pourquoi, et sur quelle base</h2>
      <ul>
        <li>Fournir le service demandé (création de compte, relances, récapitulatif) : exécution du contrat.</li>
        <li>Sécuriser le service et éviter les doublons d’envoi : intérêt légitime.</li>
      </ul>
      <p>Aucune donnée n’est vendue ni utilisée à des fins publicitaires.</p>

      <h2>Prestataires qui reçoivent des données</h2>
      <ul>
        <li>Supabase : base de données et connexion (région : {val(LEGAL.dataRegion)}).</li>
        <li>Vercel : hébergement du site.</li>
        <li>Resend : envoi des e-mails (États-Unis).</li>
      </ul>
      <p>
        Certains prestataires sont établis aux États-Unis. Les transferts s’appuient sur les
        garanties prévues par le RGPD (clauses contractuelles types ou cadre de protection des
        données UE–États-Unis).
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées tant que votre compte est actif. À la suppression du compte,
        elles sont effacées, sauf obligation légale de conservation. Vous pouvez aussi demander
        l’effacement de factures précises à tout moment.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, la
        portabilité de vos données, ou vous opposer à leur traitement, en écrivant à{" "}
        {val(LEGAL.contactEmail)}. Si les destinataires de vos relances veulent exercer leurs
        droits, ils peuvent écrire à la même adresse : nous transmettrons à l’entreprise
        concernée. Vous pouvez aussi saisir la CNIL (www.cnil.fr).
      </p>

      <h2>Cookies</h2>
      <p>
        CollectFlow n’utilise que des cookies indispensables au fonctionnement (connexion,
        protection contre les envois répétés). Il n’y a ni publicité ni mesure d’audience, donc
        pas de bandeau de consentement.
      </p>
    </LegalPage>
  );
}
