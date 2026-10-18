const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { Polnilnica, Vozilo, Polnjenje } = require("./modeli");

const MAPA_DATA = path.join(__dirname, "..", "data");

const parser = new XMLParser({
  ignoreAttributes: false,  
  attributeNamePrefix: "",   
  parseTagValue: false,      
  isArray: (ime) => ["polnilnica", "vozilo", "polnjenje"].includes(ime),
});

function preberiXml(imeDatoteke) {
  const vsebina = fs.readFileSync(path.join(MAPA_DATA, imeDatoteke), "utf-8");
  return parser.parse(vsebina);
}

function naloziPolnilnice() {
  const xml = preberiXml("polnilnice.xml");
  return xml.polnilnice.polnilnica.map((p) => new Polnilnica(p));
}

function naloziVozila() {
  const xml = preberiXml("vozila.xml");
  return xml.vozila.vozilo.map((v) => new Vozilo(v));
}

function naloziPolnjenja() {
  const xml = preberiXml("polnjenja.xml");
  return xml.polnjenja.polnjenje.map((n) => new Polnjenje(n));
}

module.exports = { naloziPolnilnice, naloziVozila, naloziPolnjenja };