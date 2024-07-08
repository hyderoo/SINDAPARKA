-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 08 Jan 2024 pada 10.49
-- Versi server: 10.4.18-MariaDB
-- Versi PHP: 7.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `diagnosastunting`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbl_diagnosis`
--

CREATE TABLE `tbl_diagnosis` (
  `id_diagnosis` int(11) NOT NULL,
  `tanggal_diagnosis` date NOT NULL,
  `nama_balita` varchar(100) NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `usia` int(11) NOT NULL,
  `bb` decimal(5,2) NOT NULL,
  `tb` decimal(5,2) NOT NULL,
  `imt` decimal(5,2) NOT NULL,
  `status_gizi` enum('Gizi Buruk','Gizi Kurang','Gizi Baik','Berisiko Gizi Lebih','Gizi Lebih','Obesitas') NOT NULL,
  `hasil_diagnosis` enum('Stunting Berat','Stunting Ringan','Tidak Stunting') NOT NULL,
  `id_pengguna` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbl_kontak`
--

CREATE TABLE `tbl_kontak` (
  `id_kontak` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `no_telepon` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `tbl_kontak`
--

INSERT INTO `tbl_kontak` (`id_kontak`, `email`, `no_telepon`) VALUES
(1, 'stuntassistxxx@gmail.com', '081234567890');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tbl_pengguna`
--

CREATE TABLE `tbl_pengguna` (
  `id_pengguna` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `status_pengguna` enum('admin','user') NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `no_telepon` varchar(20) DEFAULT NULL,
  `kata_sandi` varchar(255) NOT NULL,
  `reset_token` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data untuk tabel `tbl_pengguna`
--

INSERT INTO `tbl_pengguna` (`id_pengguna`, `nama`, `jenis_kelamin`, `status_pengguna`, `email`, `no_telepon`, `kata_sandi`, `reset_token`) VALUES
(1, 'Ali Mochtar', 'L', 'admin', 'admin@admin.com', '08179851011', '8efd83f24f6ff553d7ed6679375aebab367c4917c8372cf33f081df39e9b113f', '');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `tbl_diagnosis`
--
ALTER TABLE `tbl_diagnosis`
  ADD PRIMARY KEY (`id_diagnosis`),
  ADD KEY `id_pengguna` (`id_pengguna`);

--
-- Indeks untuk tabel `tbl_kontak`
--
ALTER TABLE `tbl_kontak`
  ADD PRIMARY KEY (`id_kontak`);

--
-- Indeks untuk tabel `tbl_pengguna`
--
ALTER TABLE `tbl_pengguna`
  ADD PRIMARY KEY (`id_pengguna`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `no_telepon` (`no_telepon`);
ALTER TABLE `tbl_pengguna` ADD FULLTEXT KEY `email_2` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `tbl_diagnosis`
--
ALTER TABLE `tbl_diagnosis`
  MODIFY `id_diagnosis` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `tbl_kontak`
--
ALTER TABLE `tbl_kontak`
  MODIFY `id_kontak` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `tbl_pengguna`
--
ALTER TABLE `tbl_pengguna`
  MODIFY `id_pengguna` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `tbl_diagnosis`
--
ALTER TABLE `tbl_diagnosis`
  ADD CONSTRAINT `tbl_diagnosis_ibfk_1` FOREIGN KEY (`id_pengguna`) REFERENCES `tbl_pengguna` (`id_pengguna`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
