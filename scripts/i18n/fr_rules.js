[
/* ---- search / label-check / map messages (applied to text nodes inside the dynamic result areas) ---- */
[/^Type a chemical name, CAS number, UN number or HS code above\. (\d+) entries loaded \((\d+) Table I, (\d+) Table II, (\d+) non-scheduled\)\.$/, "Saisissez un nom de produit chimique, un numéro CAS, un numéro ONU ou un code SH ci-dessus. $1 entrées chargées ($2 du Tableau I, $3 du Tableau II, $4 non inscrites)."],
[/^1 result$/, "1 résultat"],
[/^(\d+) results$/, "$1 résultats"],
[/^(\d+) of (\d+) chemicals$/, "$1 sur $2 produits chimiques"],
["No match in the database.", "Aucune correspondance dans la base de données."],
[" The CAS number is formally valid but is not in this list – it may still be a salt, ester or national-list chemical; check the INCB Red List and national law.", " Le numéro CAS est formellement valide mais ne figure pas dans cette liste – il peut tout de même s’agir d’un sel, d’un ester ou d’un produit d’une liste nationale ; consultez la Liste rouge de l’OICS et le droit national."],
[" – a typo, or a falsified label.", " – une faute de frappe, ou une étiquette falsifiée."],
[" Try a synonym, a partial name, or the CAS number.", " Essayez un synonyme, un nom partiel ou le numéro CAS."],
/* company verdict */
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis \(this chemical is internationally scheduled\)\.$/, "« $1 » n’est pas un producteur/fournisseur connu dans cet outil. Cela ne signifie pas que le produit est faux – vérifiez l’entreprise (immatriculation, adresse, site web, contacts des douanes/ANC) et demandez l’autorisation et le certificat d’analyse (ce produit chimique est inscrit au niveau international)."],
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis\.$/, "« $1 » n’est pas un producteur/fournisseur connu dans cet outil. Cela ne signifie pas que le produit est faux – vérifiez l’entreprise (immatriculation, adresse, site web, contacts des douanes/ANC) et demandez l’autorisation et le certificat d’analyse."],
[" (similar spelling – check exact name)", " (orthographe proche – vérifiez le nom exact)"],
[" – recorded as ", " – enregistrée comme "],
[" of this chemical", " de ce produit chimique"],
[" is in the database, but ", " figure dans la base de données, mais "],
[" as producing/supplying this chemical", " comme produisant/fournissant ce produit chimique"],
/* label check */
[" is not in the form NNNN-NN-N. Possible typo or falsified label.", " n’est pas de la forme NNNN-NN-N. Faute de frappe ou étiquette falsifiée possible."],
[" fails the CAS checksum – the number cannot exist. Typo or falsified label.", " ne passe pas le contrôle du chiffre CAS – ce numéro ne peut pas exister. Faute de frappe ou étiquette falsifiée."],
[" (salt/form of CAS ", " (sel/forme du CAS "],
[/^CAS (.+) is not in this database\. It may be an ordinary chemical, or a salt\/ester\/national-list item – check the INCB Red List\.$/, "Le CAS $1 ne figure pas dans cette base. Il peut s’agir d’un produit chimique ordinaire, ou d’un sel/ester/élément d’une liste nationale – consultez la Liste rouge de l’OICS."],
[/ \(\+(\d+) similar\)\./, " (+$1 similaire(s))."],
["Product name “", "Nom du produit “"],
["” does not match any chemical in the database.", "” ne correspond à aucun produit chimique de la base de données."],
[" expected four digits (e.g. UN1090).", " quatre chiffres attendus (p. ex. UN1090)."],
[/^UN(\d{4}) is:$/, "UN$1 correspond à :"],
[/^UN(\d+) is not assigned to any chemical in this database \(it may still be a valid transport number for other goods\)\.$/, "UN$1 n’est attribué à aucun produit chimique de cette base (il peut rester un numéro de transport valide pour d’autres marchandises)."],
[" the CAS belongs to ", " le CAS appartient à "],
[" but the name suggests ", " mais le nom suggère "],
[". Strong red flag for a mislabelled or falsified container.", ". Fort signal d’alerte : conteneur mal étiqueté ou falsifié."],
[/^UN number is consistent with (.+)\.$/, "Le numéro ONU est cohérent avec $1."],
[/^\s*(.+) normally travels as (.+), not (.+)\. Check the shipping paper and the container\.$/, " $1 voyage normalement sous $2, et non sous $3. Vérifiez le document de transport et le conteneur."],
[/^(.+) has no dedicated UN number in this database \(often not dangerous goods\)\. A UN number on the label should be checked against its safety data sheet\.$/, "$1 n’a pas de numéro ONU propre dans cette base (souvent hors marchandises dangereuses). Un numéro ONU figurant sur l’étiquette doit être vérifié par rapport à sa fiche de données de sécurité."],
["Company recognised: ", "Entreprise reconnue : "],
[". The chemical could not be identified, so supply status cannot be checked.", ". Le produit chimique n’a pas pu être identifié ; l’état d’approvisionnement ne peut donc pas être vérifié."],
[/^Company “(.*)” is not in the database and the chemical could not be identified\.$/, "L’entreprise “$1” ne figure pas dans la base et le produit chimique n’a pas pu être identifié."],
/* my companies */
["(producer", "(producteur"], ["(supplier", "(fournisseur"], ["(distributor", "(distributeur"],
[" – CAS: ", " – CAS : "],
["Invalid CAS number(s): ", "Numéro(s) CAS invalide(s) : "],
/* map */
[/^\+(\d+) more countries$/, "+$1 autres pays"],
[/No consolidated public list of nationally controlled chemicals could be found for this (?:country|territory)\. This does $/, function (m) { return "Aucune liste publique consolidée des produits chimiques contrôlés au niveau national n’a été trouvée pour ce " + (/territory/.test(m) ? "territoire" : "pays") + ". Cela ne signifie "; }],
[" mean it has none: the INCB says about 50 countries control chemicals beyond Tables I and II but does not publish who. ", " qu’il n’en a aucune : l’OICS indique qu’environ 50 pays contrôlent des produits chimiques au-delà des Tableaux I et II mais ne publie pas lesquels. "],
["A territory is often covered by the law of the state that administers it; check that state first. ", "Un territoire est souvent couvert par le droit de l’État qui l’administre ; vérifiez d’abord cet État. "],
["Ask the national competent authority (the INCB keeps the contact list in its ", "Interrogez l’autorité nationale compétente (l’OICS tient la liste de contacts dans sa "],
["Same list as ", "Même liste que "],
[/^(\d+) additional chemical \(not in INCB Table I or II\)/, "$1 produit chimique supplémentaire (hors Tableaux I et II de l’OICS)"],
[/^(\d+) additional chemicals \(not in INCB Table I or II\)/, "$1 produits chimiques supplémentaires (hors Tableaux I et II de l’OICS)"],
["Data as of ", "Données au "],
[". National lists change often; confirm with the competent authority before enforcement action.", ". Les listes nationales changent souvent ; confirmez auprès de l’autorité compétente avant toute action de répression."],
[/^(\d+) countries and territories(?: in (\w+))?: (\d+) with a full national list read, (\d+) partial, (\d+) with no public list found\. (\d+) control chemicals beyond INCB Tables I and II\.$/, function (m, n, reg, a, p, z, x) {
  var R = { Africa: "en Afrique", Americas: "dans les Amériques", Asia: "en Asie", Europe: "en Europe", Oceania: "en Océanie", Antarctic: "en Antarctique" };
  return n + " pays et territoires" + (reg ? " " + (R[reg] || "(" + reg + ")") : "") + " : " + a + " avec une liste nationale complète lue, " + p + " partielle(s), " + z + " sans liste publique trouvée. " + x + " contrôlent des produits chimiques au-delà des Tableaux I et II de l’OICS.";
}],
/* header / footer data lines */
[/(\d+) chemicals tracked/, "$1 produits chimiques suivis"],
[/(\d+) companies in sticker check/, "$1 entreprises dans le contrôle d’étiquette"],
[/ · data built /, " · données générées le "],
[/(\d+) chemicals · (\d+) companies$/, "$1 produits chimiques · $2 entreprises"],
[/^INCB Red List, (\d+)(?:st|nd|rd|th) edition \((\w+) (\d{4})\)/, function (m, ed, mo, y) {
  var M = { January: "janvier", February: "février", March: "mars", April: "avril", May: "mai", June: "juin", July: "juillet", August: "août", September: "septembre", October: "octobre", November: "novembre", December: "décembre" };
  return "Liste rouge de l’OICS, " + ed + "e édition (" + (M[mo] || mo) + " " + y + ")";
}],
[/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m, d, mo, y) {
  var M = { Jan: "janv.", Feb: "févr.", Mar: "mars", Apr: "avr.", May: "mai", Jun: "juin", Jul: "juil.", Aug: "août", Sep: "sept.", Oct: "oct.", Nov: "nov.", Dec: "déc." };
  return (d === "1" ? "1er" : d) + " " + M[mo] + " " + y;
}],
/* trade-control text on result cards */
["Licence/registration to make or trade; export and import authorisation; pre-export notification; customer declarations; records. ", "Licence/enregistrement pour fabriquer ou commercialiser ; autorisation d’exportation et d’importation ; notification préalable à l’exportation ; déclarations des clients ; registres. "],
["Registration/licensing varies by country; pre-export notification where the importing country requires it; records and correct customs documents. ", "L’enregistrement/la licence varie selon les pays ; notification préalable à l’exportation lorsque le pays importateur l’exige ; registres et documents douaniers corrects. "],
["No international licence requirement; may be nationally controlled. Check national law.", "Aucune exigence internationale de licence ; peut être contrôlé au niveau national. Vérifiez le droit national."],
["Showing first 60 – refine your search.", "Affichage des 60 premiers – affinez votre recherche."],
/* incident report */
[/^In database: (.*) \((.*)\)\.$/, function (m, n, r) { var E = window.I18N.fr.exact; return "Dans la base : " + n + " (" + (E[r] || r) + ")."; }],
/* attributes */
[/^Copy (.+)$/, "Copier $1"]
]
