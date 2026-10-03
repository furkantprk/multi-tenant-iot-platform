#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <FastLED.h>
#include <ArduinoJson.h>
#include <WiFiManager.h> // Müşterinin Wi-Fi girmesi için Captive Portal kütüphanesi (tzapu)

// --- DONANIM AYARLARI ---
#define DATA_PIN 2        
#define MAX_LEDS 390      
CRGB leds[MAX_LEDS];

// --- AĞ VE BULUT (CLOUD) AYARLARI ---
// Proje canlıya (production) alındığında buraya gerçek domain yazılacak (Örn: https://api.vadikonaklari.com)
String baseURL = "https://furkaniot4545.loca.lt"; 
String macAddress = "";

// --- SİSTEM DEĞİŞKENLERİ ---
unsigned long oncekiZaman = 0;
const long beklemeSuresi = 2000; 

void setup() {
    Serial.begin(115200);

    // FastLED Kurulumu (Orijinal şemadaki 74AHCT125 entegresi ile sürülür)
    FastLED.addLeds<WS2811, DATA_PIN, BRG>(leds, MAX_LEDS);
    FastLED.setMaxPowerInVoltsAndMilliamps(12, 20000); // 20A Akım Sınırı
    FastLED.clear();
    FastLED.show();

    // --- WIFI MANAGER (STARBUCKS MANTIĞI) ---
    WiFiManager wm;
    
    Serial.println("Wi-Fi baglantisi araniyor...");
    
    // Cihaz kayıtlı bir ağ bulamazsa "Maket-Kurulum" adında şifresiz bir ağ yayar.
    // Müşteri bu ağa bağlandığında telefonda otomatik Wi-Fi seçme ekranı açılır.
    bool res = wm.autoConnect("Maket-Kurulum");

    if(!res) {
        Serial.println("Baglanti saglanamadi, cihaz yeniden baslatiliyor...");
        delay(3000);
        ESP.restart();
    } 
    
    Serial.println("\nWi-Fi Baglantisi Basarili! Müşteri ağına bağlandı.");
    Serial.print("ESP32 IP Adresi: ");
    Serial.println(WiFi.localIP());

    // Cihazın MAC Adresini Alıyoruz (Admin panele kaydedilecek adres budur)
    macAddress = WiFi.macAddress();
    Serial.print("Cihaz MAC Adresi: ");
    Serial.println(macAddress);
}

void loop() {
    unsigned long suankiZaman = millis();

    if ((suankiZaman - oncekiZaman >= beklemeSuresi)) {
        
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            
            String requestURL = baseURL + "/api/device/sync?mac_address=" + macAddress;
            http.begin(requestURL); 
            
            // Localtunnel kullanılıyorsa güvenlik ekranını atlamak için (Canlıda kaldırılabilir)
            http.addHeader("Bypass-Tunnel-Reminder", "true");
            
            int httpResponseCode = http.GET(); 

            if (httpResponseCode == 200) {
                String payload = http.getString();
                
                DynamicJsonDocument doc(8192); 
                DeserializationError error = deserializeJson(doc, payload);

                if (!error) {
                    int count = doc["count"];
                    JsonArray colors = doc["colors"];
                    
                    FastLED.clear();

                    for (int i = 0; i < count && i < MAX_LEDS; i++) {
                        const char* hexColor = colors[i];
                        
                        if (hexColor != nullptr && hexColor[0] == '#') {
                            long number = strtol(&hexColor[1], NULL, 16);
                            leds[i] = number; 
                        }
                    }
                    FastLED.show(); 
                } else {
                    Serial.print("JSON Hatasi: ");
                    Serial.println(error.c_str());
                }
            } else if (httpResponseCode == 401) {
                Serial.println("Hata: Bu MAC adresi sisteme kayitli degil! Lutfen admin panelinden yetkilendirin.");
            } else {
                Serial.print("HTTP Hata Kodu: ");
                Serial.println(httpResponseCode);
            }
            http.end(); 
        } else {
            Serial.println("Wi-Fi Baglantisi Koptu!");
        }
        oncekiZaman = suankiZaman;
    }
}
