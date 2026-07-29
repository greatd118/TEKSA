# TEKSA — Website Kelas X TKJ 1

Situs resmi kelas **X TKJ 1 (TEKSA)**, SMKN 1 Tanjunganom — Tahun Pelajaran 2026/2027.

Dibangun dengan **pure HTML, CSS, dan JavaScript** (tanpa framework/bundler), plus **Firebase Firestore** untuk sistem akun siswa.

## Struktur Proyek

```
frontend/
├── index.html          Halaman utama
├── profil.html          Profil & visi-misi kelas
├── struktur.html         Struktur organisasi (terhubung ke akun.html)
├── anggota.html          Daftar siswa + pencarian
├── jadwal.html           Jadwal pelajaran mingguan
├── galeri.html           Galeri kegiatan + lightbox
├── akun.html             Daftar/masuk akun siswa, edit profil
├── kontak.html           Kontak & media sosial
├── 404.html              Halaman error kustom
├── vercel.json           Konfigurasi deploy Vercel
├── css/                  Stylesheet per halaman
├── js/                   Script per halaman + config Firebase
└── assets/               Logo & aset gambar
```

## Menjalankan secara lokal

Karena tidak ada proses build, cukup jalankan server statis sederhana dari dalam folder ini, misalnya:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Sistem Akun

Website ini **tidak** menggunakan Firebase Authentication, melainkan sistem akun kustom:

- **Project Firebase "Profil"** — menyimpan data publik (nama, foto, bio, jabatan)
- **Project Firebase "Pass"** — menyimpan kredensial (sandi ter-hash SHA-256, kode unik, device ID)

Konfigurasi kedua project ada di `js/firebase-config.js`.

> **Catatan keamanan:** Firebase `apiKey` di client-side memang publik by design — proteksi utama ada di Firestore Security Rules dan pembatasan domain (API key restriction) di Google Cloud Console. Pastikan sudah membatasi API key hanya untuk domain deploy resmi sebelum publish.

## Struktur Organisasi Otomatis

Jabatan (`ketua_kelas`, `wakil_ketua`, `sekertaris`, `bendahara`) diklaim siswa lewat halaman **Akun**, lalu otomatis tampil di halaman **Struktur**. Setiap jabatan hanya bisa diklaim oleh satu siswa.

## Deploy ke Vercel

1. Push isi folder ini ke repo GitHub
2. Import repo di [vercel.com/new](https://vercel.com/new)
3. Root Directory: `./`
4. Framework Preset: **Other**
5. Deploy

Setelah live, atur **API key restriction** Firebase agar hanya domain Vercel yang bisa memanggil API key ini.

## Data yang Masih Placeholder

Beberapa data masih pakai tag placeholder, silakan cari-ganti manual di file terkait begitu data asli tersedia:

- `<wali_kelas>` — di `profil.html` dan `struktur.html`
- `<anggota_1>` s.d. `<anggota_36>` — di `js/anggota.js`
- `<creator>` — di footer semua halaman HTML (nama pembuat website, diisi sekali saja)
- Foto galeri — di `js/galeri.js`

---

Made with 💚 oleh siswa X TKJ 1 — TEKSA.
