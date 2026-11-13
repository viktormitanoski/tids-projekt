const $ = (id) => document.getElementById(id);
let izbranaPolnilnica = null;
let tok = null; 
let graf = null;

function besedilo(s) {
  const el = document.createElement("span");
  el.textContent = s;
  return el.innerHTML;
}

async function zahtevaj(url, moznosti) {
  const odgovor = await fetch(url, moznosti);
  const podatki = await odgovor.json();
  if (!odgovor.ok) throw new Error(podatki.napaka);
  return podatki;
}

async function naloziPolnilnice() {
  const parametri = new URLSearchParams({
    mesto: $("mesto").value,
    prikljucek: $("prikljucek").value,
    samoDelujoce: $("samoDelujoce").checked,
  });
  try {
    const { polnilnice, stevilo } = await zahtevaj(`/api/polnilnice?${parametri}`);
    $("steviloPolnilnic").textContent = `Najdenih: ${stevilo}`;
    $("polnilnice").innerHTML = polnilnice
      .map(
        (p) => `<li data-id="${p.id}" class="${p.deluje ? "" : "ne-deluje"} ${p.id === izbranaPolnilnica?.id ? "izbrana" : ""}">
          <div><strong>${besedilo(p.ime)}</strong>
            <small>${besedilo(p.mesto)} · ${p.prikljucek} · ${p.moc_kw} kW · ${p.cena_kwh.toFixed(2)} €/kWh · ${p.deluje ? "deluje" : "ne deluje"}</small>
          </div>
          <button data-preklop="${p.id}" data-deluje="${!p.deluje}">${p.deluje ? "Označi okvaro" : "Popravljeno"}</button>
        </li>`
      )
      .join("");
  } catch (napaka) {
    $("steviloPolnilnic").textContent = napaka.message;
  }
}
async function naloziMesta() {
  const { polnilnice } = await zahtevaj("/api/polnilnice");
  const mesta = [...new Set(polnilnice.map((p) => p.mesto))].sort((a, b) => a.localeCompare(b));
  $("mesto").innerHTML += mesta.map((m) => `<option>${besedilo(m)}</option>`).join("");
}

$("polnilnice").addEventListener("click", async (e) => {
  const preklop = e.target.dataset.preklop;
  if (preklop) {
    await zahtevaj(`/api/polnilnice/${preklop}/stanje`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deluje: e.target.dataset.deluje === "true" }),
    });
    if (izbranaPolnilnica?.id === preklop) await izberiPolnilnico(preklop);
    return naloziPolnilnice();
  }
  const li = e.target.closest("li");
  if (li) await izberiPolnilnico(li.dataset.id);
});

async function izberiPolnilnico(id) {
  izbranaPolnilnica = await zahtevaj(`/api/polnilnice/${id}`);
  const p = izbranaPolnilnica;
  $("izbranaPolnilnica").innerHTML =
    `<strong>${besedilo(p.ime)}</strong>, ${besedilo(p.mesto)} (${besedilo(p.upravljavec)})<br>` +
    `${p.prikljucek}, do ${p.moc_kw} kW, ${p.cena_kwh.toFixed(2)} €/kWh, ${p.deluje ? "deluje" : "<strong>ne deluje</strong>"}`;
  document.querySelectorAll("#polnilnice li").forEach((li) => li.classList.toggle("izbrana", li.dataset.id === id));
}

for (const id of ["mesto", "prikljucek", "samoDelujoce"]) $(id).addEventListener("change", naloziPolnilnice);

let zakasnitev;
async function isciVozila() {
  try {
    const { vozila } = await zahtevaj(`/api/vozila?niz=${encodeURIComponent($("iskanjeVozila").value)}`);
    $("vozilo").innerHTML = vozila
      .map((v) => `<option value="${v.id}">${besedilo(v.ime)} (${v.baterija_kwh} kWh)</option>`)
      .join("");
  } catch (napaka) {
    $("napaka").textContent = napaka.message;
  }
}

$("iskanjeVozila").addEventListener("input", () => {
  clearTimeout(zakasnitev);
  zakasnitev = setTimeout(isciVozila, 250);
});

for (const id of ["od", "do"]) $(id).addEventListener("input", () => ($(`${id}Izpis`).textContent = `${$(id).value} %`));

function pripraviGraf() {
  if (graf) graf.destroy();
  graf = new Chart($("graf"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Moč polnjenja (kW)", data: [], borderColor: "#0f6e56", tension: 0.2 }] },
    options: { animation: false, scales: { x: { title: { display: true, text: "minuta" } }, y: { beginAtZero: true } } },
  });
}

function ustavi() {
  if (tok) tok.close();
  tok = null;
  $("gumb").textContent = "Začni polnjenje";
}

$("gumb").addEventListener("click", () => {
  if (tok) return ustavi(); 

  $("napaka").textContent = "";
  if (!izbranaPolnilnica) return ($("napaka").textContent = "Izberi polnilnico.");
  if (!$("vozilo").value) return ($("napaka").textContent = "Izberi vozilo.");
  if (Number($("od").value) >= Number($("do").value))
    return ($("napaka").textContent = "Ciljna napolnjenost mora biti višja od začetne.");

  const parametri = new URLSearchParams({
    polnilnicaId: izbranaPolnilnica.id,
    voziloId: $("vozilo").value,
    od: $("od").value,
    do: $("do").value,
  });

  pripraviGraf();
  $("potek").hidden = false;
  $("gumb").textContent = "Ustavi";

  tok = new EventSource(`/api/polnjenje?${parametri}`);

  tok.addEventListener("stanje", (e) => {
    const s = JSON.parse(e.data);
    $("vrstica").style.width = `${s.napolnjenost}%`;
    $("odstotek").textContent = `${s.napolnjenost} %`;
    $("moc").textContent = `${s.moc_kw} kW`;
    $("energija").textContent = `${s.energija_kwh} kWh`;
    $("cena").textContent = `${s.cena_eur.toFixed(2)} €`;
    $("preostalo").textContent = `${s.preostalo_min} min`;
    graf.data.labels.push(s.minuta);
    graf.data.datasets[0].data.push(s.moc_kw);
    graf.update();
  });

  tok.addEventListener("konec", ustavi);
  tok.addEventListener("napaka", (e) => {
    $("napaka").textContent = JSON.parse(e.data).napaka;
    ustavi();
  });
});

naloziMesta();
naloziPolnilnice();
isciVozila();