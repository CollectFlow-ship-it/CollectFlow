import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { LEGAL, val } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <ul>
        <li>Site : CollectFlow, accessible à l’adresse www.collectflow.fr</li>
        <li>Éditeur : {val(LEGAL.editorName)}</li>
        <li>Statut : {val(LEGAL.legalForm)}</li>
        <li>Adresse : {val(LEGAL.address)}</li>
        <li>SIRET : {val(LEGAL.siret)}</li>
        {LEGAL.vatNumber.trim() && <li>TVA intracommunautaire : {LEGAL.vatNumber}</li>}
        <li>Contact : {val(LEGAL.contactEmail)}</li>
        <li>Directeur de la publication : {val(LEGAL.editorName)}</li>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        <li>Site web : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Les pages sont servies depuis la région de Paris.</li>
        <li>Base de données : Supabase, région : {val(LEGAL.dataRegion)}</li>
        <li>Nom de domaine : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France.</li>
        <li>Envoi des e-mails : Resend (États-Unis).</li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le nom CollectFlow, le logo, les textes, la mise en page et le code du site sont la
        propriété de l’éditeur. Toute reproduction sans autorisation écrite est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Signaler un contenu ou un problème</h2>
      <p>Écrivez-nous à {val(LEGAL.contactEmail)}.</p>
    </LegalPage>
  );
}
