const fs = require("fs");
const path = require("path");

function shraniJson(vozila) {
  const mapa = path.join(__dirname, "..", "output");
  fs.mkdirSync(mapa, { recursive: true });

  const podatki = {
    vir: "https://ev-database.org/",
    datumRazclenjevanja: new Date().toISOString(),
    steviloVozil: vozila.length,
    vozila: vozila,
  };

  const pot = path.join(mapa, "vozila.json");
  fs.writeFileSync(pot, JSON.stringify(podatki, null, 2), "utf-8");
  console.log(`Shranjeno: ${pot}`);
}

module.exports = { shraniJson };