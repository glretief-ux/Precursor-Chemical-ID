(function () {
function pl(n, a, b, c) { n = Math.abs(n) % 100; var d = n % 10; if (n > 10 && n < 20) return c; if (d > 1 && d < 5) return b; if (d === 1) return a; return c; }
return [
/* ---- search / label-check / map messages (applied to text nodes inside the dynamic result areas) ---- */
[/^Type a chemical name, CAS number, UN number or HS code above\. (\d+) entries loaded \((\d+) Table I, (\d+) Table II, (\d+) non-scheduled\)\.$/, "Введите выше название вещества, номер CAS, номер ООН или код ТН ВЭД. Загружено записей: $1 (Таблица I – $2, Таблица II – $3, не включено в таблицы – $4)."],
[/^1 result$/, "1 результат"],
[/^(\d+) results$/, function (m, n) { return n + " " + pl(+n, "результат", "результата", "результатов"); }],
[/^(\d+) of (\d+) chemicals$/, "$1 из $2 химических веществ"],
["No match in the database.", "В базе данных совпадений нет."],
[" The CAS number is formally valid but is not in this list – it may still be a salt, ester or national-list chemical; check the INCB Red List and national law.", " Номер CAS формально корректен, но в этом списке его нет – это всё равно может быть соль, сложный эфир или вещество из национального списка; проверьте Красный список МККН и национальное законодательство."],
[" – a typo, or a falsified label.", " – опечатка или поддельная этикетка."],
[" Try a synonym, a partial name, or the CAS number.", " Попробуйте синоним, часть названия или номер CAS."],
/* company verdict */
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis \(this chemical is internationally scheduled\)\.$/, "«$1» не значится известным производителем/поставщиком в этом инструменте. Это не означает, что продукт поддельный – проверьте компанию (регистрация, адрес, сайт, контакты таможни/КНО) и запросите разрешение и сертификат анализа (это вещество включено в международные таблицы)."],
[/^"(.*)" is not a known producer\/supplier in this tool\. This does not mean the product is fake – verify the company \(registration, address, website, customs\/CNA contacts\) and ask for the authorisation and certificate of analysis\.$/, "«$1» не значится известным производителем/поставщиком в этом инструменте. Это не означает, что продукт поддельный – проверьте компанию (регистрация, адрес, сайт, контакты таможни/КНО) и запросите разрешение и сертификат анализа."],
[" (similar spelling – check exact name)", " (похожее написание – проверьте точное название)"],
[" – recorded as ", " – записана как "],
[" of this chemical", " этого вещества"],
[" is in the database, but ", " есть в базе данных, но "],
[" as producing/supplying this chemical", " как производящая/поставляющая это вещество"],
/* label check */
[" is not in the form NNNN-NN-N. Possible typo or falsified label.", " не соответствует формату NNNN-NN-N. Возможна опечатка или поддельная этикетка."],
[" fails the CAS checksum – the number cannot exist. Typo or falsified label.", " не проходит проверку контрольной суммы CAS – такого номера не может быть. Опечатка или поддельная этикетка."],
[" (salt/form of CAS ", " (соль/форма CAS "],
[/^CAS (.+) is not in this database\. It may be an ordinary chemical, or a salt\/ester\/national-list item – check the INCB Red List\.$/, "CAS $1 нет в этой базе данных. Это может быть обычное вещество либо соль, сложный эфир или позиция национального списка – проверьте Красный список МККН."],
[/ \(\+(\d+) similar\)\./, " (+$1 похожих)."],
["Product name “", "Название продукта “"],
["” does not match any chemical in the database.", "” не соответствует ни одному веществу в базе данных."],
[" expected four digits (e.g. UN1090).", " ожидается четыре цифры (например, UN1090)."],
[/^UN(\d{4}) is:$/, "UN$1 соответствует:"],
[/^UN(\d+) is not assigned to any chemical in this database \(it may still be a valid transport number for other goods\)\.$/, "UN$1 не присвоен ни одному веществу в этой базе данных (он всё же может быть действительным транспортным номером для других грузов)."],
[" the CAS belongs to ", " CAS принадлежит "],
[" but the name suggests ", " но название указывает на "],
[". Strong red flag for a mislabelled or falsified container.", ". Серьёзный тревожный признак неправильно маркированной или поддельной тары."],
[/^UN number is consistent with (.+)\.$/, "Номер ООН согласуется с $1."],
[/^\s*(.+) normally travels as (.+), not (.+)\. Check the shipping paper and the container\.$/, " $1 обычно перевозится как $2, а не как $3. Проверьте транспортный документ и тару."],
[/^(.+) has no dedicated UN number in this database \(often not dangerous goods\)\. A UN number on the label should be checked against its safety data sheet\.$/, "У $1 в этой базе данных нет отдельного номера ООН (часто это не опасный груз). Номер ООН на этикетке следует сверить с паспортом безопасности."],
["Company recognised: ", "Компания распознана: "],
[". The chemical could not be identified, so supply status cannot be checked.", ". Вещество определить не удалось, поэтому проверить статус поставок невозможно."],
[/^Company “(.*)” is not in the database and the chemical could not be identified\.$/, "Компании “$1” нет в базе данных, а вещество определить не удалось."],
/* my companies */
["(producer", "(производитель"], ["(supplier", "(поставщик"], ["(distributor", "(дистрибьютор"],
[" – CAS: ", " – CAS: "],
["Invalid CAS number(s): ", "Недействительные номера CAS: "],
/* map */
[/^\+(\d+) more countries$/, function (m, n) { return "+" + n + " " + pl(+n, "страна", "страны", "стран"); }],
[/No consolidated public list of nationally controlled chemicals could be found for this (?:country|territory)\. This does $/, function (m) { return "Сводного открытого списка веществ, контролируемых на национальном уровне, для " + (/territory/.test(m) ? "этой территории" : "этой страны") + " найти не удалось. Это не означает, "; }],
[" mean it has none: the INCB says about 50 countries control chemicals beyond Tables I and II but does not publish who. ", "что их там нет: МККН сообщает, что около 50 стран контролируют вещества сверх Таблиц I и II, но не публикует, какие именно. "],
["A territory is often covered by the law of the state that administers it; check that state first. ", "Территория часто подпадает под законодательство управляющего ею государства; сначала проверьте это государство. "],
["Ask the national competent authority (the INCB keeps the contact list in its ", "Обратитесь в национальный компетентный орган (МККН ведёт список контактов в своём "],
["Same list as ", "Тот же список, что и у "],
[/^(\d+) additional chemical \(not in INCB Table I or II\)/, "$1 дополнительное вещество (не входит в Таблицу I или II МККН)"],
[/^(\d+) additional chemicals \(not in INCB Table I or II\)/, function (m, n) { return n + " " + pl(+n, "дополнительное вещество", "дополнительных вещества", "дополнительных веществ") + " (не входят в Таблицу I или II МККН)"; }],
["Data as of ", "Данные по состоянию на "],
[". National lists change often; confirm with the competent authority before enforcement action.", ". Национальные списки часто меняются; перед принятием мер подтвердите у компетентного органа."],
[/^(\d+) countries and territories(?: in (\w+))?: (\d+) with a full national list read, (\d+) partial, (\d+) with no public list found\. (\d+) control chemicals beyond INCB Tables I and II\.$/, function (m, n, reg, a, p, z, x) {
  var R = { Africa: "в Африке", Americas: "в Америке", Asia: "в Азии", Europe: "в Европе", Oceania: "в Океании", Antarctic: "в Антарктике" };
  return "Стран и территорий" + (reg ? " " + (R[reg] || "(" + reg + ")") : "") + ": " + n + ". Полный национальный список прочитан: " + a + ", частичный: " + p + ", открытый список не найден: " + z + ". Контролируют вещества сверх Таблиц I и II МККН: " + x + ".";
}],
/* header / footer data lines */
[/(\d+) chemicals tracked/, "веществ в базе: $1"],
[/(\d+) companies in sticker check/, "компаний в проверке этикеток: $1"],
[/ · data built /, " · данные собраны "],
[/(\d+) chemicals · (\d+) companies$/, "веществ: $1 · компаний: $2"],
[/^INCB Red List, (\d+)(?:st|nd|rd|th) edition \((\w+) (\d{4})\)/, function (m, ed, mo, y) {
  var M = { January: "январь", February: "февраль", March: "март", April: "апрель", May: "май", June: "июнь", July: "июль", August: "август", September: "сентябрь", October: "октябрь", November: "ноябрь", December: "декабрь" };
  return "Красный список МККН, " + ed + "-е издание (" + (M[mo] || mo) + " " + y + " г.)";
}],
[/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m, d, mo, y) {
  var M = { Jan: "янв.", Feb: "февр.", Mar: "мар.", Apr: "апр.", May: "мая", Jun: "июн.", Jul: "июл.", Aug: "авг.", Sep: "сент.", Oct: "окт.", Nov: "нояб.", Dec: "дек." };
  return d + " " + M[mo] + " " + y;
}],
/* trade-control text on result cards */
["Licence/registration to make or trade; export and import authorisation; pre-export notification; customer declarations; records. ", "Лицензия/регистрация на производство или торговлю; разрешения на экспорт и импорт; уведомление до экспорта; декларации покупателей; учёт. "],
["Registration/licensing varies by country; pre-export notification where the importing country requires it; records and correct customs documents. ", "Регистрация/лицензирование различаются по странам; уведомление до экспорта – там, где этого требует страна-импортёр; учёт и правильные таможенные документы. "],
["No international licence requirement; may be nationally controlled. Check national law.", "Международного лицензионного требования нет; может контролироваться на национальном уровне. Проверьте национальное законодательство."],
["Showing first 60 – refine your search.", "Показаны первые 60 – уточните поиск."],
/* incident report */
[/^In database: (.*) \((.*)\)\.$/, function (m, n, r) { var E = window.I18N.ru.exact; return "В базе данных: " + n + " (" + (E[r] || r) + ")."; }],
/* attributes */
[/^Copy (.+)$/, "Копировать $1"]
];
})()
