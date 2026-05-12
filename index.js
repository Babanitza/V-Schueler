import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// MySQL Pool
const pool = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ------------------------------------------------------
// POST: Bestellung speichern
// ------------------------------------------------------
app.post("/api/bestellungen", async (req, res) => {
  const {
    name, klasse, e_mail, telefonnummer, adresse,
    artikel_1, logo_1, logo_platzierung_1, farbe_1, groesse_1, anzahl_1, einzelpreis_1, kosten_1,
    artikel_2, logo_2, logo_platzierung_2, farbe_2, groesse_2, anzahl_2, einzelpreis_2, kosten_2,
    artikel_3, logo_3, logo_platzierung_3, farbe_3, groesse_3, anzahl_3, einzelpreis_3, kosten_3,
    gesamtkosten, rechnung_verschickt, bezahlt_am, erledigt
  } = req.body;

  if (!name || !klasse || !e_mail || !telefonnummer || !adresse) {
    return res.status(400).json({ error: "Fehlende Felder: Kontakdaten und/oder Artikel 1" });
  }

  try {
    await pool.query(
      `INSERT INTO einträge (
        name, klasse, problem, pause, vertrauensschueler
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        name, klasse, problem, pause, vertrauensschueler
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    res.status(500).json({ error: "Fehler beim Speichern" });
  }
});

// ------------------------------------------------------
// GET: Alle Bestellungen laden
// ------------------------------------------------------
app.get("/api/einträge", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM einträge ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Fehler beim Laden:", err);
    res.status(500).json({ error: "Fehler beim Laden" });
  }
});

// ------------------------------------------------------
// GET: Export für Excel (CSV)
// ------------------------------------------------------
app.get("/export/einträge.csv", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM einträge ORDER BY id DESC"
    );

    if (rows.length === 0) {
      return res.send("Keine Daten");
    }

    const header = Object.keys(rows[0]).join(";");
    const csvRows = rows.map(r =>
      Object.values(r).map(v => (v === null ? "" : v)).join(";")
    );

    const csv = [header, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=einträge.csv");
    res.send(csv);
  } catch (err) {
    console.error("Fehler beim CSV-Export:", err);
    res.status(500).send("Fehler beim CSV-Export");
  }
});



// ------------------------------------------------------
// Server starten
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server läuft auf Port", PORT));