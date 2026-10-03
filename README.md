# Multi-Tenant IoT Device Management Platform 🏢💡

[🇹🇷 Türkçe Sürüm İçin Aşağı Kaydırın / Scroll down for Turkish Version](#türkçe-sürüm-tr)

An advanced, production-ready full-stack IoT platform designed to manage and synchronize physical hardware (such as architectural models, smart buildings, or LED matrices) with a centralized cloud dashboard.

This project demonstrates a scalable **Multi-Tenant Architecture** where a single server handles multiple independent projects, floors, units, and IoT devices simultaneously.

## 🚀 Features

* **Multi-Tenant Architecture:** Manage dozens of different projects (buildings/models) from a single unified Admin Dashboard.
* **Hardware Synchronization:** ESP32 microcontrollers securely sync with the backend using their unique MAC addresses.
* **Dynamic Calibration Mode:** Map physical hardware LEDs to virtual units via the web interface. No need to hardcode LED indices in C++!
* **Robust Security:** JWT-based Authentication, `pbkdf2_sha256` password hashing, and SlowAPI rate-limiting against brute-force attacks.
* **Single-Command Execution:** The React frontend is statically bundled into the FastAPI backend. Run the entire full-stack application with one Python command!
* **Hardware Simulator Support:** Includes modified firmware to test the system directly in the browser via Wokwi without needing physical components.

## 🛠️ Technology Stack
* **Backend:** FastAPI (Python), SQLite (SQLAlchemy ORM), JWT, SlowAPI
* **Frontend:** React.js, Vite, TailwindCSS
* **Hardware:** ESP32, C++ (Arduino), FastLED / Adafruit_NeoPixel, WiFiManager

## 🎥 Live Hardware Simulation (Demo)
*(Upload your video to GitHub and paste the link here. To do this, simply drag and drop your `.mp4` video into the GitHub Web Editor, and it will generate the link automatically.)*

---

# <a id="türkçe-sürüm-tr"></a> Çoklu Müşterili (Multi-Tenant) IoT Cihaz Yönetim Platformu 🏢💡

Fiziksel donanımları (mimari maketler, akıllı binalar veya LED matrisler) merkezi bir bulut paneliyle yönetmek ve senkronize etmek için tasarlanmış, üretime hazır (production-ready) full-stack IoT platformu.

Bu proje, tek bir sunucunun aynı anda birden fazla bağımsız projeyi, katı, daireyi ve IoT cihazını yönetebildiği ölçeklenebilir bir **Multi-Tenant (Çoklu Müşteri) Mimarisi** sunmaktadır.

## 🚀 Özellikler

* **Multi-Tenant Mimari:** Tek bir merkezi Admin Panelinden onlarca farklı projeyi (bina/maket) bağımsız olarak yönetin.
* **Donanım Senkronizasyonu:** ESP32 mikrodenetleyiciler, benzersiz MAC adreslerini kullanarak arka uçla (backend) güvenli bir şekilde haberleşir.
* **Dinamik Kalibrasyon Modu:** Fiziksel donanımdaki LED'leri web arayüzü üzerinden sanal dairelerle eşleştirin. C++ koduna indeks yazmaya gerek yok!
* **Yüksek Güvenlik:** JWT tabanlı Kimlik Doğrulama, `pbkdf2_sha256` şifreleme ve kaba kuvvet (brute-force) saldırılarına karşı SlowAPI hız sınırlaması.
* **Tek Komutla Çalıştırma:** React arayüzü, FastAPI arka ucuna statik olarak gömülmüştür. Tüm full-stack uygulamayı tek bir Python komutuyla çalıştırın!
* **Donanım Simülatörü Desteği:** Fiziksel parçalara ihtiyaç duymadan sistemi Wokwi üzerinden tarayıcıda test etmek için özel simülatör kodu içerir.

## 🛠️ Kullanılan Teknolojiler
* **Arka Uç (Backend):** FastAPI (Python), SQLite (SQLAlchemy ORM), JWT, SlowAPI
* **Ön Yüz (Frontend):** React.js, Vite, TailwindCSS
* **Donanım (Hardware):** ESP32, C++ (Arduino), FastLED / Adafruit_NeoPixel, WiFiManager

## 🎥 Canlı Donanım Simülasyonu (Demo)
*(Videonuzu GitHub'a yükleyip linkini buraya yapıştırın. GitHub web sitesinde projeyi düzenlerken videoyu sürükleyip bırakmanız yeterlidir, link otomatik oluşur.)*

## 📁 Proje Yapısı (Directory Structure)
- `/backend`: FastAPI sunucusu, veritabanı modelleri ve statik frontend dosyaları.
- `/frontend`: React & TailwindCSS kaynak kodları.
- `/hardware/production_firmware`: Gerçek saha kurulumları için WiFiManager entegreli ESP32 C++ kodu.
- `/hardware/simulator_firmware`: Wokwi simülatörü için optimize edilmiş ESP32 C++ test kodu.

---
© 2026 Developed by Furkan
