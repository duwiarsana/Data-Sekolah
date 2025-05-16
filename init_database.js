const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Buka koneksi database
const db = new sqlite3.Database('./wilayah.db', (err) => {
    if (err) {
        console.error('Error membuka database', err.message);
        return;
    }
    console.log('Terhubung ke database wilayah.');

    // Aktifkan foreign key support
    db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
            console.error('Error mengaktifkan foreign keys', err.message);
            return;
        }

        // Hapus tabel jika sudah ada
        db.run('DROP TABLE IF EXISTS kabupaten_kota', (err) => {
            if (err) {
                console.error('Error menghapus tabel kabupaten_kota', err.message);
                return;
            }

            db.run('DROP TABLE IF EXISTS provinsi', (err) => {
                if (err) {
                    console.error('Error menghapus tabel provinsi', err.message);
                    return;
                }

                // Buat tabel provinsi
                db.run(`CREATE TABLE provinsi (
    kode TEXT PRIMARY KEY,
    nama TEXT
)`, (err) => {
    if (err) {
        console.error('Error membuat tabel provinsi', err.message);
    }
});

// Buat tabel kabupaten/kota
db.run(`CREATE TABLE kabupaten_kota (
    kode TEXT PRIMARY KEY,
    nama TEXT,
    kode_provinsi TEXT,
    FOREIGN KEY(kode_provinsi) REFERENCES provinsi(kode)
)`, (err) => {
    if (err) {
        console.error('Error membuat tabel kabupaten_kota', err.message);
    }
});

// Data provinsi Bali
const provinsiData = [
    { kode: '220000', nama: 'Bali' }
];

// Data kabupaten/kota di Bali
const kabupatenData = [
    { kode: '220101', nama: 'Kab. Badung', kode_provinsi: '220000' },
    { kode: '220102', nama: 'Kab. Bangli', kode_provinsi: '220000' },
    { kode: '220103', nama: 'Kab. Buleleng', kode_provinsi: '220000' },
    { kode: '220104', nama: 'Kab. Gianyar', kode_provinsi: '220000' },
    { kode: '220105', nama: 'Kab. Jembrana', kode_provinsi: '220000' },
    { kode: '220106', nama: 'Kab. Karangasem', kode_provinsi: '220000' },
    { kode: '220107', nama: 'Kab. Klungkung', kode_provinsi: '220000' },
    { kode: '220108', nama: 'Kab. Tabanan', kode_provinsi: '220000' },
    { kode: '226000', nama: 'Kota Denpasar', kode_provinsi: '220000' }
];

// Fungsi untuk insert data dengan cek duplikasi
function insertProvinsi(provinsi) {
    const stmt = db.prepare('INSERT OR IGNORE INTO provinsi (kode, nama) VALUES (?, ?)');
    provinsi.forEach(prov => {
        stmt.run(prov.kode, prov.nama);
    });
    stmt.finalize();
}

function insertKabupatenKota(kabupaten) {
    const stmt = db.prepare('INSERT OR IGNORE INTO kabupaten_kota (kode, nama, kode_provinsi) VALUES (?, ?, ?)');
    kabupaten.forEach(kab => {
        stmt.run(kab.kode, kab.nama, kab.kode_provinsi);
    });
    stmt.finalize();
}

// Masukkan data
insertProvinsi(provinsiData);
insertKabupatenKota(kabupatenData);

// Tutup koneksi
db.close((err) => {
    if (err) {
        console.error('Error menutup database', err.message);
    }
    console.log('Inisialisasi database selesai.');
});
