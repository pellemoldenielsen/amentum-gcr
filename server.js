import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const API_KEY = process.env.API_KEY;;
const DATE_FILE = "last_date.json"; // hvor vi gemmer datoen lokalt

// Funktion der læser og opdaterer dato
const COUNTER_FILE = "./counter.json"; // ny fil til at tælle antal kald

function getNextDate() {
  // læs nuværende tæller
  let counter = 0;
  if (fs.existsSync(COUNTER_FILE)) {
    counter = JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8")).count;
  }

  counter += 1; // +1 for hvert kald
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: counter }, null, 2));

  let date;

  // læs den sidste dato fra fil
  if (fs.existsSync(DATE_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATE_FILE, "utf8"));
    date = new Date(Date.UTC(data.year, data.month - 1, data.day));

    // 👉 kun hop en dag frem, hver 2. gang
    if (counter % 2 === 0) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
  } else {
    // hvis filen ikke findes, start ved 2017-01-01
    date = new Date(Date.UTC(2017, 0, 1));
  }

  const result = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };

  fs.writeFileSync(DATE_FILE, JSON.stringify(result, null, 2));

  console.log(`💾 Kald #${counter} → dato: ${result.year}-${result.month}-${result.day}`);
  return result;
}

app.get("/latest-gcr", async (req, res) => {
  try {
    const { year, month, day } = getNextDate();

    const url = `https://spacerad.amentum.io/gcr/flux_dlr?year=${year}&month=${month}&day=${day}&z=6&energy=100`;
    console.log(`🔹 Henter data for ${year}-${month}-${day}`);

    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "API-Key":process.env.API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API-fejl: ${response.status}`);
    }

    const data = await response.json();
    res.json({
      date: `${year}-${month}-${day}`,
      flux: data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(`Noget gik galt: ${err.message}`);
  }
});

app.listen(3000, () => {
  console.log("✅ Serveren kører på http://localhost:3000/latest-gcr");
});



