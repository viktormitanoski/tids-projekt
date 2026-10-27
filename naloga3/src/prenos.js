const fs = require("fs");
const path = require("path");
const { razcleniPx } = require("./beriPx");

const API_URL = "https://pxweb.stat.si/SiStatData/api/v1/sl/Data/2222113S.px";
const LOKALNA_KOPIJA = path.join(__dirname, "..", "data", "2222113S.px");

const POIZVEDBA = {
  query: [
    "LETO",
    "KATEGORIJA VOZILA",
    "KOHEZIJSKA IN STATISTIČNA REGIJA",
    "VRSTA POGONA IN GORIVA",
    "MERITVE",
  ].map((code) => ({ code, selection: { filter: "all", values: ["*"] } })),
  response: { format: "px" },
};

async function pridobiPodatke() {
  try {
    const odgovor = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(POIZVEDBA),
    });
    if (!odgovor.ok) throw new Error(`HTTP ${odgovor.status}`);

    const buffer = Buffer.from(await odgovor.arrayBuffer());
    return { izvor: "SURS API (sveže)", zapisi: razcleniPx(buffer) };
  } catch (napaka) {
    console.warn(`Prenos s SURS ni uspel (${napaka.message}), uporabljam lokalno kopijo.`);
    const buffer = fs.readFileSync(LOKALNA_KOPIJA);
    return { izvor: "lokalna kopija", zapisi: razcleniPx(buffer) };
  }
}

module.exports = { pridobiPodatke };