const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Test database connection
router.get('/test-db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now');
        client.release();
        res.json({
            success: true,
            message: 'Database connection successful',
            time: result.rows[0].now
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Test sekolah table
router.get('/test-sekolah', async (req, res) => {
    try {
        // Hitung total data
        const countResult = await pool.query('SELECT COUNT(*) as count FROM sekolah');
        
        // Ambil beberapa data contoh
        const sampleResult = await pool.query('SELECT * FROM sekolah LIMIT 5');
        
        // Dapatkan daftar provinsi unik
        const provinsiResult = await pool.query('SELECT DISTINCT nama_provinsi FROM sekolah ORDER BY nama_provinsi');
        
        // Hitung jumlah sekolah per provinsi
        const countByProvinsi = await pool.query(`
            SELECT nama_provinsi, COUNT(*) as jumlah 
            FROM sekolah 
            GROUP BY nama_provinsi 
            ORDER BY jumlah DESC
        `);
        
        res.json({
            success: true,
            total: parseInt(countResult.rows[0].count),
            sample: sampleResult.rows,
            provinsi: provinsiResult.rows.map(p => p.nama_provinsi).filter(Boolean),
            countByProvinsi: countByProvinsi.rows
        });
    } catch (error) {
        console.error('Error querying sekolah table:', error);
        res.status(500).json({
            success: false,
            message: 'Error querying sekolah table',
            error: error.message,
            query: error.query
        });
    }
});

// Database configuration
const pool = new Pool({
    user: process.env.USER, // Gunakan user system
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sekolah_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Get all schools with pagination and filters
// Get all schools with pagination, filter, or all data if all=true
router.get('/sekolah', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '',
            provinsi,
            kabupaten,
            jenjang,
            all
        } = req.query;

        let query = `
            SELECT 
                s.*,
                p.nama as nama_provinsi,
                k.nama as nama_kabupaten
            FROM sekolah s
            LEFT JOIN provinsi p ON s.kode_provinsi = p.kode
            LEFT JOIN kabupaten k ON s.kode_kabupaten = k.kode
            WHERE 1=1
        `;
        let queryParams = [];

        // Filter search
        if (search) {
            query += ` AND (s.nama_sekolah ILIKE $${queryParams.length + 1} OR s.alamat ILIKE $${queryParams.length + 1})`;
            queryParams.push(`%${search}%`);
        }
        if (provinsi) {
            query += ` AND s.kode_provinsi = $${queryParams.length + 1}`;
            queryParams.push(provinsi);
        }
        if (kabupaten) {
            query += ` AND s.kode_kabupaten = $${queryParams.length + 1}`;
            queryParams.push(kabupaten);
        }
        if (jenjang) {
            const jenjangUpper = jenjang.toUpperCase();
            if (["SD", "SMP", "SMA", "SMK"].includes(jenjangUpper)) {
                query += ` AND s.jenjang = $${queryParams.length + 1}`;
                queryParams.push(jenjangUpper);
            }
        }

        // Jika all=true, ambil semua data tanpa pagination
        if (all === 'true') {
            query += ' ORDER BY s.nama ASC';
            const result = await pool.query(query, queryParams);
            return res.json({ data: result.rows });
        }

        // Pagination default
        const offset = (page - 1) * limit;
        query += ` ORDER BY s.nama ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(parseInt(limit), parseInt(offset));
        const result = await pool.query(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM sekolah s
            WHERE 1=1
            ${search ? `AND (s.nama_sekolah ILIKE '%${search}%' OR s.alamat ILIKE '%${search}%')` : ''}
            ${provinsi ? `AND s.kode_provinsi = '${provinsi}'` : ''}
            ${kabupaten ? `AND s.kode_kabupaten = '${kabupaten}'` : ''}
            ${jenjang ? `AND s.jenjang = '${jenjang.toUpperCase()}'` : ''}
        `;
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].total);

        const response = {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        res.json(response);
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single school by ID
router.get('/sekolah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                s.*,
                p.nama as nama_provinsi,
                k.nama as nama_kabupaten
            FROM sekolah s
            LEFT JOIN provinsi p ON s.kode_provinsi = p.kode
            LEFT JOIN kabupaten k ON s.kode_kabupaten = k.kode
            WHERE s.id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sekolah tidak ditemukan' });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new school
router.post('/sekolah', async (req, res) => {
    try {
        const {
            nama_sekolah,
            npsn,
            jenjang,
            status,
            alamat,
            kode_provinsi,
            kode_kabupaten,
            kode_kecamatan,
            latitude,
            longitude,
            nilai
        } = req.body;
        
        // Validate required fields
        if (!nama_sekolah || !jenjang || !kode_provinsi) {
            return res.status(400).json({ 
                error: 'Nama sekolah, jenjang, dan provinsi harus diisi' 
            });
        }
        
        const query = `
            INSERT INTO sekolah (
                nama, npsn, jenjang, status, alamat,
                kode_provinsi, kode_kabupaten,
                latitude, longitude, nilai
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const values = [
            nama_sekolah,
            npsn || null,
            jenjang,
            status || 'Negeri',
            alamat || '',
            kode_provinsi,
            kode_kabupaten,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null,
            nilai ? parseFloat(nilai) : null
        ];
        
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Error creating school:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                error: 'NPSN sudah digunakan oleh sekolah lain' 
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a school
router.put('/sekolah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nama_sekolah,
            npsn,
            jenjang,
            status,
            alamat,
            kode_provinsi,
            kode_kabupaten,
            kode_kecamatan,
            latitude,
            longitude,
            nilai
        } = req.body;
        
        // Validate required fields
        if (!nama_sekolah || !jenjang || !kode_provinsi) {
            return res.status(400).json({ 
                error: 'Nama sekolah, jenjang, dan provinsi harus diisi' 
            });
        }
        
        const query = `
            UPDATE sekolah
            SET 
                nama = $1,
                npsn = $2,
                jenjang = $3,
                status = $4,
                alamat = $5,
                kode_provinsi = $6,
                kode_kabupaten = $7,
                latitude = $8,
                longitude = $9,
                nilai = $10,
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
        `;
        
        const values = [
            nama_sekolah,
            npsn || null,
            jenjang,
            status || 'Negeri',
            alamat || '',
            kode_provinsi,
            kode_kabupaten,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null,
            nilai ? parseFloat(nilai) : null,
            id
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sekolah tidak ditemukan' });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('Error updating school:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                error: 'NPSN sudah digunakan oleh sekolah lain' 
            });
        }
        
        if (error.column) {
            return res.status(400).json({
                error: `Error pada kolom: ${error.column}`,
                details: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Delete a school
router.delete('/sekolah/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM sekolah WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sekolah tidak ditemukan' });
        }
        
        res.json({ message: 'Sekolah berhasil dihapus' });
        
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all provinces
router.get('/provinces', async (req, res) => {
    try {
        const query = 'SELECT kode, nama FROM provinsi ORDER BY nama';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching provinces:', error);
        // Jika tabel provinsi tidak ada, kembalikan array kosong
        res.json([]);
    }
});

// Get regencies by province
router.get('/regencies/:provinceCode', async (req, res) => {
    try {
        const { provinceCode } = req.params;
        // Pastikan kode provinsi valid
        if (!/^\d{2}$/.test(provinceCode)) {
            return res.status(400).json({ error: 'Invalid province code format' });
        }
        
        const query = 'SELECT kode, nama FROM kabupaten WHERE kode LIKE $1 || '%' ORDER BY nama';
        const result = await pool.query(query, [provinceCode]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching regencies:', error);
        // Jika ada error, kembalikan array kosong
        res.json([]);
    }
});

// Get subdistricts by district
router.get('/subdistricts/:districtCode', async (req, res) => {
    try {
        const { districtCode } = req.params;
        const query = 'SELECT kode, nama FROM kecamatan WHERE kode_kabupaten = $1 ORDER BY nama';
        const result = await pool.query(query, [districtCode]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching subdistricts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
