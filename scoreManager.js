// scoreManager.js
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "scores.json");

function bacaData() {
  try {
    if (!fs.existsSync(FILE)) {
      const awal = { pemain: {}, ranking: [] };
      fs.writeFileSync(FILE, JSON.stringify(awal, null, 2));
      return awal;
    }
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { pemain: {}, ranking: [] };
  }
}

function simpanData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function kunci(nama) {
  return nama.toLowerCase().replace(/\s+/g, "_");
}

function profilBaru(nama) {
  return {
    nama,
    dibuat: new Date().toISOString(),
    totalSkor: 0,
    levelTercapai: 1,
    levelSelesai: [],
    hadiah: [],
    riwayat: [],
    statistik: {
      totalSoal: 0,
      benar: 0,
      salah: 0,
      akurasi: 0,
    },
  };
}

function getProfil(nama) {
  const data = bacaData();
  const k = kunci(nama);
  if (!data.pemain[k]) {
    data.pemain[k] = profilBaru(nama);
    simpanData(data);
  }
  return { k, profil: data.pemain[k] };
}

function simpanHasil(nama, hasil) {
  const data = bacaData();
  const k = kunci(nama);
  if (!data.pemain[k]) data.pemain[k] = profilBaru(nama);
  const p = data.pemain[k];

  // Riwayat
  p.riwayat.push({
    id: Date.now(),
    tanggal: new Date().toISOString(),
    level: hasil.level,
    namaLevel: hasil.namaLevel,
    skor: hasil.skor,
    benar: hasil.benar,
    totalSoal: hasil.totalSoal,
    lulus: hasil.lulus,
  });

  // Statistik
  p.statistik.totalSoal += hasil.totalSoal;
  p.statistik.benar += hasil.benar;
  p.statistik.salah += hasil.totalSoal - hasil.benar;
  p.statistik.akurasi = Math.round((p.statistik.benar / p.statistik.totalSoal) * 100);

  // Level & hadiah
  if (hasil.lulus) {
    if (!p.levelSelesai.includes(hasil.level)) p.levelSelesai.push(hasil.level);
    if (hasil.level < 5 && hasil.level + 1 > p.levelTercapai) p.levelTercapai = hasil.level + 1;
    if (hasil.hadiah && !p.hadiah.includes(hasil.hadiah)) p.hadiah.push(hasil.hadiah);
  }

  // Hitung ulang total skor dari skor terbaik per level
  const best = {};
  for (const r of p.riwayat) {
    if (!best[r.level] || r.skor > best[r.level]) best[r.level] = r.skor;
  }
  p.totalSkor = Object.values(best).reduce((a, b) => a + b, 0);

  data.pemain[k] = p;

  // Ranking
  data.ranking = Object.values(data.pemain)
    .map((x) => ({ nama: x.nama, totalSkor: x.totalSkor, levelTercapai: x.levelTercapai, hadiah: x.hadiah.length }))
    .sort((a, b) => b.totalSkor - a.totalSkor)
    .slice(0, 10);

  simpanData(data);
  return p;
}

function getRanking() {
  return bacaData().ranking;
}

function getStatistik(nama) {
  return bacaData().pemain[kunci(nama)] || null;
}

module.exports = { getProfil, simpanHasil, getRanking, getStatistik };
