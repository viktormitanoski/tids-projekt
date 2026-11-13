# Naloga 5: gRPC

Aplikacija za pregled polnilnic in simulacijo polnjenja električnega vozila. Podatki se med strežnikom in aplikacijo prenašajo prek **gRPC** s Protocol Buffers. Polnjenje se prikazuje v realnem času s pretakanjem s strežnika (server-side streaming).

## Povezava s projektom

Del projekta **Pametni pomočnik za polnjenje električnih vozil**. Uporablja polnilnice iz naloge 1 in katalog vozil, ki ga je zbral parser iz naloge 2.

## Arhitektura

```
brskalnik  ──HTTP / SSE──►  spletni strežnik (Express)  ──gRPC──►  gRPC strežnik
(index.html, app.js)        = gRPC odjemalec                       polnilnice, vozila,
                            spletniStreznik.js                     simulacija polnjenja
                                                                   grpcStreznik.js
```

Brskalnik ne podpira gRPC neposredno, zato je spletni strežnik posrednik: klice HTTP prevede v klice gRPC, tok gRPC pa brskalniku posreduje kot Server-Sent Events.

## Storitev in RPC klici

Definicija je v `proto/polnjenje.proto`. Storitev `PolnjenjeStoritev` ima 5 klicev:

| RPC klic | Tip | Zahtevek → odgovor | Sproži ga |
|---|---|---|---|
| `SeznamPolnilnic` | preprost | `FilterPolnilnic` → `SeznamPolnilnicOdgovor` | izbira filtra (mesto, priključek, samo delujoče) |
| `PodrobnostiPolnilnice` | preprost | `IdZahteva` → `Polnilnica` | klik na polnilnico |
| `PosodobiStanje` | preprost | `PosodobitevStanja` → `Polnilnica` | gumb "Označi okvaro" / "Popravljeno" |
| `IsciVozila` | preprost | `IskanjeVozil` → `SeznamVozilOdgovor` | tipkanje v iskalno polje vozila |
| `SpremljajPolnjenje` | **pretakanje s strežnika** | `ZacetekPolnjenja` → `stream StanjePolnjenja` | gumb "Začni polnjenje" |

### Sporočila

- **Podatkovna:** `Polnilnica`, `Vozilo`, `StanjePolnjenja`
- **Zahtevki:** `FilterPolnilnic`, `IdZahteva`, `PosodobitevStanja`, `IskanjeVozil`, `ZacetekPolnjenja`
- **Odgovori:** `SeznamPolnilnicOdgovor`, `SeznamVozilOdgovor`

### Napake

Strežnik vrača statusne kode gRPC, spletni strežnik pa jih pretvori v kode HTTP:

| gRPC | HTTP | Primer |
|---|---|---|
| `NOT_FOUND` | 404 | neobstoječa polnilnica ali vozilo |
| `INVALID_ARGUMENT` | 400 | ciljna napolnjenost ni višja od začetne |
| `FAILED_PRECONDITION` | 409 | polnjenje na polnilnici, ki ne deluje |
| `UNAVAILABLE` | 503 | gRPC strežnik ne teče |

## Simulacija polnjenja

`SpremljajPolnjenje` vsake 0,5 sekunde pošlje eno simulirano minuto polnjenja: napolnjenost baterije, trenutno moč, prejeto energijo, ceno in preostali čas. Simulacija posnema resnično vedenje električnih vozil:

- do 50 % baterije polni s polno močjo, nato moč upada, nad 80 % je polnjenje počasno
- na DC polnilnicah je moč omejena z največjo močjo polnilnice in vozila
- na AC polnilnicah (Type 2) omeji moč polnilnik v vozilu na 11 kW

Ko uporabnik polnjenje ustavi ali zapre stran, spletni strežnik prekliče tok gRPC, gRPC strežnik pa ustavi simulacijo.

Stran prikazuje potek v realnem času: vrstico baterije, številke in graf moči (Chart.js).

## Struktura projekta

```
naloga5/
├── proto/
│   └── polnjenje.proto        # definicija storitve in sporočil
├── src/
│   ├── proto.js               # nalaganje .proto (skupno za strežnik in odjemalca)
│   ├── grpcStreznik.js        # gRPC strežnik (vrata 50051)
│   ├── simulacija.js          # izračun polnjenja
│   ├── spletniStreznik.js     # Express, gRPC odjemalec (vrata 3000)
│   └── testOdjemalec.js       # preizkus vseh klicev v konzoli
├── public/
│   ├── index.html
│   ├── app.js
│   └── slog.css
├── data/
│   ├── polnilnice.json        # 15 polnilnic
│   └── vozila.json            # katalog vozil iz naloge 2
└── package.json
```

## Namestitev in zagon

Potreben je Node.js 18 ali novejši.

```
npm install
```

V dveh terminalih:

```
npm run grpc     # gRPC strežnik na vratih 50051
npm run splet    # spletna aplikacija na http://localhost:3000
```

Preizkus vseh klicev iz konzole (gRPC strežnik mora teči):

```
npm test
```

## Uporabljene knjižnice

- [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js): gRPC za Node.js
- [@grpc/proto-loader](https://www.npmjs.com/package/@grpc/proto-loader): nalaganje datotek `.proto` med izvajanjem
- [Express](https://expressjs.com/): spletni strežnik
- [Chart.js](https://www.chartjs.org/): graf moči polnjenja