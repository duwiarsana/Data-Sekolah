CREATE TABLE sekolah (
    id SERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    npsn TEXT UNIQUE,
    status TEXT,
    jenjang TEXT,
    alamat TEXT,
    kode_provinsi TEXT,
    kode_kabupaten TEXT,
    latitude FLOAT,
    longitude FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
