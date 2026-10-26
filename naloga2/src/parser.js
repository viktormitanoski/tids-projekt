const puppeteer = require("puppeteer");
const { pocistiVozilo } = require("./ciscenje");

const URL = "https://ev-database.org/";

async function preberiTrenutnoStran(page) {
  return page.$$eval(".list-item", (kartice) =>
    kartice.map((k) => {
      const besedilo = (selektor) => {
        const el = k.querySelector(selektor);
        return el ? el.textContent.trim() : null;
      };
      return {
        id: besedilo(".id"),
        znamka: besedilo("a.title span:first-child"),
        ime: besedilo("a.title .hidden"),
        povezava: k.querySelector("a.title")?.getAttribute("href") ?? null,
        baterija: besedilo(".battery"),
        doseg: besedilo(".erange_real"),
        poraba: besedilo(".efficiency"),
        hitroPolnjenje: besedilo(".fastcharge_speed"),
        prikljucek: besedilo('[class^="plug-"]'),
        cena: besedilo(".country_de"),
        razpolozljivost: besedilo(".availability"),
      };
    })
  );
}

async function razcleni(maxStrani) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`Odpiram ${URL} ...`);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector(".list-item");

  const vsaVozila = [];
  let stran = 1;

  while (true) {
    const surova = await preberiTrenutnoStran(page);
    vsaVozila.push(...surova.map(pocistiVozilo));
    console.log(`Stran ${stran}: prebranih ${surova.length} vozil (skupaj ${vsaVozila.length})`);

    if (maxStrani && stran >= maxStrani) break;

    const gumb = await page.$('button[data-type="next"]:not(.jplist-disabled)');
    if (!gumb) break;

    const prviId = surova[0]?.id;
    await gumb.evaluate((b) => b.click());
    await page.waitForFunction(
      (staro) => document.querySelector(".list-item .id")?.textContent.trim() !== staro,
      { timeout: 10000 },
      prviId
    );
    stran++;
  }

  await browser.close();
  return vsaVozila;
}

module.exports = { razcleni };