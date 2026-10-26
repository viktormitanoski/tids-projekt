function vStevilo(besedilo) {
  if (!besedilo) return null;
  const samoStevilke = besedilo.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return samoStevilke ? Number(samoStevilke[0]) : null;
}

function pocistiVozilo(v) {
  const porabaWhKm = vStevilo(v.poraba);
  return {
    id: v.id,
    znamka: v.znamka,
    ime: v.ime,
    povezava: v.povezava ? `https://ev-database.org${v.povezava}` : null,
    baterijaKWh: vStevilo(v.baterija),
    dosegKm: vStevilo(v.doseg),
    porabaWhKm: porabaWhKm,
    porabaKWh100km: porabaWhKm !== null ? porabaWhKm / 10 : null,
    hitroPolnjenjeKW: vStevilo(v.hitroPolnjenje),
    prikljucek: v.prikljucek,
    cenaDeEur: vStevilo(v.cena),
    razpolozljivost: v.razpolozljivost,
  };
}

module.exports = { pocistiVozilo, vStevilo };