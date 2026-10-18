function vStevilo(vrednost) {
  if (vrednost === undefined || vrednost === "") return null;
  return Number(vrednost);
}

function vBesedilo(vrednost) {
  if (vrednost === undefined || vrednost === "") return null;
  return String(vrednost);
}

class Polnilnica {
  constructor(p) {
    this.id = p.id;
    this.ime = vBesedilo(p.ime);
    this.mesto = vBesedilo(p.mesto);
    this.upravljavec = vBesedilo(p.upravljavec);
    this.prikljucek = vBesedilo(p.prikljucek);
    this.mocKW = vStevilo(p.mocKW);
    this.cenaKWh = vStevilo(p.cenaKWh);
    this.deluje = p.deluje === "true";
    this.datumZadnjegaPregleda = vBesedilo(p.datumZadnjegaPregleda);
  }
}

class Vozilo {
  constructor(v) {
    this.id = v.id;
    this.znamka = vBesedilo(v.znamka);
    this.model = vBesedilo(v.model);
    this.letnik = vStevilo(v.letnik);
    this.kapacitetaKWh = vStevilo(v.kapacitetaKWh);
    this.porabaKWh100km = vStevilo(v.porabaKWh100km);
    this.prikljucek = vBesedilo(v.prikljucek);
  }
}

class Polnjenje {
  constructor(n) {
    this.id = n.id;
    this.voziloId = vBesedilo(n.voziloId);
    this.polnilnicaId = vBesedilo(n.polnilnicaId);
    this.datum = vBesedilo(n.datum);
    this.energijaKWh = vStevilo(n.energijaKWh);
    this.trajanjeMin = vStevilo(n.trajanjeMin);
    this.cenaEur = vStevilo(n.cenaEur);
    this.ocena = vStevilo(n.ocena);
  }
}

module.exports = { Polnilnica, Vozilo, Polnjenje };