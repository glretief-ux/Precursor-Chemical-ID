(function () {
return [
/* ---- search / label-check / map messages (applied to text nodes inside the dynamic result areas) ---- */
[/^Type a chemical name, CAS number, UN number or HS code above\. (\d+) entries loaded \((\d+) Table I, (\d+) Table II, (\d+) non-scheduled\)\.$/, "Escriba arriba un nombre de producto químico, un número CAS, un número ONU o un código SA. $1 entradas cargadas ($2 del Cuadro I, $3 del Cuadro II, $4 no fiscalizadas)."],
[/^1 result$/, "1 resultado"],
[/^(\d+) results$/, "$1 resultados"],
[/^(\d+) of (\d+) chemicals$/, "$1 de $2 productos químicos"],
["No match in the database.", "Ninguna coincidencia en la base de datos."],
[" The CAS number is formally valid but is not in this list – it may still be a salt, ester or national-list chemical; check the INCB Red List and national law.", " El número CAS es formalmente válido pero no figura en esta lista: puede tratarse igualmente de una sal, un éster o un producto de una lista nacional; consulte la Lista Roja de la JIFE y la legislación nacional."],
[" – a typo, or a falsified label.", " – un error tipográfico o una etiqueta falsificada."],
[" Try a synonym, a partial name, or the CAS number.", " Pruebe con un sinónimo, un nombre parcial o el número CAS."],
/* company verdict */
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis \(this chemical is internationally scheduled\)\.$/, "«$1» no es un productor/proveedor conocido en esta herramienta. Esto no significa que el producto sea falso: verifique la empresa (registro, dirección, sitio web, contactos de aduanas/ANC) y pida la autorización y el certificado de análisis (este producto químico está fiscalizado a nivel internacional)."],
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis\.$/, "«$1» no es un productor/proveedor conocido en esta herramienta. Esto no significa que el producto sea falso: verifique la empresa (registro, dirección, sitio web, contactos de aduanas/ANC) y pida la autorización y el certificado de análisis."],
[" (similar spelling – check exact name)", " (ortografía similar – compruebe el nombre exacto)"],
[" – recorded as ", " – registrada como "],
[" of this chemical", " de este producto químico"],
[" is in the database, but ", " figura en la base de datos, pero "],
[" as producing/supplying this chemical", " como productora/suministradora de este producto químico"],
/* label check */
[" is not in the form NNNN-NN-N. Possible typo or falsified label.", " no tiene el formato NNNN-NN-N. Posible error tipográfico o etiqueta falsificada."],
[" fails the CAS checksum – the number cannot exist. Typo or falsified label.", " no supera la suma de control del CAS: el número no puede existir. Error tipográfico o etiqueta falsificada."],
[" (salt/form of CAS ", " (sal/forma del CAS "],
[/^CAS (.+) is not in this database\. It may be an ordinary chemical, or a salt\/ester\/national-list item – check the INCB Red List\.$/, "El CAS $1 no figura en esta base de datos. Puede ser un producto químico ordinario, o una sal, un éster o un elemento de una lista nacional: consulte la Lista Roja de la JIFE."],
[/ \(\+(\d+) similar\)\./, " (+$1 similares)."],
["Product name “", "El nombre del producto “"],
["” does not match any chemical in the database.", "” no coincide con ningún producto químico de la base de datos."],
[" expected four digits (e.g. UN1090).", " se esperan cuatro dígitos (p. ej., UN1090)."],
[/^UN(\d{4}) is:$/, "UN$1 corresponde a:"],
[/^UN(\d+) is not assigned to any chemical in this database \(it may still be a valid transport number for other goods\)\.$/, "UN$1 no está asignado a ningún producto químico de esta base de datos (puede seguir siendo un número de transporte válido para otras mercancías)."],
[" the CAS belongs to ", " el CAS pertenece a "],
[" but the name suggests ", " pero el nombre sugiere "],
[". Strong red flag for a mislabelled or falsified container.", ". Fuerte señal de alerta de un envase mal etiquetado o falsificado."],
[/^UN number is consistent with (.+)\.$/, "El número ONU es coherente con $1."],
[/^\s*(.+) normally travels as (.+), not (.+)\. Check the shipping paper and the container\.$/, " $1 se transporta normalmente como $2, no como $3. Compruebe el documento de transporte y el envase."],
[/^(.+) has no dedicated UN number in this database \(often not dangerous goods\)\. A UN number on the label should be checked against its safety data sheet\.$/, "$1 no tiene un número ONU propio en esta base de datos (a menudo no es mercancía peligrosa). Un número ONU que figure en la etiqueta debe comprobarse con su ficha de datos de seguridad."],
["Company recognised: ", "Empresa reconocida: "],
[". The chemical could not be identified, so supply status cannot be checked.", ". No se pudo identificar el producto químico, por lo que no se puede comprobar su estado de suministro."],
[/^Company “(.*)” is not in the database and the chemical could not be identified\.$/, "La empresa “$1” no figura en la base de datos y no se pudo identificar el producto químico."],
/* my companies */
["(producer", "(productor"], ["(supplier", "(proveedor"], ["(distributor", "(distribuidor"],
[" – CAS: ", " – CAS: "],
["Invalid CAS number(s): ", "Número(s) CAS no válido(s): "],
/* map */
[/^\+(\d+) more countries$/, "+$1 países más"],
[/No consolidated public list of nationally controlled chemicals could be found for this (?:country|territory)\. This does $/, function (m) { return "No se encontró una lista pública consolidada de productos químicos controlados a nivel nacional para este " + (/territory/.test(m) ? "territorio" : "país") + ". Esto no significa "; }],
[" mean it has none: the INCB says about 50 countries control chemicals beyond Tables I and II but does not publish who. ", " que no tenga ninguna: la JIFE indica que unos 50 países controlan productos químicos más allá de los Cuadros I y II, pero no publica cuáles. "],
["A territory is often covered by the law of the state that administers it; check that state first. ", "Un territorio suele estar cubierto por la legislación del Estado que lo administra; compruebe primero ese Estado. "],
["Ask the national competent authority (the INCB keeps the contact list in its ", "Pregunte a la autoridad nacional competente (la JIFE mantiene la lista de contactos en su "],
["Same list as ", "Misma lista que "],
[/^(\d+) additional chemical \(not in INCB Table I or II\)/, "$1 producto químico adicional (no incluido en los Cuadros I o II de la JIFE)"],
[/^(\d+) additional chemicals \(not in INCB Table I or II\)/, "$1 productos químicos adicionales (no incluidos en los Cuadros I o II de la JIFE)"],
["Data as of ", "Datos a fecha de "],
[". National lists change often; confirm with the competent authority before enforcement action.", ". Las listas nacionales cambian con frecuencia; confirme con la autoridad competente antes de actuar."],
[/^(\d+) countries and territories(?: in (\w+))?: (\d+) with a full national list read, (\d+) partial, (\d+) with no public list found\. (\d+) control chemicals beyond INCB Tables I and II\.$/, function (m, n, reg, a, p, z, x) {
  var R = { Africa: "en África", Americas: "en América", Asia: "en Asia", Europe: "en Europa", Oceania: "en Oceanía", Antarctic: "en la Antártida" };
  return n + " países y territorios" + (reg ? " " + (R[reg] || "(" + reg + ")") : "") + ": " + a + " con la lista nacional completa leída, " + p + " parciales, " + z + " sin lista pública encontrada. " + x + " controlan productos químicos más allá de los Cuadros I y II de la JIFE.";
}],
/* header / footer data lines */
[/(\d+) chemicals tracked/, "$1 productos químicos en seguimiento"],
[/(\d+) companies in sticker check/, "$1 empresas en el control de etiquetas"],
[/ · data built /, " · datos generados el "],
[/(\d+) chemicals · (\d+) companies$/, "$1 productos químicos · $2 empresas"],
[/^INCB Red List, (\d+)(?:st|nd|rd|th) edition \((\w+) (\d{4})\)/, function (m, ed, mo, y) {
  var M = { January: "enero", February: "febrero", March: "marzo", April: "abril", May: "mayo", June: "junio", July: "julio", August: "agosto", September: "septiembre", October: "octubre", November: "noviembre", December: "diciembre" };
  return "Lista Roja de la JIFE, " + ed + ".ª edición (" + (M[mo] || mo) + " de " + y + ")";
}],
[/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m, d, mo, y) {
  var M = { Jan: "ene.", Feb: "feb.", Mar: "mar.", Apr: "abr.", May: "may.", Jun: "jun.", Jul: "jul.", Aug: "ago.", Sep: "sept.", Oct: "oct.", Nov: "nov.", Dec: "dic." };
  return d + " " + M[mo] + " " + y;
}],
/* trade-control text on result cards */
["Licence/registration to make or trade; export and import authorisation; pre-export notification; customer declarations; records. ", "Licencia/registro para fabricar o comerciar; autorización de exportación e importación; notificación previa a la exportación; declaraciones de clientes; registros. "],
["Registration/licensing varies by country; pre-export notification where the importing country requires it; records and correct customs documents. ", "El registro/la licencia varía según el país; notificación previa a la exportación cuando el país importador la exige; registros y documentos aduaneros correctos. "],
["No international licence requirement; may be nationally controlled. Check national law.", "Sin requisito internacional de licencia; puede estar controlado a nivel nacional. Consulte la legislación nacional."],
["Showing first 60 – refine your search.", "Se muestran los primeros 60 – afine su búsqueda."],
/* incident report */
[/^In database: (.*) \((.*)\)\.$/, function (m, n, r) { var E = window.I18N.es.exact; return "En la base de datos: " + n + " (" + (E[r] || r) + ")."; }],
/* attributes */
[/^Copy (.+)$/, "Copiar $1"]
];
})()
