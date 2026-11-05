# Naloga 4: Uporaba LLM

Spletna aplikacija, v kateri uporabnik izbere svoje električno vozilo, vnese pot in stanje baterije, jezikovni model (Google Gemini) pa pripravi načrt polnjenja: ali je polnjenje potrebno, kje se ustaviti, do koliko odstotkov polniti in koliko časa bo trajalo, ter nasvete za vožnjo.

## Povezava s projektom

To je jedro projekta **Pametni pomočnik za polnjenje električnih vozil**. Uporablja katalog vozil, ki ga je zbral parser iz naloge 2 (`data/vozila.json`, 1.538 vozil s podatki o bateriji in porabi).

## Kako deluje

```
obrazec (brskalnik)
   │  POST /api/nacrt  {voziloId, zacetek, cilj, napolnjenost, rezerva, casOdhoda}
   ▼
strežnik (Node.js + Express)
   1. preveri vnos
   2. izračuna energijo in doseg (izracun.js)
   3. sestavi prompt iz vnosa, podatkov o vozilu in izračuna (prompt.js)
   4. pokliče Gemini z zahtevo za JSON po shemi (llm.js)
   5. JSON deserializira v razred NacrtPolnjenja (nacrt.js)
   6. preveri skladnost načrta z izračunom; po potrebi pošlje popravek
   ▼
prikaz načrta v brskalniku
```

## Dinamičen prompt

Prompt ni statičen, ampak je sestavljen iz:

| Vir | Podatki |
|---|---|
| obrazec | vozilo, začetek, cilj, napolnjenost ob odhodu, želena rezerva, čas odhoda |
| katalog vozil (naloga 2) | kapaciteta baterije, poraba, moč hitrega polnjenja, priključek |
| brskalnik | privzeti čas odhoda iz trenutnega časa |
| izračun v aplikaciji | letni čas, poraba glede na letni čas, energija ob odhodu, doseg do rezerve |

Primer sestavljenega prompta je na strani viden pod "Prikaži prompt, poslan modelu".

Besedilo iz obrazca (začetek, cilj) je pred vstavitvijo v prompt omejeno na 80 znakov in očiščeno prelomov vrstic.

## Odgovor v obliki JSON

Modelu je poleg prompta poslana **shema JSON** (`responseMimeType: "application/json"` in `responseJsonSchema`), zato Gemini vrne veljaven JSON z natanko določenimi polji:

```json
{
  "razdaljaKm": 54.2,
  "trajanjeVoznjeMin": 40,
  "porabaKWh": 10.5,
  "potrebnoPolnjenje": false,
  "postanki": [],
  "napolnjenostNaCilju": 46,
  "nasveti": ["..."]
}
```

Odgovor se deserializira v razreda **`NacrtPolnjenja`** in **`Postanek`** (`src/nacrt.js`). Metoda `NacrtPolnjenja.izJson()` preveri obstoj in tip vsakega polja ter ali so odstotki med 0 in 100. Izpeljane vrednosti (število postankov, skupni čas polnjenja, skupni čas poti) izračuna razred sam.

## Zanesljivost

Jezikovni modeli so dobri pri ocenah (razdalje, kraji ob poti, nasveti), slabi pa pri računanju. Zato:

- **Računanje opravi aplikacija:** energija ob odhodu, poraba glede na letni čas in doseg do rezerve se izračunajo v kodi (`izracun.js`) in so modelu podani kot dejstva.
- **Kontrola skladnosti:** aplikacija preveri, ali je načrt skladen z izračunanim dosegom (npr. model trdi, da polnjenje ni potrebno, čeprav je pot daljša od dosega). Če ni, modelu pošlje popravek. Če je načrt neskladen tudi po popravku, je na strani prikazano opozorilo.
- **Ponovni poskusi in rezervni model:** ob začasni napaki (503, 429) aplikacija do trikrat ponovi klic s čedalje daljšim čakanjem, nato poskusi z rezervnim modelom.

Razdalja, čas in postanki so ocene modela, ne izračun storitve za usmerjanje. To je na strani jasno označeno.

## Struktura projekta

```
naloga4/
├── src/
│   ├── streznik.js     # Express strežnik: /api/vozila in /api/nacrt
│   ├── katalog.js      # nalaganje kataloga vozil
│   ├── izracun.js      # izračun energije in dosega
│   ├── prompt.js       # sestavljanje prompta
│   ├── llm.js          # klic Gemini s shemo JSON, ponovni poskusi, kontrola
│   └── nacrt.js        # razreda NacrtPolnjenja in Postanek
├── public/
│   ├── index.html      # obrazec in prikaz načrta
│   ├── app.js
│   └── slog.css
├── data/
│   └── vozila.json     # katalog vozil iz naloge 2
├── .env.example        # vzorec nastavitev
└── package.json
```

## Namestitev in zagon

Potreben je Node.js 18 ali novejši in ključ API za Gemini iz [Google AI Studio](https://aistudio.google.com/).

1. Namesti odvisnosti:
   ```
   npm install
   ```
2. Kopiraj `.env.example` v `.env` in vpiši svoj ključ ter modela:
   ```
   GEMINI_API_KEY=tvoj_kljuc_api
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_MODEL_REZERVA=gemini-3.8-flash
   ```
3. Zaženi:
   ```
   npm start
   ```
4. Odpri [http://localhost:3000](http://localhost:3000).

## Uporabljene knjižnice

- [@google/genai](https://www.npmjs.com/package/@google/genai): uradna knjižnica za Gemini API
- [Express](https://expressjs.com/): spletni strežnik
- [dotenv](https://www.npmjs.com/package/dotenv): branje nastavitev iz `.env`