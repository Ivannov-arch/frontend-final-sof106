# 🚢 Marine Navigation Assistant - Panduan Setup & Penggunaan (Frontend)

Selamat datang! Panduan ini dirancang khusus untuk membantu Anda yang **tidak memiliki latar belakang pemrograman (non-programmer)** untuk menjalankan dan menggunakan aplikasi web **Marine Navigation Assistant** di komputer lokal Anda.

---

## 📋 Daftar Isi
1. [Prasyarat: Apa yang Perlu Diinstal?](#1-prasyarat-apa-yang-perlu-diinstal)
2. [Langkah 1: Mengunduh & Memasang Node.js](#langkah-2-mengunduh--memasang-nodejs)
3. [Langkah 2: Menyiapkan File Konfigurasi (.env.local)](#langkah-3-menyiapkan-file-konfigurasi-envlocal)
4. [Langkah 3: Menginstal Paket Pendukung](#langkah-4-menginstal-paket-pendukung)
5. [Langkah 4: Menjalankan Aplikasi](#langkah-5-menjalankan-aplikasi)
6. [🗺️ Cara Penggunaan Fitur Utama](#-cara-penggunaan-fitur-utama)
7. [⚠️ Penyelesaian Masalah (Troubleshooting)](#%EF%B8%8F-penyelesaian-masalah-troubleshooting)

---

## 1. Prasyarat: Apa yang Perlu Diinstal?

Sebelum menjalankan aplikasi, pastikan komputer Anda memiliki:
* **Node.js** (Minimal versi 18.0 atau lebih baru) - Ini adalah motor utama yang menjalankan server frontend di komputer Anda.
* **Terminal / Command Prompt** - Aplikasi bawaan komputer untuk mengetik perintah ringkas.
  * Di **Windows**: Gunakan **Command Prompt (CMD)** atau **PowerShell**.
  * Di **macOS / Linux**: Gunakan **Terminal**.

---

## Langkah 1: Mengunduh & Memasang Node.js

Jika Anda belum menginstal Node.js pada komputer Anda, ikuti langkah berikut:

1. Buka browser (Chrome/Edge/Safari) dan kunjungi situs resmi: [https://nodejs.org/](https://nodejs.org/)
2. Unduh versi **LTS (Long Term Support)** yang direkomendasikan untuk sebagian besar pengguna karena paling stabil.
3. Buka file hasil unduhan tersebut dan ikuti petunjuk instalasi sampai selesai (klik *Next* / *Continue* / *Pasang* hingga selesai).
4. Untuk memastikan Node.js sudah terpasang dengan benar:
   * Buka **Command Prompt (Windows)** atau **Terminal (Mac)**.
   * Ketik perintah berikut lalu tekan **Enter**:
     ```bash
     node -v
     ```
   * Jika muncul angka versi (misalnya `v20.11.0`), berarti Node.js telah berhasil diinstal dan siap digunakan!

---

## Langkah 2: Menyiapkan File Konfigurasi (.env.local)

Aplikasi memerlukan beberapa kunci pengaturan (kredensial) agar dapat terhubung dengan database Supabase dan server kecerdasan buatan (FastAPI) di backend.

1. Buka folder **`frontend`** melalui File Explorer (Windows) atau Finder (Mac) Anda.
2. Cari file bernama **`.env.example`**.
3. **Salin (Copy)** file tersebut, lalu **Tempel (Paste)** di folder yang sama sehingga menghasilkan file duplikat.
4. Ubah nama file salinan tersebut menjadi **`.env.local`** (pastikan tanda titik di awal nama file tetap ada).
5. Buka file **`.env.local`** menggunakan aplikasi **Notepad**, **TextEdit**, atau editor teks lainnya, lalu sesuaikan isinya:

```env
# URL proyek Supabase Anda (bisa didapatkan di dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co

# Kunci API Anonim / Publishable Supabase Anda
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=kunci-anon-supabase-anda

# Alamat server backend Kecerdasan Buatan (FastAPI)
# Default-nya adalah http://127.0.0.1:8000 jika backend dijalankan di komputer lokal Anda
NEXT_PUBLIC_MARINE_API_URL=http://127.0.0.1:8000
```
6. Simpan file tersebut (**Ctrl + S** di Windows atau **Cmd + S** di Mac).

---

## Langkah 3: Menginstal Paket Pendukung

Langkah ini dilakukan untuk mengunduh modul-modul pustaka yang dibutuhkan aplikasi agar dapat berjalan dengan sempurna.

1. Buka **Command Prompt** (Windows) atau **Terminal** (Mac).
2. Arahkan ke folder `frontend` proyek ini.
   > 💡 **Tips Cepat untuk Windows**: Buka folder `frontend` di File Explorer, klik pada kolom alamat (Address Bar) di bagian atas, ketik `cmd`, lalu tekan **Enter**. Jendela Command Prompt akan langsung terbuka di folder yang tepat.
3. Ketik perintah berikut lalu tekan **Enter**:
   ```bash
   npm install
   ```
4. Tunggu hingga proses pengunduhan selesai (biasanya memakan waktu 1–3 menit tergantung kecepatan internet Anda). Proses ini akan membuat folder baru bernama `node_modules` di dalam direktori `frontend` Anda.

---

## Langkah 4: Menjalankan Aplikasi

Setelah semua persiapan selesai, Anda dapat langsung menyalakan server lokal aplikasi:

1. Di Command Prompt / Terminal yang sama, ketik perintah:
   ```bash
   npm run dev
   ```
2. Jika berhasil, Anda akan melihat teks berwarna hijau/putih seperti ini:
   ```text
   ▲ Next.js 15.3.1
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.10:3000
   ```
3. Buka browser Anda (Google Chrome, Microsoft Edge, Safari, dll.), lalu ketik alamat berikut di kolom pencarian:
   👉 **[http://localhost:3000](http://localhost:3000)**
4. Selamat! Aplikasi **Marine Navigation Assistant** sudah berjalan di komputer lokal Anda dan siap digunakan.

---

## 🗺️ Cara Penggunaan Fitur Utama

Setelah halaman aplikasi web terbuka di browser Anda, berikut adalah panduan penggunaannya:

### 1. Navigasi Halaman Utama (Homepage)
* Halaman ini menampilkan informasi ringkas mengenai kapabilitas sistem.
* Terdapat tombol pintas **💬 Open Chatbot** dan **📡 Track a Ship** untuk berpindah fitur secara instan.

### 2. Pelacakan Kapal & Analisis Rute (`/track-ship`)
Halaman ini dapat diakses langsung tanpa perlu mendaftar/login:
* **Interactive AIS Map (Peta Interaktif)**: Menampilkan rute kapal di peta laut.
  * Anda dapat berpindah tab antara **Standard Route** (rute pelayaran standar) dan **Massive Route (Density)** (visualisasi kepadatan lalu lintas jalur laut) melalui tombol pilihan di atas peta.
* **Marine AI Chatbot (Panel Obrolan Kanan)**: Asisten cerdas bertenaga AI untuk berinteraksi langsung. Anda dapat:
  * Menggunakan tombol pintasan cepat seperti **Find Route** atau **AIS Info** di atas kolom input teks untuk mengirim perintah otomatis.
  * Mengetik pertanyaan/perintah kustom di kolom input di bagian bawah (contoh: `"Tampilkan rute dari Jakarta ke Singapura"` atau `"Jelaskan kualitas data AIS rute ini"`).
  * AI akan memproses perintah dan memperbarui peta di sebelah kiri secara dinamis berdasarkan rute laut yang disarankan!
* **Status Dashboard (Bagian Bawah)**: Menampilkan ringkasan status pelayaran, pelabuhan keberangkatan, pelabuhan tujuan, jumlah koordinat yang dilacak, dan status saat ini (misalnya: *Completed*).

### 3. Halaman Terproteksi (`/protected`)
* Halaman khusus yang memerlukan pendaftaran/login akun Supabase terlebih dahulu.
* Menampilkan informasi kredensial akun pengguna yang sedang aktif/login.

---

## ⚠️ Penyelesaian Masalah (Troubleshooting)

Berikut beberapa kendala yang mungkin Anda temui beserta solusinya:

| Gejala/Masalah | Penyebab Utama | Solusi |
| :--- | :--- | :--- |
| **Peta tidak muncul / Asisten AI membalas dengan pesan error koneksi** | Server backend FastAPI belum dijalankan. | Pastikan aplikasi backend di folder `/ml` sudah berjalan di alamat `http://127.0.0.1:8000`. Jika backend berjalan di alamat/port berbeda, sesuaikan nilai `NEXT_PUBLIC_MARINE_API_URL` di file `.env.local` Anda. |
| **Error: "sh: next: command not found" saat menjalankan npm run dev** | Folder pustaka pendukung belum terinstal atau corrupt. | Jalankan kembali perintah `npm install` di terminal Anda dan pastikan koneksi internet stabil sampai selesai. |
| **Halaman `/protected` mengarah ke halaman login** | Anda belum terdaftar / belum masuk. | Silakan buat akun baru atau masuk menggunakan fitur autentikasi (Sign Up/Sign In) yang telah disediakan di halaman login aplikasi. |
| **Aplikasi tidak bisa diakses di browser dengan alamat localhost:3000** | Port `3000` sedang digunakan oleh program lain di komputer Anda. | Next.js akan mendeteksi ini dan otomatis memindahkan port (misalnya ke `http://localhost:3001`). Cek terminal Anda dan buka alamat localhost dengan nomor port baru yang tertera di sana. |

---

🚢 **Marine Route Optimizer — Project SOF106**
