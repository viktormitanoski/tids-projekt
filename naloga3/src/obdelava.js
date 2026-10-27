const SKUPAJ = "Vrsta pogona in goriva - SKUPAJ";
const ELEKTRICNI = "Električni pogon";
const HIBRIDNI = "Hibridni pogon";
const NE_STATISTICNE_REGIJE = ["SLOVENIJA", "Vzhodna Slovenija", "Zahodna Slovenija"];

const unikatne = (seznam) => [...new Set(seznam)];

function delez(del, celota) {
  if (del === null || !celota) return null;
  return Math.round((del / celota) * 10000) / 100;
}

function moznosti(zapisi) {
  return {
    kategorije: unikatne(zapisi.map((z) => z.kategorija)),
    regije: unikatne(zapisi.map((z) => z.regija)),
    meritve: unikatne(zapisi.map((z) => z.meritev)),
  };
}

function pripraviPrikaz(zapisi, { kategorija, regija, meritev }) {
  const izbrani = zapisi.filter((z) => z.kategorija === kategorija && z.meritev === meritev);

  const vrednost = (leto, reg, gorivo) =>
    izbrani.find((z) => z.leto === leto && z.regija === reg && z.gorivo === gorivo)?.vrednost ?? null;

  const leta = unikatne(izbrani.map((z) => z.leto)).sort((a, b) => a - b);
  const zadnjeLeto = leta[leta.length - 1];

  const poLetih = leta.map((leto) => {
    const skupaj = vrednost(leto, regija, SKUPAJ);
    const elektricni = vrednost(leto, regija, ELEKTRICNI);
    return {
      leto,
      elektricni,
      hibridni: vrednost(leto, regija, HIBRIDNI),
      skupaj,
      delezElektricnih: delez(elektricni, skupaj),
    };
  });

  const poGorivih = izbrani
    .filter((z) => z.leto === zadnjeLeto && z.regija === regija && z.gorivo !== SKUPAJ)
    .map((z) => ({ gorivo: z.gorivo, vrednost: z.vrednost }));

  const poRegijah = unikatne(izbrani.map((z) => z.regija))
    .filter((r) => !NE_STATISTICNE_REGIJE.includes(r))
    .map((r) => {
      const elektricni = vrednost(zadnjeLeto, r, ELEKTRICNI);
      return { regija: r, elektricni, delez: delez(elektricni, vrednost(zadnjeLeto, r, SKUPAJ)) };
    })
    .sort((a, b) => (b.delez ?? -1) - (a.delez ?? -1));

  const zadnji = poLetih[poLetih.length - 1];
  const predzadnji = poLetih[poLetih.length - 2];
  const povzetek = {
    zadnjeLeto,
    elektricni: zadnji?.elektricni ?? null,
    delezElektricnih: zadnji?.delezElektricnih ?? null,
    rastProcent:
      predzadnji?.elektricni ? delez(zadnji.elektricni - predzadnji.elektricni, predzadnji.elektricni) : null,
  };

  return { povzetek, poLetih, poGorivih, poRegijah };
}

module.exports = { moznosti, pripraviPrikaz };