const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://ev-database.org/", {
    waitUntil: "networkidle2", 
    timeout: 60000,
  });

  console.log("Naslov strani:", await page.title());

  const steviloKartic = await page.$$eval(".list-item", (elementi) => elementi.length);
  console.log("Število vozil na strani:", steviloKartic);

  await new Promise((r) => setTimeout(r, 15000));
  await browser.close();
})();