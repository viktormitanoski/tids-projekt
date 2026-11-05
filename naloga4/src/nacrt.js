function zahtevaj(objekt, kljuc, tip) {
  const vrednost = objekt[kljuc];
  if (typeof vrednost !== tip) {
    throw new Error(`Polje "${kljuc}" manjka ali ni tipa ${tip} (dobil: ${JSON.stringify(vrednost)})`);
  }
  return vrednost;
}

function procent(objekt, kljuc) {
  const vrednost = zahtevaj(objekt, kljuc, "number");
  if (vrednost < 0 || vrednost > 100) {
    throw new Error(`Polje "${kljuc}" mora biti med 0 in 100 (dobil: ${vrednost})`);
  }
  return Math.round(vrednost);
}

class Postanek {
  constructor(kraj, opis, oddaljenostOdZacetkaKm, napolnjenostObPrihodu, polnitiDo, casPolnjenjaMin) {
    this.kraj = kraj;
    this.opis = opis;
    this.oddaljenostOdZacetkaKm = oddaljenostOdZacetkaKm;
    this.napolnjenostObPrihodu = napolnjenostObPrihodu;
    this.polnitiDo = polnitiDo;
    this.casPolnjenjaMin = casPolnjenjaMin;
  }

  static izObjekta(o) {
    return new Postanek(
      zahtevaj(o, "kraj", "string"),
      zahtevaj(o, "opis", "string"),
      zahtevaj(o, "oddaljenostOdZacetkaKm", "number"),
      procent(o, "napolnjenostObPrihodu"),
      procent(o, "polnitiDo"),
      Math.round(zahtevaj(o, "casPolnjenjaMin", "number"))
    );
  }
}

class NacrtPolnjenja {
  constructor(razdaljaKm, trajanjeVoznjeMin, porabaKWh, potrebnoPolnjenje, postanki, napolnjenostNaCilju, nasveti) {
    this.razdaljaKm = razdaljaKm;
    this.trajanjeVoznjeMin = trajanjeVoznjeMin;
    this.porabaKWh = porabaKWh;
    this.potrebnoPolnjenje = potrebnoPolnjenje;
    this.postanki = postanki; 
    this.napolnjenostNaCilju = napolnjenostNaCilju;
    this.nasveti = nasveti;
  }

  static izJson(json) {
    const o = typeof json === "string" ? JSON.parse(json) : json;

    if (!Array.isArray(o.postanki)) throw new Error('Polje "postanki" mora biti seznam');
    if (!Array.isArray(o.nasveti)) throw new Error('Polje "nasveti" mora biti seznam');

    return new NacrtPolnjenja(
      zahtevaj(o, "razdaljaKm", "number"),
      Math.round(zahtevaj(o, "trajanjeVoznjeMin", "number")),
      zahtevaj(o, "porabaKWh", "number"),
      zahtevaj(o, "potrebnoPolnjenje", "boolean"),
      o.postanki.map((p) => Postanek.izObjekta(p)),
      procent(o, "napolnjenostNaCilju"),
      o.nasveti.map((n) => String(n).trim().replace(/['",]+$/, "")).filter(Boolean)
    );
  }

  get steviloPostankov() {
    return this.postanki.length;
  }

  get skupniCasPolnjenjaMin() {
    return this.postanki.reduce((vsota, p) => vsota + p.casPolnjenjaMin, 0);
  }

  get skupniCasPotiMin() {
    return this.trajanjeVoznjeMin + this.skupniCasPolnjenjaMin;
  }
}

module.exports = { NacrtPolnjenja, Postanek };