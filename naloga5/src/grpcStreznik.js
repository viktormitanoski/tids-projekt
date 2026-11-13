const fs = require("fs");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const polnjenje = require("./proto");
const { korak, preostaleMinute } = require("./simulacija");

const NASLOV = "0.0.0.0:50051";
const INTERVAL_MS = 500; 

const polnilnice = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "polnilnice.json"), "utf-8"));

const vozila = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "vozila.json"), "utf-8"))
  .vozila.filter((v) => v.baterijaKWh)
  .map((v) => ({
    id: v.id,
    ime: v.ime,
    baterija_kwh: v.baterijaKWh,
    hitro_polnjenje_kw: v.hitroPolnjenjeKW ?? 0,
  }));

const napaka = (koda, sporocilo) => ({ code: koda, details: sporocilo });

const koncajZNapako = (call, koda, sporocilo) => call.emit("error", napaka(koda, sporocilo));

function SeznamPolnilnic(call, callback) {
  const { mesto, prikljucek, samo_delujoce } = call.request;
  const rezultat = polnilnice.filter(
    (p) =>
      (!mesto || p.mesto.toLowerCase() === mesto.toLowerCase()) &&
      (!prikljucek || p.prikljucek === prikljucek) &&
      (!samo_delujoce || p.deluje)
  );
  callback(null, { polnilnice: rezultat, stevilo: rezultat.length });
}

function PodrobnostiPolnilnice(call, callback) {
  const p = polnilnice.find((x) => x.id === call.request.id);
  if (!p) return callback(napaka(grpc.status.NOT_FOUND, `Polnilnica ${call.request.id} ne obstaja`));
  callback(null, p);
}

function PosodobiStanje(call, callback) {
  const p = polnilnice.find((x) => x.id === call.request.id);
  if (!p) return callback(napaka(grpc.status.NOT_FOUND, `Polnilnica ${call.request.id} ne obstaja`));
  p.deluje = call.request.deluje;
  console.log(`Polnilnica ${p.id} je zdaj ${p.deluje ? "delujoča" : "nedelujoča"}`);
  callback(null, p);
}

function IsciVozila(call, callback) {
  const niz = call.request.niz.toLowerCase();
  const omejitev = Math.min(call.request.omejitev || 20, 100);
  const rezultat = vozila.filter((v) => v.ime.toLowerCase().includes(niz)).slice(0, omejitev);
  callback(null, { vozila: rezultat });
}

function SpremljajPolnjenje(call) {
  const { polnilnica_id, vozilo_id, zacetna_napolnjenost, ciljna_napolnjenost } = call.request;
  const polnilnica = polnilnice.find((p) => p.id === polnilnica_id);
  const vozilo = vozila.find((v) => v.id === vozilo_id);

  if (!polnilnica || !vozilo) {
    return koncajZNapako(call, grpc.status.NOT_FOUND, "Polnilnica ali vozilo ne obstaja");
  }
  if (!polnilnica.deluje) {
    return koncajZNapako(call, grpc.status.FAILED_PRECONDITION, `Polnilnica ${polnilnica.ime} ne deluje`);
  }
  if (zacetna_napolnjenost < 0 || ciljna_napolnjenost > 100 || zacetna_napolnjenost >= ciljna_napolnjenost) {
    return koncajZNapako(call, grpc.status.INVALID_ARGUMENT, "Ciljna napolnjenost mora biti višja od začetne (0–100 %)");
  }

  console.log(`Začetek polnjenja: ${vozilo.ime} na ${polnilnica.ime}, ${zacetna_napolnjenost} % → ${ciljna_napolnjenost} %`);

  let stanje = { minuta: 0, napolnjenost: zacetna_napolnjenost, energija: 0 };

  const casovnik = setInterval(() => {
    const k = korak(stanje.napolnjenost, polnilnica, vozilo);
    const novaNapolnjenost = Math.min(k.napolnjenost, ciljna_napolnjenost);
    const prejeto = ((novaNapolnjenost - stanje.napolnjenost) / 100) * vozilo.baterija_kwh;
    stanje = {
      minuta: stanje.minuta + 1,
      napolnjenost: novaNapolnjenost,
      energija: stanje.energija + prejeto,
    };
    const koncano = stanje.napolnjenost >= ciljna_napolnjenost;

    call.write({
      minuta: stanje.minuta,
      napolnjenost: Math.round(stanje.napolnjenost * 10) / 10,
      moc_kw: Math.round(k.moc * 10) / 10,
      energija_kwh: Math.round(stanje.energija * 100) / 100,
      cena_eur: Math.round(stanje.energija * polnilnica.cena_kwh * 100) / 100,
      preostalo_min: koncano ? 0 : preostaleMinute(stanje.napolnjenost, ciljna_napolnjenost, polnilnica, vozilo),
      koncano,
    });

    if (koncano) {
      clearInterval(casovnik);
      call.end(); 
    }
  }, INTERVAL_MS);
  call.on("cancelled", () => clearInterval(casovnik));
}

const streznik = new grpc.Server();
streznik.addService(polnjenje.PolnjenjeStoritev.service, {
  SeznamPolnilnic,
  PodrobnostiPolnilnice,
  PosodobiStanje,
  IsciVozila,
  SpremljajPolnjenje,
});

streznik.bindAsync(NASLOV, grpc.ServerCredentials.createInsecure(), (napakaVezave, vrata) => {
  if (napakaVezave) return console.error("Strežnika ni bilo mogoče zagnati:", napakaVezave.message);
  console.log(`gRPC strežnik teče na vratih ${vrata} (polnilnic: ${polnilnice.length}, vozil: ${vozila.length})`);
});