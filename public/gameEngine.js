// gameEngine.js
const { LEVELS, SOAL, HADIAH } = require("./data");
const { simpanHasil } = require("./scoreManager");

function acak(arr) {
  const h = [...arr];
  for (let i = h.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [h[i], h[j]] = [h[j], h[i]];
  }
  return h;
}

function buatSesi(nama, level) {
  const lvl = LEVELS[level];
  if (!lvl) throw new Error("Level tidak valid");
  const soalList = acak(SOAL[`level${level}`] || []).slice(0, lvl.jumlahSoal);
  return {
    nama, level,
    namaLevel: lvl.nama,
    konfig: lvl,
    soalList,
    index: 0,
    skor: 0,
    benar: 0,
    hasilPerSoal: [],
    selesai: false,
  };
}

function prosesJawaban(sesi, indexJawaban) {
  if (sesi.selesai) return { error: "Sesi sudah selesai" };
  const soal = sesi.soalList[sesi.index];
  const benar = indexJawaban === soal.jawaban;
  const tambah = benar ? sesi.konfig.scorePerSoal : 0;

  sesi.hasilPerSoal.push({
    nomor: sesi.index + 1,
    pertanyaan: soal.pertanyaan,
    situasi: soal.situasi,
    dipilih: soal.pilihan[indexJawaban],
    benar: soal.pilihan[soal.jawaban],
    robotEkspresi: soal.robotEkspresi,
    penjelasan: soal.penjelasan,
    jawabBenar: benar,
    skor: tambah,
  });

  if (benar) { sesi.skor += tambah; sesi.benar++; }
  sesi.index++;

  if (sesi.index >= sesi.soalList.length) {
    sesi.selesai = true;
    const lulus = sesi.benar >= sesi.konfig.minLulus;
    const hadiah = lulus ? HADIAH[sesi.level].nama : null;
    const hasilSimpan = {
      level: sesi.level, namaLevel: sesi.namaLevel,
      skor: sesi.skor, benar: sesi.benar,
      totalSoal: sesi.soalList.length, lulus, hadiah,
    };
    const profil = simpanHasil(sesi.nama, hasilSimpan);
    return {
      selesai: true,
      hasilSesi: { ...hasilSimpan, hasilPerSoal: sesi.hasilPerSoal },
      profil,
    };
  }

  return {
    selesai: false, benar,
    penjelasan: soal.penjelasan,
    robotEkspresi: soal.robotEkspresi,
    tambahSkor: tambah,
    totalSkor: sesi.skor,
    soalBerikutnya: sesi.index + 1,
  };
}

function infoLevel() {
  return Object.entries(LEVELS).map(([n, d]) => ({ level: parseInt(n), ...d }));
}

module.exports = { buatSesi, prosesJawaban, infoLevel };
