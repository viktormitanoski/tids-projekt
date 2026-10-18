const { parseArgs } = require("util");

function preberiFiltre() {
  const { values } = parseArgs({
    options: {
      mesto: { type: "string" },
      od: { type: "string" },
      do: { type: "string" },
      vozilo: { type: "string" },
      upravljavec: { type: "string" },
      maxCena: { type: "string" },
    },
  });
  return { ...values };
}

function enako(a, b) {
  return a !== null && a !== undefined && a.toLowerCase() === b.toLowerCase();
}

function filtriraj(povezana, filtri) {
  return povezana.filter((n) => {
    if (filtri.mesto && !enako(n.polnilnica?.mesto, filtri.mesto)) return false;
    if (filtri.od && n.datum < filtri.od) return false;
    if (filtri.do && n.datum > filtri.do) return false;
    if (filtri.vozilo && n.voziloId !== filtri.vozilo) return false;
    if (filtri.upravljavec && !enako(n.polnilnica?.upravljavec, filtri.upravljavec)) return false;
    if (filtri.maxCena && (n.cenaEur === null || n.cenaEur > Number(filtri.maxCena))) return false;
    return true;
  });
}

function izpisiTabelo(rezultati) {
  if (rezultati.length === 0) {
    console.log("Ni polnjenj, ki bi ustrezala filtru.");
    return;
  }
  const vrstice = rezultati.map((n) => ({
    ID: n.id,
    Datum: n.datum,
    Vozilo: n.vozilo ? `${n.vozilo.znamka} ${n.vozilo.model}` : "-",
    Polnilnica: n.polnilnica ? n.polnilnica.ime : "-",
    Mesto: n.polnilnica ? n.polnilnica.mesto : "-",
    kWh: n.energijaKWh,
    "Cena €": n.cenaEur?.toFixed(2) ?? "-",
    Ocena: n.ocena ?? "-",
  }));
  console.table(vrstice);
}

module.exports = { preberiFiltre, filtriraj, izpisiTabelo };