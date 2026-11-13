const express = require("express");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const polnjenje = require("./proto");

const PORT = 3000;
const GRPC_NASLOV = "localhost:50051";

const odjemalec = new polnjenje.PolnjenjeStoritev(GRPC_NASLOV, grpc.credentials.createInsecure());

const klic = (metoda, zahtevek) =>
  new Promise((resolve, reject) =>
    odjemalec[metoda](zahtevek, (napaka, odgovor) => (napaka ? reject(napaka) : resolve(odgovor)))
  );

const HTTP_KODE = {
  [grpc.status.NOT_FOUND]: 404,
  [grpc.status.INVALID_ARGUMENT]: 400,
  [grpc.status.FAILED_PRECONDITION]: 409,
  [grpc.status.UNAVAILABLE]: 503,
};

function posredujNapako(res, napaka) {
  const sporocilo =
    napaka.code === grpc.status.UNAVAILABLE ? "gRPC strežnik ni dosegljiv. Ali teče grpcStreznik.js?" : napaka.details;
  res.status(HTTP_KODE[napaka.code] || 500).json({ napaka: sporocilo });
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/polnilnice", async (req, res) => {
  try {
    res.json(
      await klic("SeznamPolnilnic", {
        mesto: req.query.mesto || "",
        prikljucek: req.query.prikljucek || "",
        samo_delujoce: req.query.samoDelujoce === "true",
      })
    );
  } catch (napaka) {
    posredujNapako(res, napaka);
  }
});

app.get("/api/polnilnice/:id", async (req, res) => {
  try {
    res.json(await klic("PodrobnostiPolnilnice", { id: req.params.id }));
  } catch (napaka) {
    posredujNapako(res, napaka);
  }
});

app.put("/api/polnilnice/:id/stanje", async (req, res) => {
  try {
    res.json(await klic("PosodobiStanje", { id: req.params.id, deluje: Boolean(req.body.deluje) }));
  } catch (napaka) {
    posredujNapako(res, napaka);
  }
});

app.get("/api/vozila", async (req, res) => {
  try {
    res.json(await klic("IsciVozila", { niz: req.query.niz || "", omejitev: 30 }));
  } catch (napaka) {
    posredujNapako(res, napaka);
  }
});

app.get("/api/polnjenje", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const tok = odjemalec.SpremljajPolnjenje({
    polnilnica_id: req.query.polnilnicaId,
    vozilo_id: req.query.voziloId,
    zacetna_napolnjenost: Number(req.query.od),
    ciljna_napolnjenost: Number(req.query.do),
  });
  const poslji = (dogodek, podatki) => {
    if (!res.writableEnded) res.write(`event: ${dogodek}\ndata: ${JSON.stringify(podatki)}\n\n`);
  };
  const zakljuci = (dogodek, podatki) => {
    poslji(dogodek, podatki);
    if (!res.writableEnded) res.end();
  };

  tok.on("data", (stanje) => poslji("stanje", stanje));
  tok.on("end", () => zakljuci("konec", {}));
  tok.on("error", (napaka) => {
    if (napaka.code === grpc.status.CANCELLED) return; 
    zakljuci("napaka", { napaka: napaka.details });
  });

  res.on("close", () => tok.cancel());
});

app.listen(PORT, () => console.log(`Spletna aplikacija teče na http://localhost:${PORT}`));