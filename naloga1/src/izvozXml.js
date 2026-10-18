const fs = require("fs");
const path = require("path");
const { XMLBuilder } = require("fast-xml-parser");

const KORENSKA_MAPA = path.join(__dirname, "..");

const builder = new XMLBuilder({
  ignoreAttributes: false,   
  attributeNamePrefix: "@_", 
  format: true,             
  indentBy: "  ",
  suppressEmptyNode: false,  
});

function vXmlObjekt(objekt) {
  if (!objekt) return "";
  const { id, ...ostalo } = objekt;
  const rezultat = { "@_id": id };
  for (const [kljuc, vrednost] of Object.entries(ostalo)) {
    rezultat[kljuc] = vrednost === null ? "" : vrednost;
  }
  return rezultat;
}

function izvoziXml(rezultati, filtri) {
  const podatki = {
    filtrirano: {
      "@_datumIzvoza": new Date().toISOString(),
      "@_steviloZapisov": rezultati.length,
      filtri: filtri,
      polnjenja: {
        polnjenje: rezultati.map((n) => ({
          ...vXmlObjekt({
            id: n.id,
            datum: n.datum,
            energijaKWh: n.energijaKWh,
            trajanjeMin: n.trajanjeMin,
            cenaEur: n.cenaEur,
            ocena: n.ocena,
          }),
          vozilo: vXmlObjekt(n.vozilo),
          polnilnica: vXmlObjekt(n.polnilnica),
        })),
      },
    },
  };

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(podatki);
  const pot = path.join(KORENSKA_MAPA, "filtrirano.xml");
  fs.writeFileSync(pot, xml, "utf-8");
  console.log(`Shranjeno: ${pot}`);
}

module.exports = { izvoziXml };