-- Seed data kabupaten/kota untuk Provinsi Bali (kode_provinsi: 160000)
INSERT INTO kabupaten_kota (kode, nama, kode_provinsi) VALUES
('160100','Kabupaten Badung','160000'),
('160200','Kabupaten Bangli','160000'),
('160300','Kabupaten Buleleng','160000'),
('160400','Kabupaten Gianyar','160000'),
('160500','Kabupaten Jembrana','160000'),
('160600','Kabupaten Karangasem','160000'),
('160700','Kabupaten Klungkung','160000'),
('160800','Kabupaten Tabanan','160000'),
('226000','Kota Denpasar','160000')
ON CONFLICT (kode) DO NOTHING;
