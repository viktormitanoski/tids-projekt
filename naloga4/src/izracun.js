// vpliv letnega časa na porabo (faktor) glede na mesec odhoda
function letniCas(datum) {
  const mesec = datum.getMonth() + 1;
  if ([11, 12, 1, 2].includes(mesec)) return { opis: "zima, nizke temperature", faktor: 1.25 };
  if ([3, 4, 5, 10].includes(mesec)) return { opis: "prehodno obdobje, hladnejša jutra", faktor: 1.1 };
  return { opis: "poletje, uporaba klimatske naprave", faktor: 1.05 };
}

const zaokrozi = (x, decimalke = 1) => Math.round(x * 10 ** decimalke) / 10 ** decimalke;

// izračuna energijske podatke za vožnjo; računanje naredi koda, ne LLM
function izracunajEnergijo({ vozilo, napolnjenost, rezerva, casOdhoda }) {
  const sezona = letniCas(new Date(casOdhoda));
  const porabaKWh100km = vozilo.porabaKWh100km * sezona.faktor;
  const energijaOdhodKWh = (vozilo.baterijaKWh * napolnjenost) / 100;
  const energijaRezervaKWh = (vozilo.baterijaKWh * rezerva) / 100;
  const uporabnaKWh = Math.max(0, energijaOdhodKWh - energijaRezervaKWh);

  return {
    sezona: sezona.opis,
    porabaKWh100km: zaokrozi(porabaKWh100km),
    energijaOdhodKWh: zaokrozi(energijaOdhodKWh),
    energijaRezervaKWh: zaokrozi(energijaRezervaKWh),
    dosegDoRezerveKm: Math.round((uporabnaKWh / porabaKWh100km) * 100),
  };
}

module.exports = { izracunajEnergijo };