function trenutnaMoc(napolnjenost, najvecjaMoc) {
  if (napolnjenost < 50) return najvecjaMoc;
  if (napolnjenost < 80) return najvecjaMoc * (1 - ((napolnjenost - 50) / 30) * 0.5); 
  return najvecjaMoc * (0.5 - ((napolnjenost - 80) / 20) * 0.35); 
}

function najvecjaMoc(polnilnica, vozilo) {
  if (polnilnica.prikljucek === "TYPE2") return Math.min(polnilnica.moc_kw, 11);
  const vrhVozila = (vozilo.hitro_polnjenje_kw || 50) * 1.4;
  return Math.min(polnilnica.moc_kw, vrhVozila);
}

function korak(napolnjenost, polnilnica, vozilo) {
  const moc = trenutnaMoc(napolnjenost, najvecjaMoc(polnilnica, vozilo));
  const energija = moc / 60; 
  return { moc, energija, napolnjenost: napolnjenost + (energija / vozilo.baterija_kwh) * 100 };
}

function preostaleMinute(napolnjenost, cilj, polnilnica, vozilo) {
  let minute = 0;
  while (napolnjenost < cilj && minute < 1000) {
    napolnjenost = korak(napolnjenost, polnilnica, vozilo).napolnjenost;
    minute++;
  }
  return minute;
}

module.exports = { korak, preostaleMinute };