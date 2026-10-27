# Naloga 3: Odprti podatki

Spletna aplikacija, ki ob vsakem nalaganju s Statističnega urada RS prenese odprte podatke o motornih vozilih v obliki PC-Axis, jih obdela in prikaže na grafih. Poudarek je na električnih vozilih: koliko jih je, kako hitro jih je več in kje v Sloveniji jih je največ.

## Povezava s projektom

Projekt **Pametni pomočnik za polnjenje električnih vozil** je namenjen voznikom električnih vozil. Podatki o številu in rasti električnih vozil po regijah kažejo, kako se trg razvija in kje bo potreba po polnilnicah največja.

## Vir podatkov

| | |
|---|---|
| Ponudnik | Statistični urad Republike Slovenije (SURS) |
| Tabela | 2222113S: Motorna vozila konec leta (31. 12.) in prve registracije teh vozil po kategoriji vozila ter vrsti pogona in goriva, kohezijske in statistične regije, Slovenija, letno |
| Portal odprtih podatkov | [podatki.gov.si](https://podatki.gov.si/dataset/surs2222113s) |
| Format | PC-Axis (`.px`), kodna stran Windows-1250 |
| Dostop | PxWeb API: `https://pxweb.stat.si/SiStatData/api/v1/sl/Data/2222113S.px` |

Spremenljivke v tabeli:

| Spremenljivka | Vrednosti |
|---|---|
| Leto | 2015–2025 |
| Kategorija vozila | 16 kategorij (npr. osebni avtomobili, motorna kolesa, avtobusi) |
| Regija | Slovenija, 2 kohezijski in 12 statističnih regij |
| Vrsta pogona in goriva | skupaj, električni pogon, bencin, dizel, LPG, CNG, hibridni pogon, drugo |
| Meritev | število vseh vozil na dan 31. 12., prve registracije vseh vozil, prve registracije novih vozil |

Skupaj 63.360 vrednosti.

## Arhitektura

```
brskalnik (index.html + Chart.js)
        │  ob nalaganju in ob spremembi filtra: GET /api/vozila?kategorija=...&regija=...&meritev=...
        ▼
strežnik (Node.js + Express)
        │  POST na PxWeb API, odgovor v obliki PX
        │  dekodiranje (Windows-1250), razčlenjevanje (px.js), obdelava
        ▼
SURS (SiStat)
```

Podatki niso vnaprej shranjeni v strani. Ob vsakem nalaganju strani in ob vsaki spremembi filtra strežnik prenese sveže podatke s SURS. Če SURS ni dosegljiv, strežnik uporabi lokalno kopijo `data/2222113S.px`, na strani pa je izpisano, od kod so podatki.

## Struktura projekta

```
naloga3/
├── src/
│   ├── streznik.js     # Express strežnik in API /api/vozila
│   ├── prenos.js       # prenos datoteke PX s SURS (z rezervno lokalno kopijo)
│   ├── beriPx.js       # dekodiranje in razčlenjevanje PC-Axis s px.js
│   └── obdelava.js     # filtriranje in agregacija
├── public/
│   ├── index.html      # stran z grafi
│   ├── app.js          # pridobivanje podatkov in risanje grafov (Chart.js)
│   └── slog.css
├── data/
│   └── 2222113S.px     # rezervna lokalna kopija
└── package.json
```

## Obdelava podatkov

**Razčlenjevanje:** datoteka PX se dekodira iz Windows-1250 (`iconv-lite`) in razčleni s knjižnico [px.js](http://fod.github.io/px.js/). Knjižnica pri branju podatkov odstrani prelome vrstic brez presledka, zato se števila na robovih vrstic zlepijo. To je popravljeno v `beriPx.js`, preden se datoteka preda knjižnici. Simboli SURS za manjkajoče podatke (`-`, `z`, `N`) se pretvorijo v `null`.

**Filtriranje:** uporabnik izbere kategorijo vozila, regijo in meritev.

**Agregacija in izračuni:**
- delež električnih vozil med vsemi vozili za vsako leto
- delež električnih vozil za vsako statistično regijo v zadnjem letu, razvrščeno od največjega
- struktura vozil po vrsti pogona in goriva v zadnjem letu
- rast števila električnih vozil glede na prejšnje leto v %

## Grafi

| Graf | Vrsta | Prikazuje |
|---|---|---|
| Električna in hibridna vozila po letih | črtni | rast obeh vrst pogona |
| Delež električnih vozil po letih | stolpčni | delež električnih v % |
| Delež električnih vozil po regijah | vodoravni stolpčni | primerjava 12 statističnih regij |
| Vozila po vrsti pogona in goriva | kolobarni | struktura v zadnjem letu |

Nad grafi so trije povzetki: število električnih vozil v zadnjem letu, njihov delež in rast glede na prejšnje leto.

## Namestitev in zagon

Potreben je Node.js 18 ali novejši (zaradi vgrajenega `fetch`).

```
npm install
npm start
```

Nato odpri [http://localhost:3000](http://localhost:3000).

## Uporabljene knjižnice

- [Express](https://expressjs.com/): spletni strežnik
- [px.js](http://fod.github.io/px.js/) (paket `px`): razčlenjevanje datotek PC-Axis
- [iconv-lite](https://www.npmjs.com/package/iconv-lite): pretvorba kodne strani Windows-1250
- [Chart.js](https://www.chartjs.org/): grafi