# Data Sekolah Indonesia Web Map

## Cara Grab Data Sekolah dari API (by @wanrabbae)

Aplikasi ini menggunakan API gratis Data Sekolah Seluruh Indonesia dari:

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

### Contoh response:
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
