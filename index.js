const express = require("express");
const { request } = require("undici");
const cors = require("cors");
const lyricsF = require("lyrics-finder");

let appApi = express();
let appFrontend = express();
const portApi = 8080;
const portFrontend = 8081;

appApi.use(cors());

// Custom lyrics finder function that mimics alltomp3's behavior
async function findLyrics(title, artist) {
  try {
    // Try lyrics-finder first (no API key needed, uses multiple sources)
    const lyrics = await lyricsF(artist, title);
    if (lyrics && lyrics.trim().length > 0) {
      return lyrics;
    }
    throw new Error("No lyrics found");
  } catch (error) {
    // If lyrics-finder fails, try alternative search
    try {
      const lyrics = await lyricsF(`${artist} ${title}`);
      if (lyrics && lyrics.trim().length > 0) {
        return lyrics;
      }
    } catch (e) {
      // Final fallback
      console.log("Lyrics search failed for:", artist, "-", title);
    }
    throw new Error("No lyrics found");
  }
}

appApi.get("/v1/:artist/:title", async function (req, res) {
  if (!req.params.artist || !req.params.title) {
    return res.status(400).send({ error: "Artist or title missing" });
  }

  try {
    const lyrics = await findLyrics(req.params.title, req.params.artist);
    res.send({ lyrics: lyrics });
  } catch (e) {
    console.log("Lyrics error:", e.message);
    res.status(404).send({ error: "No lyrics found" });
  }
});

appApi.get("/suggest/:term", async function (req, res) {
  try {
    const { statusCode, body } = await request(
      `http://api.deezer.com/search?limit=15&q=${encodeURIComponent(req.params.term)}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'lyrics.ovh/1.0.0'
        }
      }
    );

    if (statusCode === 200) {
      const results = JSON.parse(body);
      res.send(results);
    } else {
      throw new Error(`HTTP ${statusCode}`);
    }
  } catch (error) {
    console.log("Suggestion error:", error.message);
    res.status(500).send({ error: "Search suggestions unavailable" });
  }
});

appFrontend.use(express.static("frontend"));

appApi.listen(portApi, function () {
  console.log("API listening on port " + portApi);
});

appFrontend.listen(portFrontend, function () {
  console.log("Frontend listening on port " + portFrontend);
});