const { naloziPolnilnice, naloziVozila, naloziPolnjenja } = require("./branje");
const { poveziPodatke } = require("./povezovanje");
const { preberiFiltre, filtriraj, izpisiTabelo } = require("./filtriranje");
const { izvoziJson } = require("./izvoz");
const { izvoziXml } = require("./izvozXml");

const polnilnice = naloziPolnilnice();
const vozila = naloziVozila();
const polnjenja = naloziPolnjenja();

console.log(`Naloženih polnilnic: ${polnilnice.length}, vozil: ${vozila.length}, polnjenj: ${polnjenja.length}`);

const povezana = poveziPodatke(polnjenja, vozila, polnilnice);

const filtri = preberiFiltre();
console.log("Uporabljeni filtri:", Object.keys(filtri).length ? filtri : "brez (vsa polnjenja)");

const rezultati = filtriraj(povezana, filtri);
console.log(`Najdenih polnjenj: ${rezultati.length}\n`);
izpisiTabelo(rezultati);

izvoziJson(rezultati, filtri);
izvoziXml(rezultati, filtri);