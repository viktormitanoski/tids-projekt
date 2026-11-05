const express = require("express");
const path = require("path");
const { naloziVozila, poisciVozilo } = require("./katalog");
const { izracunajEnergijo } = require("./izracun");
const { sestaviPrompt } = require("./prompt");
const { pridobiNacrt } = require("./llm");

const app = express();
const PORT = 3000;

app.use(express.json()); 
app.use(express.static(path.join(__dirname, "..", "public")));

function obdobje(razpolozljivost) {
  const leta = (razpolozljivost ?? "").match(/\d{4}/g);
  if (!leta) return "";
  return leta.length > 1 ? `${leta[0]}–${leta[leta.length - 1]}` : `od ${leta[0]}`;
}

app.get("/api/vozila", (req, res) => {
  res.json(
    naloziVozila().map((v) => ({
      id: v.id,
      ime: `${v.ime} (${v.baterijaKWh} kWh${obdobje(v.razpolozljivost) ? ", " + obdobje(v.razpolozljivost) : ""})`,
    }))
  );
});

function preveriVnos(v) {
  if (!v.zacetek?.trim() || !v.cilj?.trim()) return "Vnesi začetek in cilj poti.";
  if (!Number.isInteger(v.napolnjenost) || v.napolnjenost < 1 || v.napolnjenost > 100)
    return "Napolnjenost mora biti celo število med 1 in 100.";
  if (!Number.isInteger(v.rezerva) || v.rezerva < 0 || v.rezerva > 50)
    return "Rezerva mora biti celo število med 0 in 50.";
  if (Number.isNaN(new Date(v.casOdhoda).getTime())) return "Čas odhoda ni veljaven.";
  return null;
}

app.post("/api/nacrt", async (req, res) => {
  const vnos = {
    vozilo: poisciVozilo(String(req.body.voziloId)),
    zacetek: req.body.zacetek,
    cilj: req.body.cilj,
    napolnjenost: Number(req.body.napolnjenost),
    rezerva: Number(req.body.rezerva),
    casOdhoda: req.body.casOdhoda,
  };

  if (!vnos.vozilo) return res.status(400).json({ napaka: "Izbrano vozilo ne obstaja." });
  const napakaVnosa = preveriVnos(vnos);
  if (napakaVnosa) return res.status(400).json({ napaka: napakaVnosa });

  try {
    const izracun = izracunajEnergijo(vnos);
    const prompt = sestaviPrompt(vnos, izracun);
    const { model, nacrt, popravljeno, opozorilo } = await pridobiNacrt(prompt, izracun);

    res.json({
      model,
      popravljeno,
      opozorilo,
      prompt, 
      vozilo: vnos.vozilo,
      izracun,
      nacrt: {
        ...nacrt,
        steviloPostankov: nacrt.steviloPostankov,
        skupniCasPolnjenjaMin: nacrt.skupniCasPolnjenjaMin,
        skupniCasPotiMin: nacrt.skupniCasPotiMin,
      },
    });
  } catch (napaka) {
    console.error(napaka);
    res.status(502).json({ napaka: "Načrta ni bilo mogoče pripraviti: " + napaka.message });
  }
});

app.listen(PORT, () => {
  console.log(`Strežnik teče na http://localhost:${PORT}`);
});