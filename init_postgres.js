require('dotenv').config();
const { Pool } = require('pg');

// Konfigurasi koneksi database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Fungsi untuk menjalankan query
async function runQuery(query, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        console.log('Query berhasil:', query);
        return result;
    } catch (err) {
        console.error('Error menjalankan query:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Fungsi inisialisasi database
async function initDatabase() {
    try {
        // Hapus tabel jika sudah ada
        await runQuery('DROP TABLE IF EXISTS kabupaten_kota');
        await runQuery('DROP TABLE IF EXISTS provinsi');

        // Buat tabel provinsi
        await runQuery(`
            CREATE TABLE provinsi (
                kode TEXT PRIMARY KEY,
                nama TEXT NOT NULL
            )
        `);

        // Buat tabel kabupaten/kota
        await runQuery(`
            CREATE TABLE kabupaten_kota (
                kode TEXT PRIMARY KEY,
                nama TEXT NOT NULL,
                kode_provinsi TEXT REFERENCES provinsi(kode)
            )
        `);

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

        // Insert data provinsi
        for (const prov of provinsiData) {
            await runQuery(
                'INSERT INTO provinsi (kode, nama) VALUES ($1, $2)', 
                [prov.kode, prov.nama]
            );
        }

        // Insert data kabupaten/kota
        for (const kab of kabupatenData) {
            await runQuery(
                'INSERT INTO kabupaten_kota (kode, nama, kode_provinsi) VALUES ($1, $2, $3)', 
                [kab.kode, kab.nama, kab.kode_provinsi]
            );
        }

        console.log('Inisialisasi database selesai.');
    } catch (err) {
        console.error('Gagal menginisialisasi database:', err);
        console.error('Pastikan Docker PostgreSQL sudah berjalan');
        console.error('Jalankan: docker-compose up -d');
    } finally {
        // Tutup koneksi pool
        await pool.end();
    }
}

// Jalankan inisialisasi
initDatabase();
