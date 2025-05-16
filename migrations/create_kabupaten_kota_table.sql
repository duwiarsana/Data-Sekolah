-- Migration: Membuat tabel kabupaten_kota
CREATE TABLE IF NOT EXISTS kabupaten_kota (
    kode VARCHAR PRIMARY KEY,
    nama VARCHAR NOT NULL,
    kode_provinsi VARCHAR NOT NULL
);

-- Contoh data seed (Jakarta)
INSERT INTO kabupaten_kota (kode, nama, kode_provinsi) VALUES
('100100', 'Kota Jakarta Selatan', '100000'),
('100200', 'Kota Jakarta Timur', '100000'),
('100300', 'Kota Jakarta Pusat', '100000'),
('100400', 'Kota Jakarta Barat', '100000'),
('100500', 'Kota Jakarta Utara', '100000'),
('100600', 'Kepulauan Seribu', '100000')
ON CONFLICT (kode) DO NOTHING;

-- Tambahkan seed untuk provinsi lain sesuai kebutuhan
