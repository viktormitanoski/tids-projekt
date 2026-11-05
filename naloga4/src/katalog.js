const fs = require("fs");
const path = require("path");

const POT = path.join(__dirname, "..", "data", "vozila.json");

// naloži katalog vozil iz naloge 2; obdržimo le vozila s podatki, ki jih potrebujemo za načrt
function naloziVozila() {
  const { vozila } = JSON.parse(fs.readFileSync(POT, "utf-8"));
  return vozila
    .filter((v) => v.baterijaKWh && v.porabaKWh100km)
    .sort((a, b) => a.ime.localeCompare(b.ime));
}

function poisciVozilo(id) {
  return naloziVozila().find((v) => v.id === id) || null;
}

module.exports = { naloziVozila, poisciVozilo };