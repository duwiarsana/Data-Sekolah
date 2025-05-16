CREATE TABLE provinsi (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL
);

-- Masukkan data provinsi
INSERT INTO provinsi (kode, nama) VALUES 
('010000', 'Prov. D.K.I. Jakarta'),
('020000', 'Prov. Jawa Barat'),
('030000', 'Prov. Jawa Tengah'),
('040000', 'Prov. D.I. Yogyakarta'),
('050000', 'Prov. Jawa Timur'),
('060000', 'Prov. Aceh'),
('070000', 'Prov. Sumatera Utara'),
('080000', 'Prov. Sumatera Barat'),
('090000', 'Prov. Riau'),
('100000', 'Prov. Jambi'),
('110000', 'Prov. Sumatera Selatan'),
('120000', 'Prov. Bengkulu'),
('130000', 'Prov. Lampung'),
('220000', 'Prov. Bali');
