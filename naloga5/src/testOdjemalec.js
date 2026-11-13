const grpc = require("@grpc/grpc-js");
const polnjenje = require("./proto");

const odjemalec = new polnjenje.PolnjenjeStoritev("localhost:50051", grpc.credentials.createInsecure());

const klic = (metoda, zahtevek) =>
  new Promise((resolve, reject) =>
    odjemalec[metoda](zahtevek, (napaka, odgovor) => (napaka ? reject(napaka) : resolve(odgovor)))
  );

(async () => {
  console.log("1) SeznamPolnilnic (Ljubljana):");
  const seznam = await klic("SeznamPolnilnic", { mesto: "Ljubljana" });
  console.table(seznam.polnilnice.map((p) => ({ id: p.id, ime: p.ime, moc_kw: p.moc_kw })));

  console.log("2) PodrobnostiPolnilnice (P12):");
  console.log(await klic("PodrobnostiPolnilnice", { id: "P12" }));

  console.log("\n3) PosodobiStanje (P01 ne deluje):");
  console.log(await klic("PosodobiStanje", { id: "P01", deluje: false }));
  await klic("PosodobiStanje", { id: "P01", deluje: true }); // vrnemo nazaj

  console.log("\n4) IsciVozila ('tesla'):");
  console.log((await klic("IsciVozila", { niz: "tesla", omejitev: 3 })).vozila);

  console.log("\nNapaka za neobstoječo polnilnico:");
  try {
    await klic("PodrobnostiPolnilnice", { id: "P99" });
  } catch (napaka) {
    console.log(`koda ${napaka.code} (${grpc.status[napaka.code]}): ${napaka.details}`);
  }

  console.log("\n5) SpremljajPolnjenje (Tesla Model 3 na P12, 20 % → 80 %):");
  const tok = odjemalec.SpremljajPolnjenje({
    polnilnica_id: "P12",
    vozilo_id: "3403",
    zacetna_napolnjenost: 20,
    ciljna_napolnjenost: 80,
  });
  tok.on("data", (s) =>
    console.log(`min ${s.minuta}: ${s.napolnjenost} %, ${s.moc_kw} kW, ${s.energija_kwh} kWh, ${s.cena_eur} €, še ${s.preostalo_min} min`)
  );
  tok.on("end", () => console.log("Polnjenje končano."));
  tok.on("error", (napaka) => console.error("Napaka toka:", napaka.details));
})().catch((napaka) => console.error("Napaka:", napaka.details || napaka.message));