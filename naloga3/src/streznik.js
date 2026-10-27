const express = require("express");
const path = require("path");
const { pridobiPodatke } = require("./prenos");
const { moznosti, pripraviPrikaz } = require("./obdelava");

const app = express();
const PORT = 3000;

const PRIVZETA_IZBIRA = {
  kategorija: "1.2.1 Osebni avtomobili (M1)",
  regija: "SLOVENIJA",
  meritev: "Število vseh vozil na dan 31. 12.",
};

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/vozila", async (req, res) => {
  try {
    const { izvor, zapisi } = await pridobiPodatke();
    const izbira = {
      kategorija: req.query.kategorija || PRIVZETA_IZBIRA.kategorija,
      regija: req.query.regija || PRIVZETA_IZBIRA.regija,
      meritev: req.query.meritev || PRIVZETA_IZBIRA.meritev,
    };

    res.json({
      izvor,
      casPridobitve: new Date().toISOString(),
      izbira,
      moznosti: moznosti(zapisi),
      ...pripraviPrikaz(zapisi, izbira),
    });
  } catch (napaka) {
    console.error(napaka);
    res.status(500).json({ napaka: napaka.message });
  }
});

app.listen(PORT, () => {
  console.log(`Strežnik teče na http://localhost:${PORT}`);
});