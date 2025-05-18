require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Konfigurasi koneksi database PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Fungsi query database
async function queryDatabase(query, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        return result.rows;
    } catch (err) {
        console.error('Error query database:', err);
        throw err;
    } finally {
        client.release();
    }
}

// API untuk mendapatkan semua provinsi
app.get('/api/provinsi', async (req, res) => {
    try {
        const rows = await queryDatabase('SELECT * FROM provinsi');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API untuk mendapatkan kabupaten/kota berdasarkan provinsi
app.get('/api/kabupaten', async (req, res) => {
    const { provinsi } = req.query;
    if (!provinsi) {
        // Selalu balas array kosong jika tidak ada provinsi
        return res.status(400).json([]);
    }
    try {
        const rows = await queryDatabase('SELECT * FROM kabupaten_kota WHERE kode_provinsi = $1', [provinsi]);
        // Pastikan selalu array
        res.json(Array.isArray(rows) ? rows : []);
    } catch (err) {
        // Jika error, tetap balas array kosong
        res.status(500).json([]);
    }
});

// Daftar provinsi untuk update berurutan
const PROVINSI_UPDATE_SEQUENCE = [
    '010000', // Aceh
    '020000', // Sumatera Utara
    '030000', // Sumatera Barat
    '040000', // Riau
    '050000', // Jambi
    '060000', // Sumatera Selatan
    '070000', // Bengkulu
    '080000', // Lampung
    '090000', // Kepulauan Riau
    '100000', // DKI Jakarta
    '110000', // Jawa Barat
    '120000', // Jawa Tengah
    '130000', // DI Yogyakarta
    '140000', // Jawa Timur
    '150000', // Banten
    '160000', // Bali
    '170000', // Nusa Tenggara Barat
    '180000', // Nusa Tenggara Timur
    '190000', // Kalimantan Barat
    '200000', // Kalimantan Tengah
    '210000', // Kalimantan Selatan
    '220000', // Kalimantan Timur
    '226000', // Kota Denpasar
    '230000', // Kalimantan Utara
    '240000', // Sulawesi Utara
    '250000', // Sulawesi Tengah
    '260000', // Sulawesi Selatan
    '270000', // Sulawesi Tenggara
    '280000', // Gorontalo
    '290000', // Sulawesi Barat
    '300000', // Maluku
    '310000', // Maluku Utara
    '320000', // Papua Barat
    '330000', // Papua
];

// Endpoint untuk memulai update data sekolah secara berurutan
app.post('/api/update-data', async (req, res) => {
    const { spawn } = require('child_process');
    
    async function updateProvinsiSequence(provinsiList) {
        if (provinsiList.length === 0) {
            return { success: true, message: 'Semua provinsi telah diupdate' };
        }

        const currentProvinsi = provinsiList[0];

        return new Promise((resolve, reject) => {
            console.log(`Memulai update data untuk provinsi ${currentProvinsi}`);
            const updateProcess = spawn('node', [
                '-e', 
                `require('./update_data.js').updateSekolahData('${currentProvinsi}').catch(console.error)`
            ], { stdio: 'pipe' });

            let updateOutput = '';
            let updateErrors = '';

            updateProcess.stdout.on('data', (data) => {
                updateOutput += data.toString();
                console.log(data.toString());
            });

            updateProcess.stderr.on('data', (data) => {
                updateErrors += data.toString();
                console.error(data.toString());
            });

            updateProcess.on('close', async (code) => {
                if (code === 0) {
                    console.log(`Berhasil update provinsi ${currentProvinsi}`);
                    const nextResult = await updateProvinsiSequence(provinsiList.slice(1));
                    resolve(nextResult);
                } else {
                    console.error(`Gagal update provinsi ${currentProvinsi}`);
                    reject({
                        success: false,
                        message: `Gagal update provinsi ${currentProvinsi}`,
                        errors: updateErrors
                    });
                }
            });
        });
    }

    try {
        const result = await updateProvinsiSequence(PROVINSI_UPDATE_SEQUENCE);
        res.json(result);
    } catch (error) {
        console.error('Error update data:', error);
        res.status(500).json(error);
    }
});

// Endpoint untuk mendapatkan data sekolah
app.get('/api/sekolah', async (req, res) => {
    try {
        const { jenjang, provinsi, kabupaten } = req.query;
        let query = 'SELECT * FROM sekolah WHERE 1=1';
        const params = [];
        
        if (jenjang) {
            query += ' AND jenjang = ANY($1)';
            params.push(jenjang.split(','));
        }
        
        if (provinsi) {
            query += ' AND kode_provinsi = $' + (params.length + 1);
            params.push(provinsi);
        }
        
        if (kabupaten) {
            query += ' AND kode_kabupaten = $' + (params.length + 1);
            params.push(kabupaten);
        }
        
        query += ' ORDER BY nama';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sekolah:', err);
        res.status(500).json({ error: 'Error fetching sekolah data' });
    }
});

// Endpoint untuk menampilkan satu data sekolah secara acak
app.get('/api/sekolah/random', async (req, res) => {
    try {
        const result = await queryDatabase('SELECT * FROM sekolah ORDER BY RANDOM() LIMIT 1');
        res.json(result[0] || { message: 'Tidak ada data sekolah' });
    } catch (error) {
        console.error('Error fetching random sekolah:', error);
        res.status(500).json({ error: 'Gagal mengambil data sekolah' });
    }
});

// Serve static files dari direktori proyek
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
