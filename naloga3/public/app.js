const grafi = {}; 
const stevilo = (x) => (x === null ? "–" : x.toLocaleString("sl-SI"));

function napolniSeznam(id, moznosti, izbrana) {
  const seznam = document.getElementById(id);
  seznam.innerHTML = moznosti
    .map((m) => `<option ${m === izbrana ? "selected" : ""}>${m}</option>`)
    .join("");
}

function narisi(id, nastavitve) {
  if (grafi[id]) grafi[id].destroy();
  grafi[id] = new Chart(document.getElementById(id), nastavitve);
}

async function nalozi() {
  const parametri = new URLSearchParams();
  for (const id of ["kategorija", "regija", "meritev"]) {
    const vrednost = document.getElementById(id).value;
    if (vrednost) parametri.set(id, vrednost);
  }

  document.getElementById("vir").textContent = "Nalagam podatke s SURS ...";
  const odgovor = await fetch(`/api/vozila?${parametri}`);
  const p = await odgovor.json();
  if (!odgovor.ok) {
    document.getElementById("vir").textContent = "Napaka: " + p.napaka;
    return;
  }

  const cas = new Date(p.casPridobitve).toLocaleString("sl-SI");
  document.getElementById("vir").textContent =
    `Vir: Statistični urad RS, tabela 2222113S (${p.izvor}), pridobljeno ${cas}`;

  napolniSeznam("kategorija", p.moznosti.kategorije, p.izbira.kategorija);
  napolniSeznam("regija", p.moznosti.regije, p.izbira.regija);
  napolniSeznam("meritev", p.moznosti.meritve, p.izbira.meritev);

  const { povzetek } = p;
  document.getElementById("stevilo").textContent = stevilo(povzetek.elektricni);
  document.getElementById("opisStevila").textContent = `električnih vozil (${povzetek.zadnjeLeto})`;
  document.getElementById("delez").textContent =
    povzetek.delezElektricnih === null ? "–" : `${povzetek.delezElektricnih} %`;
  document.getElementById("rast").textContent =
    povzetek.rastProcent === null ? "–" : `${povzetek.rastProcent > 0 ? "+" : ""}${povzetek.rastProcent} %`;

  const leta = p.poLetih.map((v) => v.leto);

  narisi("grafLeta", {
    type: "line",
    data: {
      labels: leta,
      datasets: [
        { label: "Električni pogon", data: p.poLetih.map((v) => v.elektricni), borderColor: "#0f6e56", backgroundColor: "#0f6e56" },
        { label: "Hibridni pogon", data: p.poLetih.map((v) => v.hibridni), borderColor: "#d18a1f", backgroundColor: "#d18a1f" },
      ],
    },
  });

  narisi("grafDelez", {
    type: "bar",
    data: {
      labels: leta,
      datasets: [{ label: "Delež električnih (%)", data: p.poLetih.map((v) => v.delezElektricnih), backgroundColor: "#1d9e75" }],
    },
    options: { plugins: { legend: { display: false } } },
  });

  document.getElementById("naslovRegije").textContent =
    `Delež električnih vozil po regijah v letu ${povzetek.zadnjeLeto} (%)`;
  narisi("grafRegije", {
    type: "bar",
    data: {
      labels: p.poRegijah.map((r) => r.regija),
      datasets: [{ label: "Delež (%)", data: p.poRegijah.map((r) => r.delez), backgroundColor: "#0f6e56" }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { autoSkip: false } } }, 
    },
  });

  document.getElementById("naslovGoriva").textContent =
    `Vozila po vrsti pogona in goriva v letu ${povzetek.zadnjeLeto}`;
  narisi("grafGoriva", {
    type: "doughnut",
    data: {
      labels: p.poGorivih.map((g) => g.gorivo),
      datasets: [{
        data: p.poGorivih.map((g) => g.vrednost),
        backgroundColor: ["#0f6e56", "#d85a30", "#534ab7", "#d18a1f", "#888780", "#1d9e75", "#b4b2a9"],
      }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });
}

for (const id of ["kategorija", "regija", "meritev"]) {
  document.getElementById(id).addEventListener("change", nalozi);
}

nalozi();