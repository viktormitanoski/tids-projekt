const { pridobiPodatke } = require("./prenos");
const { moznosti, pripraviPrikaz } = require("./obdelava");

(async () => {
  const { izvor, zapisi } = await pridobiPodatke();
  console.log(`Izvor: ${izvor}, zapisov: ${zapisi.length}`);

  const m = moznosti(zapisi);
  console.log(`Kategorij: ${m.kategorije.length}, regij: ${m.regije.length}, meritev: ${m.meritve.length}`);

  const prikaz = pripraviPrikaz(zapisi, {
    kategorija: "1.2.1 Osebni avtomobili (M1)",
    regija: "SLOVENIJA",
    meritev: "Število vseh vozil na dan 31. 12.",
  });

  console.log("\nPovzetek:", prikaz.povzetek);
  console.log("\nElektrični osebni avtomobili v Sloveniji po letih:");
  console.table(prikaz.poLetih);
  console.log("\nRegije v zadnjem letu (po deležu električnih):");
  console.table(prikaz.poRegijah);
})();