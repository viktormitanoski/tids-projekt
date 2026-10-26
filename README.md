# Pametni pomočnik za polnjenje električnih vozil

Projekt pri predmetu **Tehnologije integracije in digitalizacije storitev**.

Sistem vozniku električnega vozila pripravi načrt polnjenja za izbrano pot. Povezuje odprte podatke o polnilnicah (Open Charge Map), izračun poti (OpenRouteService), geokodiranje (Nominatim) in obveščanje prek sporočilne vrste (RabbitMQ).

**Avtor:** Viktor Mitanoski

## Naloge

| Naloga | Opis |
|---|---|
| [Naloga 1: XML in JSON](naloga1/) | branje, povezovanje in filtriranje podatkov iz XML ter izvoz v JSON in XML |
| [Naloga 2: Parser](naloga2/) | razčlenjevanje podatkov o električnih vozilih s strani EV Database s Puppeteerjem in shranjevanje v JSON |

## Tehnologije

- Node.js (JavaScript)
- fast-xml-parser
- Puppeteer