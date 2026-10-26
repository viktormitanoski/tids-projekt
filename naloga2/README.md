# Naloga 2: Parser

Razčlenjevalnik (parser), ki s spletne strani [EV Database](https://ev-database.org/) samodejno prebere podatke o električnih vozilih in jih shrani v datoteko JSON.

## Povezava s projektom

Pametni pomočnik za polnjenje za izračun načrta polnjenja potrebuje podatke o vozilu: kapaciteto baterije, porabo in moč hitrega polnjenja. Namesto ročnega vnosa jih parser zbere za vsa električna vozila na evropskem trgu. Datoteka `output/vozila.json` bo služila kot katalog vozil, iz katerega bo uporabnik v končnem izdelku izbral svoje vozilo.

## Struktura projekta

```
naloga2/
├── src/
│   ├── index.js        # glavni program
│   ├── parser.js       # Puppeteer: odpiranje strani, branje kartic, listanje
│   ├── ciscenje.js     # pretvorba besedila v števila
│   └── izvoz.js        # shranjevanje v JSON
├── output/
│   └── vozila.json     # rezultat razčlenjevanja
└── package.json
```

## Kako deluje

1. Puppeteer v ozadju zažene brskalnik Chrome in odpre `https://ev-database.org/`.
2. Na strani poišče vse kartice vozil (`.list-item`) in iz vsake prebere podatke s selektorji CSS.
3. Stran prikazuje po 10 vozil, zato parser klikne gumb za naslednjo stran in počaka, da se seznam zamenja. To ponavlja, dokler gumb ni onemogočen.
4. Prebrano besedilo očisti in pretvori v števila (npr. `"720 km"` → `720`, `"€65,900"` → `65900`). Manjkajoči podatki postanejo `null`.
5. Odstrani morebitne podvojene zapise in rezultat shrani v `output/vozila.json`.

## Prebrani podatki

| Polje | Tip | Selektor na strani | Opis |
|---|---|---|---|
| `id` | niz | `.id` | ID vozila na EV Database |
| `znamka` | niz | `a.title span:first-child` | proizvajalec |
| `ime` | niz | `a.title .hidden` | polno ime modela |
| `povezava` | niz | `a.title` (`href`) | povezava na podrobnosti vozila |
| `baterijaKWh` | število | `.battery` | uporabna kapaciteta baterije v kWh |
| `dosegKm` | število | `.erange_real` | realen doseg v km |
| `porabaWhKm` | število | `.efficiency` | poraba v Wh/km |
| `porabaKWh100km` | število | izračunano | poraba v kWh/100 km (Wh/km ÷ 10) |
| `hitroPolnjenjeKW` | število | `.fastcharge_speed` | povprečna moč hitrega polnjenja (10–80 %) |
| `prikljucek` | niz | `[class^="plug-"]` | tip priključka |
| `cenaDeEur` | število | `.country_de` | začetna cena v Nemčiji v € |
| `razpolozljivost` | niz | `.availability` | ali je vozilo na voljo ali ukinjeno |

## Primer zapisa

```json
{
  "id": "3657",
  "znamka": "BMW",
  "ime": "BMW i3 50 xDrive",
  "povezava": "https://ev-database.org/car/3657/BMW-i3-50-xDrive",
  "baterijaKWh": 108.7,
  "dosegKm": 720,
  "porabaWhKm": 151,
  "porabaKWh100km": 15.1,
  "hitroPolnjenjeKW": 230,
  "prikljucek": "Type 2 CCS",
  "cenaDeEur": 65900,
  "razpolozljivost": "Available to order since June 2026"
}
```

Na vrhu datoteke sta še vir podatkov (`vir`), čas razčlenjevanja (`datumRazclenjevanja`) in število vozil (`steviloVozil`).

## Namestitev

Potreben je Node.js (različica 18 ali novejša).

```
npm install
```

Ob namestitvi Puppeteer prenese svojo različico brskalnika Chrome.

## Zagon

Branje vseh strani (traja nekaj minut):

```
node src/index.js
```

Branje le prvih nekaj strani, npr. za preizkus:

```
node src/index.js --strani 3
```

## Vir podatkov

Podatki so last strani [EV Database](https://ev-database.org/) in so uporabljeni izključno v študijske namene. Datoteka `robots.txt` strani razčlenjevanja ne omejuje. Parser stran naloži enkrat na zagon, listanje pa poteka v brskalniku, zato strežnika dodatno ne obremenjuje.