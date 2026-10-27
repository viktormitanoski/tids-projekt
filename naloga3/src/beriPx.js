const iconv = require("iconv-lite");
const Px = require("px");

function popraviPodatke(besedilo) {
  const [glava, podatki] = besedilo.split(/\r?\nDATA=/);
  const vEniVrstici = podatki.replace(/\s+/g, " ").trim().replace(/\s*;$/, ";");
  return glava + "\nDATA=" + vEniVrstici;
}

function vStevilo(vrednost) {
  const brezNarekovajev = vrednost.replace(/"/g, "");
  const stevilo = Number(brezNarekovajev);
  return brezNarekovajev === "" || Number.isNaN(stevilo) ? null : stevilo;
}

function razcleniPx(buffer) {
  const glava = buffer.toString("latin1", 0, 2000);
  const kodnaStran = (glava.match(/CODEPAGE="([^"]+)"/) || [])[1] || "windows-1250";
  const besedilo = iconv.decode(buffer, kodnaStran);

  const px = new Px(popraviPodatke(besedilo));
  const [leto, kategorija, regija, gorivo, meritev] = px.variables();

  return px.entries().map((z) => ({
    leto: Number(z[leto]),
    kategorija: z[kategorija],
    regija: z[regija],
    gorivo: z[gorivo],
    meritev: z[meritev],
    vrednost: vStevilo(z.num),
  }));
}

module.exports = { razcleniPx };