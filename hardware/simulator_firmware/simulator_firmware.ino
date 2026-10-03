#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>

// --- DONANIM AYARLARI ---
#define DATA_PIN 2        
#define MAX_LEDS 16     
Adafruit_NeoPixel strip(MAX_LEDS, DATA_PIN, NEO_GRB + NEO_KHZ800);

// --- AĞ VE BULUT AYARLARI ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Kendi sunucunuzun sabit (fixed) Localtunnel adresi
String baseURL = "https://furkaniot4545.loca.lt"; 
String macAddress = "";
unsigned long oncekiZaman = 0;
const long beklemeSuresi = 2000; 

void setup() {
    Serial.begin(115200);

    // NeoPixel Kurulumu
    strip.begin();
    strip.show(); // Tüm LED'leri kapat

    Serial.println("Wokwi-GUEST Agina baglaniliyor...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nBaglanti Basarili!");
    
    macAddress = WiFi.macAddress();
    Serial.print("Bu sanal cihazin MAC Adresi: ");
    Serial.println(macAddress);
}

void loop() {
    unsigned long suankiZaman = millis();

    if ((suankiZaman - oncekiZaman >= beklemeSuresi)) {
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            String requestURL = baseURL + "/api/device/sync?mac_address=" + macAddress;
            http.begin(requestURL); 
            http.addHeader("Bypass-Tunnel-Reminder", "true"); 
            
            int httpResponseCode = http.GET(); 

            if (httpResponseCode == 200) {
                String payload = http.getString();
                DynamicJsonDocument doc(4096); 
                DeserializationError error = deserializeJson(doc, payload);

                if (!error) {
                    int count = doc["count"];
                    JsonArray colors = doc["colors"];
                    
                    strip.clear();
                    for (int i = 0; i < count && i < MAX_LEDS; i++) {
                        const char* hexColor = colors[i];
                        if (hexColor != nullptr && hexColor[0] == '#') {
                            long number = strtol(&hexColor[1], NULL, 16);
                            // Hex kodunu RGB bileşenlerine ayır
                            int r = (number >> 16) & 0xFF;
                            int g = (number >> 8) & 0xFF;
                            int b = number & 0xFF;
                            strip.setPixelColor(i, strip.Color(r, g, b));
                        }
                    }
                    strip.show(); 
                }
            } else if (httpResponseCode == 401) {
                Serial.println("Bu MAC adresi admin panelinden yetkilendirilmemis!");
            }
            http.end(); 
        }
        oncekiZaman = suankiZaman;
    }
}
