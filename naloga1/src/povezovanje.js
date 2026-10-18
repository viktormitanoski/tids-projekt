function poveziPodatke(polnjenja, vozila, polnilnice) {
  const vozilaPoId = new Map(vozila.map((v) => [v.id, v]));
  const polnilnicePoId = new Map(polnilnice.map((p) => [p.id, p]));

  return polnjenja.map((n) => {
    const vozilo = vozilaPoId.get(n.voziloId) || null;
    const polnilnica = polnilnicePoId.get(n.polnilnicaId) || null;

    if (!vozilo) console.warn(`Opozorilo: polnjenje ${n.id} se sklicuje na neobstoječe vozilo ${n.voziloId}`);
    if (!polnilnica) console.warn(`Opozorilo: polnjenje ${n.id} se sklicuje na neobstoječo polnilnico ${n.polnilnicaId}`);

    return { ...n, vozilo, polnilnica };
  });
}

module.exports = { poveziPodatke };