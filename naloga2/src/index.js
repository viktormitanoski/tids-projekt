const { parseArgs } = require("util");
const { razcleni } = require("./parser");
const { shraniJson } = require("./izvoz");

const { values } = parseArgs({ options: { strani: { type: "string" } } });
const maxStrani = values.strani ? Number(values.strani) : null;

(async () => {
  try {
    const vozila = await razcleni(maxStrani);

    const unikatna = [...new Map(vozila.map((v) => [v.id, v])).values()];
    console.log(`\nUnikatnih vozil: ${unikatna.length}`);

    console.table(
      unikatna.slice(0, 10).map((v) => ({
        ID: v.id,
        Ime: v.ime,
        "Baterija kWh": v.baterijaKWh,
        "Doseg km": v.dosegKm,
        "kWh/100km": v.porabaKWh100km,
        "Cena €": v.cenaDeEur,
      }))
    );

    shraniJson(unikatna);
  } catch (napaka) {
    console.error("Napaka pri razčlenjevanju:", napaka.message);
  }
})();