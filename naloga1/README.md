# Naloga 1: XML in JSON

Projekt: **Pametni pomočnik za polnjenje električnih vozil (polnilnice, pot, stanje baterije)**

Aplikacija v Node.js prebere podatke o polnilnicah, vozilih in opravljenih polnjenjih iz datotek XML, jih poveže prek ID-jev, filtrira po izbranih kriterijih, rezultat izpiše v konzolo ter ga izvozi v `filtrirano.json` in `filtrirano.xml`.

## Struktura projekta

```
naloga1/
├── data/
│   ├── polnilnice.xml     # 15 polnilnic
│   ├── vozila.xml         # 12 električnih vozil
│   └── polnjenja.xml      # 20 opravljenih polnjenj
├── src/
│   ├── index.js           # glavni program
│   ├── modeli.js          # razredi Polnilnica, Vozilo, Polnjenje
│   ├── branje.js          # branje XML in deserializacija
│   ├── povezovanje.js     # povezovanje podatkov prek ID-jev
│   ├── filtriranje.js     # filtri in izpis v tabeli
│   ├── izvoz.js           # izvoz v JSON
│   └── izvozXml.js        # izvoz v XML
├── filtrirano.json        # primer izhoda
├── filtrirano.xml         # primer izhoda
└── package.json
```

## Podatki

| Datoteka | Entiteta | ID | Glavna polja |
|---|---|---|---|
| `polnilnice.xml` | polnilnica | `P01`–`P15` | ime, mesto, upravljavec, priključek, moč (kW), cena (€/kWh), deluje, datum zadnjega pregleda |
| `vozila.xml` | vozilo | `V01`–`V12` | znamka, model, letnik, kapaciteta baterije (kWh), poraba (kWh/100 km), priključek |
| `polnjenja.xml` | polnjenje | `N01`–`N20` | voziloId, polnilnicaId, datum, energija (kWh), trajanje (min), cena (€), ocena |

**Povezave:** vsako polnjenje se prek elementov `<voziloId>` in `<polnilnicaId>` sklicuje na vozilo in polnilnico.

**Tipi podatkov:** besedilna polja (ime, mesto, znamka), številčna polja (moč, cena, energija), logična vrednost (`deluje`) in datumi v obliki `YYYY-MM-DD`.

**Prazni in manjkajoči podatki:**
- polnilnici P04 in P09 imata prazen `<datumZadnjegaPregleda></datumZadnjegaPregleda>`
- polnilnica P15 elementa `datumZadnjegaPregleda` nima
- vozilo V08 nima elementa `letnik`
- polnjenja N04, N09 in N18 imajo prazno `<ocena></ocena>`

V programu se prazni in manjkajoči podatki pretvorijo v `null`, v izvozu JSON so zapisani kot `null`, v izvozu XML pa kot prazen element.

## Namestitev

Potreben je Node.js (različica 18 ali novejša).

```
npm install
```

Uporabljena knjižnica: [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) za branje in ustvarjanje XML.

## Zagon

```
node src/index.js [filtri]
```

ali

```
npm start -- [filtri]
```

### Filtri

Filtre lahko poljubno kombiniraš. Brez filtrov program vrne vsa polnjenja.

| Filter | Pomen | Primer |
|---|---|---|
| `--mesto` | polnjenja v določenem mestu | `--mesto Maribor` |
| `--od` | polnjenja na ta datum ali po njem | `--od 2026-10-01` |
| `--do` | polnjenja na ta datum ali pred njim | `--do 2026-09-30` |
| `--vozilo` | polnjenja določenega vozila | `--vozilo V02` |
| `--upravljavec` | polnjenja pri določenem upravljavcu | `--upravljavec Petrol` |
| `--maxCena` | polnjenja s ceno do vključno tega zneska v € | `--maxCena 20` |

### Primeri

Vsa polnjenja v Ljubljani:

```
node src/index.js --mesto Ljubljana
```

Polnjenja od 1. oktobra 2026 naprej:

```
node src/index.js --od 2026-10-01
```

Polnjenja pri Petrolu, cenejša od 25 €:

```
node src/index.js --upravljavec Petrol --maxCena 25
```

Polnjenja vozila V02 v septembru:

```
node src/index.js --vozilo V02 --od 2026-09-01 --do 2026-09-30
```

## Izhod

Program rezultat izpiše v konzolo kot tabelo in ga shrani v dve datoteki v korenski mapi:

- `filtrirano.json`: podatki o izvozu (datum, filtri, število zapisov) in seznam polnjenj z vgnezdenim vozilom in polnilnico
- `filtrirano.xml`: enaka vsebina v obliki XML, ID-ji so zapisani kot atributi

Priložena primera izhoda sta nastala z ukazom:

```
node src/index.js --mesto Ljubljana
```