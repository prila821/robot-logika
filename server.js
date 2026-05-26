// server.js
const express = require("express");
const path = require("path");
const { buatSesi, prosesJawaban, infoLevel } = require("./gameEngine");
const { getProfil, getRanking, getStatistik } = require("./scoreManager");

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sesiAktif = {};

app.post("/api/login", (req, res) => {
  const { nama } = req.body;
  if (!nama || nama.trim().length < 2) return res.status(400).json({ error: "Nama minimal 2 huruf!" });
  const { profil } = getProfil(nama.trim());
  res.json({ sukses: true, profil });
});

app.get("/api/levels", (req, res) => res.json(infoLevel()));

app.post("/api/mulai", (req, res) => {
  const { nama, level } = req.body;
  if (!nama || !level) return res.status(400).json({ error: "Nama dan level wajib diisi" });
  const profil = getStatistik(nama);
  if (!profil) return res.status(404).json({ error: "Pemain tidak ditemukan" });
  if (parseInt(level) > profil.levelTercapai) return res.status(403).json({ error: `Level ${level} masih terkunci!` });
  try {
    const sesi = buatSesi(nama, parseInt(level));
    const id = `${nama}_${Date.now()}`;
    sesiAktif[id] = sesi;
    const s = sesi.soalList[0];
    res.json({
      sessionId: id, totalSoal: sesi.soalList.length,
      level: sesi.level, namaLevel: sesi.namaLevel, konfig: sesi.konfig,
      soal: { nomor: 1, situasi: s.situasi, pertanyaan: s.pertanyaan, pilihan: s.pilihan },
    });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post("/api/jawab", (req, res) => {
  const { sessionId, indexJawaban } = req.body;
  const sesi = sesiAktif[sessionId];
  if (!sesi) return res.status(404).json({ error: "Sesi tidak ditemukan" });
  const hasil = prosesJawaban(sesi, parseInt(indexJawaban));
  if (hasil.selesai) { delete sesiAktif[sessionId]; return res.json(hasil); }
  const s = sesi.soalList[sesi.index];
  res.json({
    ...hasil,
    soal: { nomor: sesi.index + 1, situasi: s.situasi, pertanyaan: s.pertanyaan, pilihan: s.pilihan },
  });
});

app.get("/api/statistik/:nama", (req, res) => {
  const p = getStatistik(req.params.nama);
  if (!p) return res.status(404).json({ error: "Pemain tidak ditemukan" });
  res.json(p);
});

app.get("/api/ranking", (req, res) => res.json(getRanking()));

app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`\n🤖 Robot Logika berjalan di http://localhost:${PORT}\n`));
