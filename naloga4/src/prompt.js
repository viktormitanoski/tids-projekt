function ocisti(besedilo, maxDolzina = 80) {
  return String(besedilo).replace(/[\r\n]+/g, " ").trim().slice(0, maxDolzina);
}

function sestaviPrompt({ vozilo, zacetek, cilj, napolnjenost, rezerva, casOdhoda }, izracun) {
  const odhodBesedilo = new Date(casOdhoda).toLocaleString("sl-SI", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const hitroPolnjenje = vozilo.hitroPolnjenjeKW
    ? `povprečna moč hitrega polnjenja ${vozilo.hitroPolnjenjeKW} kW`
    : "moč hitrega polnjenja ni znana";

  return `Si pomočnik za načrtovanje polnjenja električnih vozil v Sloveniji in sosednjih državah.

Pripravi načrt polnjenja za to vožnjo:
- Vozilo: ${vozilo.ime} (uporabna baterija ${vozilo.baterijaKWh} kWh, ${hitroPolnjenje}, priključek ${vozilo.prikljucek ?? "ni znan"})
- Začetek: ${ocisti(zacetek)}
- Cilj: ${ocisti(cilj)}
- Odhod: ${odhodBesedilo} (${izracun.sezona})
- Napolnjenost ob odhodu: ${napolnjenost} % (${izracun.energijaOdhodKWh} kWh)
- Želena najmanjša napolnjenost na cilju: ${rezerva} % (${izracun.energijaRezervaKWh} kWh)

Izračunani podatki (upoštevaj jih natančno, ne računaj jih znova):
- Poraba za to vožnjo: ${izracun.porabaKWh100km} kWh/100 km (že upošteva letni čas)
- Brez polnjenja lahko vozilo prevozi največ ${izracun.dosegDoRezerveKm} km, preden pade na želeno rezervo.

Navodila:
1. Oceni dolžino najobičajnejše poti po cestah in čas vožnje. Porabo izračunaj kot razdalja × ${izracun.porabaKWh100km} / 100.
2. Če je pot krajša od ${izracun.dosegDoRezerveKm} km, polnjenje ni potrebno: nastavi potrebnoPolnjenje na false in vrni prazen seznam postankov.
3. Če je pot daljša od ${izracun.dosegDoRezerveKm} km, je polnjenje obvezno. Predlagaj čim manj postankov ob poti. Prvi postanek mora biti bližje kot ${izracun.dosegDoRezerveKm} km od začetka. Pri vsakem navedi kraj, kratek opis lokacije (npr. počivališče ob avtocesti), napolnjenost ob prihodu, do koliko % polniti in koliko minut bo polnjenje trajalo glede na moč polnjenja vozila.
4. Napolnjenost ob prihodu na noben postanek ne sme pasti pod 10 %, na cilju pa ne pod ${rezerva} %.
5. Ne izmišljuj si imen konkretnih polnilnic, ki jih ne poznaš. Raje opiši vrsto lokacije.
6. Dodaj 2 do 4 kratke praktične nasvete za to vožnjo.
7. Vse besedilo napiši v slovenščini.`;
}

module.exports = { sestaviPrompt };