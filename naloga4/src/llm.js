require("dotenv").config({ quiet: true });
const { GoogleGenAI } = require("@google/genai");
const { NacrtPolnjenja } = require("./nacrt");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELI = [process.env.GEMINI_MODEL, process.env.GEMINI_MODEL_REZERVA].filter(Boolean);

const SHEMA = {
  type: "object",
  properties: {
    razdaljaKm: { type: "number", description: "Ocenjena dolžina poti v km" },
    trajanjeVoznjeMin: { type: "integer", description: "Ocenjen čas vožnje brez postankov v minutah" },
    porabaKWh: { type: "number", description: "Ocenjena poraba energije za celotno pot v kWh" },
    potrebnoPolnjenje: { type: "boolean" },
    postanki: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kraj: { type: "string" },
          opis: { type: "string", description: "Kratek opis lokacije polnjenja" },
          oddaljenostOdZacetkaKm: { type: "number" },
          napolnjenostObPrihodu: { type: "integer", minimum: 0, maximum: 100 },
          polnitiDo: { type: "integer", minimum: 0, maximum: 100 },
          casPolnjenjaMin: { type: "integer" },
        },
        required: ["kraj", "opis", "oddaljenostOdZacetkaKm", "napolnjenostObPrihodu", "polnitiDo", "casPolnjenjaMin"],
      },
    },
    napolnjenostNaCilju: { type: "integer", minimum: 0, maximum: 100 },
    nasveti: { type: "array", items: { type: "string" } },
  },
  required: ["razdaljaKm", "trajanjeVoznjeMin", "porabaKWh", "potrebnoPolnjenje", "postanki", "napolnjenostNaCilju", "nasveti"],
};

const pocakaj = (ms) => new Promise((r) => setTimeout(r, ms));

function jeZacasnaNapaka(napaka) {
  return [429, 500, 503].includes(napaka.status) || /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(napaka.message);
}

async function poklici(prompt) {
  let zadnjaNapaka;

  for (const model of MODELI) {
    for (let poskus = 1; poskus <= 3; poskus++) {
      try {
        const odgovor = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: SHEMA,
            temperature: 0.3,
          },
        });
        return { model, besedilo: odgovor.text };
      } catch (napaka) {
        zadnjaNapaka = napaka;
        if (!jeZacasnaNapaka(napaka)) throw napaka;
        console.warn(`${model}, poskus ${poskus}: ${napaka.message.slice(0, 80)}`);
        await pocakaj(poskus * 2000); // 2 s, 4 s, 6 s
      }
    }
  }
  throw zadnjaNapaka;
}

function preveriSkladnost(nacrt, izracun) {
  if (!nacrt.potrebnoPolnjenje && nacrt.razdaljaKm > izracun.dosegDoRezerveKm) {
    return `Ocenil si razdaljo ${nacrt.razdaljaKm} km, brez polnjenja pa je mogoče prevoziti le ${izracun.dosegDoRezerveKm} km. Polnjenje je potrebno.`;
  }
  if (nacrt.potrebnoPolnjenje && nacrt.steviloPostankov === 0) {
    return "Navedel si, da je polnjenje potrebno, a nisi predlagal nobenega postanka.";
  }
  const prvi = nacrt.postanki[0];
  if (prvi && prvi.oddaljenostOdZacetkaKm > izracun.dosegDoRezerveKm) {
    return `Prvi postanek je ${prvi.oddaljenostOdZacetkaKm} km od začetka, doseg pa je le ${izracun.dosegDoRezerveKm} km.`;
  }
  return null;
}

async function pridobiNacrt(prompt, izracun) {
  let { model, besedilo } = await poklici(prompt);
  let nacrt = NacrtPolnjenja.izJson(besedilo);

  const tezava = preveriSkladnost(nacrt, izracun);
  if (tezava) {
    console.warn("Neskladen odgovor, pošiljam popravek:", tezava);
    ({ model, besedilo } = await poklici(`${prompt}\n\nPOPRAVEK: Tvoj prejšnji odgovor je bil napačen. ${tezava} Pripravi nov načrt.`));
    nacrt = NacrtPolnjenja.izJson(besedilo);
  }

  return { model, nacrt, popravljeno: Boolean(tezava), opozorilo: preveriSkladnost(nacrt, izracun) };
}

module.exports = { pridobiNacrt, SHEMA };