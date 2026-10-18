const fs = require("fs");
const path = require("path");

const KORENSKA_MAPA = path.join(__dirname, "..");

function izvoziJson(rezultati, filtri) {
  const podatki = {
    datumIzvoza: new Date().toISOString(),
    filtri: filtri,
    steviloZapisov: rezultati.length,
    polnjenja: rezultati.map((n) => ({
      id: n.id,
      datum: n.datum,
      energijaKWh: n.energijaKWh,
      trajanjeMin: n.trajanjeMin,
      cenaEur: n.cenaEur,
      ocena: n.ocena,
      vozilo: n.vozilo,
      polnilnica: n.polnilnica,
    })),
  };

  const pot = path.join(KORENSKA_MAPA, "filtrirano.json");
  fs.writeFileSync(pot, JSON.stringify(podatki, null, 2), "utf-8");
  console.log(`\nShranjeno: ${pot}`);
}

module.exports = { izvoziJson };