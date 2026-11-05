const $ = (id) => document.getElementById(id);
let vsaVozila = [];

// prikaz drsnikov v odstotkih
for (const id of ["napolnjenost", "rezerva"]) {
  $(id).addEventListener("input", () => ($(`${id}Izpis`).textContent = `${$(id).value} %`));
}

// privzeti čas odhoda: trenutni čas v brskalniku, zaokrožen na naslednjo uro
function nastaviPrivzetiCas() {
  const cas = new Date();
  cas.setHours(cas.getHours() + 1, 0, 0, 0);
  const lokalno = new Date(cas.getTime() - cas.getTimezoneOffset() * 60000);
  $("casOdhoda").value = lokalno.toISOString().slice(0, 16);
}

// napolni seznam vozil, po želji filtriran z iskalnim nizom
function prikaziVozila(iskanje = "") {
  const niz = iskanje.toLowerCase();
  const izbrana = $("vozilo").value;
  $("vozilo").innerHTML = vsaVozila
    .filter((v) => v.ime.toLowerCase().includes(niz))
    .map((v) => `<option value="${v.id}" ${v.id === izbrana ? "selected" : ""}>${v.ime}</option>`)
    .join("");
}

async function naloziVozila() {
  vsaVozila = await (await fetch("/api/vozila")).json();
  prikaziVozila();
}

$("iskanjeVozila").addEventListener("input", (e) => prikaziVozila(e.target.value));

const minVUre = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`);

// varno vstavljanje besedila (prepreči, da bi se besedilo modela izvedlo kot HTML)
function besedilo(s) {
  const el = document.createElement("span");
  el.textContent = s;
  return el.innerHTML;
}

function prikaziNacrt(p) {
  const n = p.nacrt;

  $("opozorilo").hidden = !p.opozorilo;
  $("opozorilo").textContent = p.opozorilo
    ? `Pozor: načrt modela ni skladen z izračunom dosega. ${p.opozorilo} Predlagane postanke preveri.`
    : "";

  $("razdalja").textContent = `${n.razdaljaKm} km`;
  $("casPoti").textContent = minVUre(n.skupniCasPotiMin);
  $("steviloPostankov").textContent = n.steviloPostankov;
  $("naCilju").textContent = `${n.napolnjenostNaCilju} %`;

  $("postanki").innerHTML = n.potrebnoPolnjenje
    ? n.postanki
        .map(
          (s) => `<li><strong>${besedilo(s.kraj)}</strong> (${s.oddaljenostOdZacetkaKm} km od začetka)<br>
            ${besedilo(s.opis)}<br>
            Prihod z ${s.napolnjenostObPrihodu} %, polni do ${s.polnitiDo} %, približno ${s.casPolnjenjaMin} min.</li>`
        )
        .join("")
    : "<li>Polnjenje ni potrebno, baterija zadošča za celotno pot.</li>";

  $("nasveti").innerHTML = n.nasveti.map((t) => `<li>${besedilo(t)}</li>`).join("");

  $("opomba").textContent =
    `Razdaljo, čas in postanke je ocenil model ${p.model}${p.popravljeno ? " (po samodejnem popravku)" : ""}. ` +
    `Doseg do rezerve (${p.izracun.dosegDoRezerveKm} km pri porabi ${p.izracun.porabaKWh100km} kWh/100 km) je izračunala aplikacija.`;
  $("prompt").textContent = p.prompt;

  $("rezultat").hidden = false;
}

$("obrazec").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("napakaObrazca").textContent = "";

  if (!$("vozilo").value) {
    $("napakaObrazca").textContent = "Izberi vozilo s seznama.";
    return;
  }

  $("gumb").disabled = true;
  $("gumb").textContent = "Model pripravlja načrt ...";

  try {
    const odgovor = await fetch("/api/nacrt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voziloId: $("vozilo").value,
        zacetek: $("zacetek").value,
        cilj: $("cilj").value,
        napolnjenost: Number($("napolnjenost").value),
        rezerva: Number($("rezerva").value),
        casOdhoda: $("casOdhoda").value,
      }),
    });
    const p = await odgovor.json();
    if (!odgovor.ok) throw new Error(p.napaka);
    prikaziNacrt(p);
  } catch (napaka) {
    $("napakaObrazca").textContent = napaka.message;
  } finally {
    $("gumb").disabled = false;
    $("gumb").textContent = "Pripravi načrt";
  }
});

nastaviPrivzetiCas();
naloziVozila();