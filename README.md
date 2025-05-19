# Data Sekolah Indonesia Web Map

## Deskripsi Proyek

Aplikasi Data Sekolah Indonesia adalah sistem informasi geografis berbasis web yang menampilkan dan mengelola data sekolah di seluruh Indonesia. Aplikasi ini memungkinkan pengguna untuk melihat persebaran sekolah pada peta, melakukan pencarian berdasarkan berbagai kriteria, dan mengelola data sekolah melalui panel admin.

## Fitur Utama

### Dashboard Peta (Map View)

![Dashboard Peta](./screen-shot/Screenshot%202025-05-19%20at%204.50.30%20PM.png)

Dashboard peta menampilkan persebaran sekolah di seluruh Indonesia dengan fitur:
- Visualisasi sekolah dengan marker berwarna berdasarkan nilai sekolah
- Filter berdasarkan provinsi dan jenjang pendidikan
- Informasi detail sekolah saat marker diklik
- Legenda warna untuk memahami klasifikasi nilai sekolah
- Tampilan responsif untuk berbagai ukuran layar

#### Sistem Warna Marker Berdasarkan Nilai

Setiap sekolah ditampilkan dengan marker berwarna yang menunjukkan nilai kualitasnya (skala 0-10):

- **Hijau** (8-10): Sekolah dengan nilai tinggi/sangat baik
- **Kuning-Hijau** (6-8): Sekolah dengan nilai baik
- **Kuning** (5-6): Sekolah dengan nilai sedang
- **Oranye** (3-5): Sekolah dengan nilai cukup
- **Merah** (0-3): Sekolah dengan nilai rendah

Sistem warna ini menggunakan gradasi dari merah ke hijau, di mana:
- Nilai 0 ditampilkan sebagai warna hitam
- Nilai 1-5 ditampilkan sebagai gradasi dari hitam ke merah
- Nilai 5-10 ditampilkan sebagai gradasi dari merah ke hijau

### Panel Admin

![Panel Admin](./screen-shot/Screenshot%202025-05-19%20at%204.51.09%20PM.png)

Panel admin menyediakan antarmuka untuk mengelola data sekolah dengan fitur:
- Tabel data sekolah dengan pagination
- Pencarian dan filter data sekolah
- Form untuk menambah dan mengedit data sekolah
- Validasi input untuk memastikan data yang dimasukkan valid
- Konfirmasi sebelum menghapus data

## Teknologi yang Digunakan

### Frontend
- **HTML5, CSS3, JavaScript** - Bahasa dasar pemrograman web
- **Tailwind CSS** - Framework CSS untuk styling yang modern dan responsif
- **Leaflet.js** - Library JavaScript untuk menampilkan peta interaktif
- **Font Awesome** - Icon library untuk antarmuka yang lebih intuitif

### Backend
- **Node.js** - Runtime JavaScript untuk server
- **Express.js** - Framework web untuk Node.js
- **PostgreSQL** - Database relasional untuk menyimpan data sekolah
- **pg** - PostgreSQL client untuk Node.js

## Struktur Database

Database aplikasi ini menggunakan PostgreSQL dengan tabel utama:

### Tabel `sekolah`
- `id` - Primary key
- `nama` - Nama sekolah
- `npsn` - Nomor Pokok Sekolah Nasional (opsional)
- `jenjang` - Jenjang pendidikan (SD, SMP, SMA, SMK)
- `status` - Status sekolah (Negeri/Swasta)
- `alamat` - Alamat lengkap sekolah
- `kode_provinsi` - Kode provinsi
- `kode_kabupaten` - Kode kabupaten/kota
- `kode_kecamatan` - Kode kecamatan (opsional)
- `latitude` - Koordinat latitude
- `longitude` - Koordinat longitude
- `nilai` - Nilai sekolah (0-10)
- `created_at` - Timestamp pembuatan data
- `updated_at` - Timestamp pembaruan data

### Tabel `provinsi`
- `kode` - Kode provinsi (primary key)
- `nama` - Nama provinsi

### Tabel `kabupaten`
- `kode` - Kode kabupaten (primary key)
- `kode_provinsi` - Foreign key ke tabel provinsi
- `nama` - Nama kabupaten/kota

## Cara Instalasi

### Prasyarat
- Node.js (versi 14 atau lebih baru)
- PostgreSQL (versi 12 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/yourusername/Data-Sekolah.git
   cd Data-Sekolah
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Buat database PostgreSQL:
   ```bash
   createdb data_sekolah
   ```

4. Buat file `.env` dengan konfigurasi database:
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=data_sekolah
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=3000
   ```

5. Jalankan migrasi database (jika ada):
   ```bash
   npm run migrate
   ```

6. Jalankan aplikasi:
   ```bash
   npm start
   ```

7. Buka aplikasi di browser:
   ```
   http://localhost:3000
   ```

## API Data Sekolah

Aplikasi ini menggunakan API Data Sekolah Seluruh Indonesia sebagai referensi (by @wanrabbae):

**BASE URL:**
```
https://api-sekolah-indonesia.vercel.app
```

### Menampilkan seluruh data sekolah (pagination):
```
/sekolah?page=1&perPage=20
```
- `page` dan `perPage` berupa integer.
- Ubah `page` untuk mengambil halaman berikutnya.

### Menampilkan data sekolah berdasarkan jenjang:
```
/sekolah/SMK?page=1&perPage=20
```
- Jenjang: SD, SMP, SMA, SMK

### Search data sekolah berdasarkan nama sekolah:
```
/sekolah/s?sekolah=NAMA_SEKOLAH
```
Contoh:
```
/sekolah/s?sekolah=smks informatika
```

### Filter berdasarkan kode provinsi/kabupaten/kecamatan:
- By provinsi:
  - `/sekolah?provinsi=071700&page=1&perPage=20`
  - `/sekolah/smp?provinsi=071700&page=1&perPage=20`
- By kabupaten/kota:
  - `/sekolah?kab_kota=071700&page=1&perPage=20`
  - `/sekolah/sd?kab_kota=071700&page=1&perPage=20`
- By kecamatan:
  - `/sekolah?kec=071700&page=1&perPage=20`
  - `/sekolah/smk?kec=071700&page=1&perPage=20`

### Filter berdasarkan NPSN:
```
/sekolah?npsn=20106342
```

## Kontribusi

Kontribusi untuk pengembangan aplikasi ini sangat diterima. Silakan fork repositori ini, buat branch fitur baru, dan ajukan pull request.

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
```json
[
  {
    "kode_prop": "010000 ",
    "propinsi": "Prov. D.K.I. Jakarta",
    "kode_kab_kota": "010100 ",
    "kabupaten_kota": "Kab. Kepulauan Seribu",
    "kode_kec": "010101 ",
    "kecamatan": "Kec. Kepulauan Seribu Selatan",
    "id": "40C6E595-2BF5-E011-B2F2-796762867641",
    "npsn": "20106343",
    "sekolah": "SMP NEGERI 241",
    "bentuk": "SMP",
    "status": "N",
    "alamat_jalan": "Jl. Pendidikan",
    "lintang": "-5.7985000",
    "bujur": "106.5003000"
  }
]
```

### Catatan Penting:
- Gunakan API ini dengan bijak dan benar.
- Jika ada kendala atau saran, hubungi: alwanrabbae@gmail.com atau lewat issues di repo aslinya: https://github.com/wanrabbae/api-sekolah-indonesia

---

## Cara Menampilkan Data di Peta

1. Buka aplikasi web.
2. Centang checkbox "Seluruh data sekolah" di sidebar kiri.
3. Marker sekolah akan muncul pada peta berdasarkan data dari API.

Jika ingin mengambil seluruh data, ulangi request dengan parameter `page` yang berbeda hingga data yang diterima kosong.
