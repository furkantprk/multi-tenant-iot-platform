# Multi-Tenant IoT - Hardware Firmware

Bu klasör, fiziksel maketlerdeki ESP32 mikrodenetleyicileri için yazılmış C++ (Arduino) kodlarını barındırır.

İki farklı versiyon bulunmaktadır:

## 1. Orijinal Canlı Kod (`production_firmware`)
- Gerçek sahada, müşteriye satılan ürünlerin içine yüklenecek olan asıl koddur.
- **WiFiManager** kütüphanesini kullanır. Yani müşteri cihazı fişe taktığında ESP32 bir Wi-Fi ağı yayar ("Maket-Kurulum"). Müşteri bu ağa bağlanıp kendi ev/ofis Wi-Fi şifresini cihaza girer.
- 74AHCT125 logic level converter ile sürülmek üzere tasarlanmıştır.
- Her cihaz kendi MAC adresini sunucuya göndererek yetkilendirme (Authentication) yapar.

## 2. Simülatör Kodu (`simulator_firmware`)
- Donanım elinizde olmadığında, [Wokwi.com](https://wokwi.com) üzerinden tarayıcıda sanal ESP32 çalıştırmak için modifiye edilmiş test kodudur.
- Simülatör ortamı Captive Portal (otomatik ağ seçme ekranı) desteklemediği için `WiFiManager` kütüphanesi iptal edilmiş, yerine Wokwi'nin kendi sanal internet ağı olan `Wokwi-GUEST` doğrudan koda (hardcode) yazılmıştır.
- GitHub projenizi test etmek veya tanıtım/portföy videosu çekmek için bu kodu kullanabilirsiniz.
