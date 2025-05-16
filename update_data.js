require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fetchSekolahData(jenjang, provinsi, kabupaten, startPage = 1) {
    const baseUrl = 'https://api-sekolah-indonesia.vercel.app/sekolah';
    const sekolahList = [];
    let page = startPage;
    const limit = 1000; // Jumlah data per halaman

    while (true) {
        let url = `${baseUrl}/${jenjang}?provinsi=${provinsi}&page=${page}&perPage=1000`;
        
        if (kabupaten) {
            url += `&kab_kota=${kabupaten}`;
        }

        console.log(`Debug URL: ${url}`);

        try {
            const response = await axios.get(url);
            console.log('Debug Response Full:', response.data);
            
            const data = response.data.dataSekolah || [];
            const totalData = response.data.total_data || 0;
            
            console.log(`Halaman ${page}: ${data.length} sekolah`);
            console.log(`Total data: ${totalData}`);
            
            if (!data || data.length === 0) {
                console.log(`Tidak ada data lagi di halaman ${page}`);
                console.error(`Error: Tidak ada data untuk provinsi ${provinsi}, jenjang ${jenjang}`);
                break; // Keluar jika tidak ada data lagi
            }

            sekolahList.push(...data);
            page++;

            // Cek apakah sudah mengambil semua data
            if (sekolahList.length >= totalData) {
                console.log(`Sudah mengambil semua data: ${sekolahList.length}`);
                break;
            }

            // Tambahan pengecekan jika data kurang dari total data
            if (sekolahList.length >= totalData) {
                console.log(`Halaman terakhir: ${page - 1}`);
                break;
            }
        } catch (error) {
            console.error(`Error fetching ${jenjang} schools page ${page}:`, error.message, error.response ? error.response.data : 'No response data');
            break; // Keluar jika terjadi error
        }
    }

    console.log(`Total sekolah ${jenjang} di provinsi ${provinsi}: ${sekolahList.length}`);
    return sekolahList;
}

async function insertSekolah(sekolah) {
    // Validasi data sekolah
    // Gunakan nama dari field sekolah atau sesuai API
    const nama = sekolah.nama || sekolah.sekolah || 'Nama Tidak Diketahui';
    if (!nama.trim()) {
        console.warn('Skipping sekolah dengan nama kosong:', sekolah);
        return;
    }

    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO sekolah 
            (nama, npsn, status, jenjang, alamat, kode_provinsi, kode_kabupaten, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (npsn) DO UPDATE 
            SET 
                nama = COALESCE(EXCLUDED.nama, sekolah.nama),
                status = COALESCE(EXCLUDED.status, sekolah.status),
                alamat = COALESCE(EXCLUDED.alamat, sekolah.alamat),
                updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(query, [
            nama,
            sekolah.npsn || sekolah.id || '',
            sekolah.status || sekolah.bentuk || 'Tidak Diketahui',
            sekolah.jenjang || sekolah.bentuk || '',
            sekolah.alamat || sekolah.alamat_jalan || 'Alamat Tidak Diketahui',
            sekolah.kode_provinsi || sekolah.kode_prop?.trim() || '',
            sekolah.kode_kabupaten || sekolah.kode_kab_kota?.trim() || '',
            sekolah.latitude || sekolah.lintang || null,
            sekolah.longitude || sekolah.bujur || null
        ]);
    } catch (error) {
        console.error('Error inserting sekolah:', sekolah, error);
        throw error; // Re-throw untuk pelacakan error
    } finally {
        client.release();
    }
}

async function getProvinsiList(specificProvinsi = null) {
    const client = await pool.connect();
    try {
        let query = 'SELECT kode FROM provinsi ORDER BY kode';
        let params = [];
        if (specificProvinsi) {
            query = 'SELECT kode FROM provinsi WHERE kode = $1';
            params = [specificProvinsi];
        }
        const result = await client.query(query, params);
        return result.rows.map(row => row.kode);
    } catch (error) {
        console.error('Gagal mengambil daftar provinsi:', error);
        return [];
    } finally {
        client.release();
    }
}

async function updateSekolahData(specificProvinsi = null) {
    const jenjangs = ['sd', 'smp', 'sma', 'smk'];
    const updateSummary = {
        sd: { total: 0, provinsiUpdated: 0 },
        smp: { total: 0, provinsiUpdated: 0 },
        sma: { total: 0, provinsiUpdated: 0 },
        smk: { total: 0, provinsiUpdated: 0 }
    };
    let totalSchoolsUpdated = 0;
    const errors = [];

    try {
        const provinsiList = specificProvinsi ? [specificProvinsi] : await getProvinsiList();
        console.log(`Total provinsi yang akan diupdate: ${provinsiList.length}`);

        for (const jenjang of jenjangs) {
            console.log(`Memulai update data ${jenjang.toUpperCase()}`);
            for (const provinsi of provinsiList) {
                try {
                    console.log(`Fetching ${jenjang} schools in provinsi ${provinsi}`);
                    
                    if (!updateSummary[jenjang]) {
                        updateSummary[jenjang] = { total: 0, provinsiUpdated: 0 };
                    }

                    let page = 1;
                    const limit = 1000;
                    let hasMoreData = true;

                    while (hasMoreData) {
                        const sekolahList = await fetchSekolahData(jenjang, provinsi, null, page);
                        console.log(`Halaman ${page}: ${sekolahList.length} sekolah`);

                        if (sekolahList.length > 0) {
                            updateSummary[jenjang].provinsiUpdated++;

                            for (const sekolah of sekolahList) {
                                try {
                                    await insertSekolah({
                                        ...sekolah,
                                        jenjang: jenjang.toUpperCase(),
                                        kode_provinsi: provinsi,
                                        kode_kabupaten: sekolah.kode_kabupaten || ''
                                    });
                                    totalSchoolsUpdated++;
                                    updateSummary[jenjang].total++;
                                } catch (insertError) {
                                    console.error(`Error inserting ${sekolah.nama}:`, insertError);
                                    errors.push(`Error inserting ${sekolah.nama}: ${insertError.message}`);
                                }
                            }

                            // Lanjut ke halaman berikutnya jika data penuh
                            hasMoreData = sekolahList.length === limit;
                            page++;
                        } else {
                            hasMoreData = false;
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching schools for ${jenjang} in provinsi ${provinsi}:`, error);
                    errors.push(`Error fetching schools for provinsi ${provinsi}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in updateSekolahData:', error);
        errors.push(`Unexpected error: ${error.message}`);
    }
    
    console.log('Update Summary:', updateSummary);
    return { totalSchoolsUpdated, errors, updateSummary };
}

module.exports = { updateSekolahData };

// Uncomment baris di bawah ini jika ingin menjalankan update otomatis saat file dieksekusi
// updateSekolahData().catch(console.error);
