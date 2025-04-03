#include <Firebase_ESP_Client.h>
#include <Servo.h>
#include <ESP8266WiFi.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// 🔹 WiFi Credentials
#define ssid "MBSPF"  // Update with your WiFi name
#define password "MASK#001234"  // Update with your WiFi password

// 🔹 Firebase Configuration
#define FIREBASE_HOST "https://parkcam-55b53-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "AIzaSyDajhxwyZPFraNYPETWyqnUaagu-9CR1uk"

// 🔹 Pin Definitions
#define SERVO_PIN D1

// 🔹 Global Variables
Servo servo;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);

  int timeout = 20;  // Max wait time (10 sec)
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(500);
    Serial.print(".");
    timeout--;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed! Restarting...");
    ESP.restart();
  }
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();  // Connect to WiFi

  // 🔹 Initialize Firebase
  config.api_key = FIREBASE_AUTH;
  config.database_url = FIREBASE_HOST;

  // 🔹 Use Firebase Database Secret (Legacy Token)
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); // Ensure auto-reconnect

  // 🔹 Initialize Servo
  servo.attach(SERVO_PIN);
  servo.write(0);  // Ensure the gate starts in closed position
}


void loop() {
  if (Firebase.ready()) {
    Serial.println("✅ Firebase Connected!");
    
    // 🔹 Read Gate Status from Firebase
    if (Firebase.RTDB.getBool(&fbdo, "gate")) {
      bool gateOpen = fbdo.boolData();

      if (gateOpen) {
        Serial.println("🔓 Gate is OPENING...");
        servo.write(180);  // Open gate
        delay(5000);  // Keep it open for 3 seconds
        
        Serial.println("🔒 Gate is CLOSING...");
        servo.write(0);  // Close gate
        Firebase.RTDB.setBool(&fbdo, "gate", false);  // Reset Firebase value
      }
    } else {
      Serial.println("⚠ Failed to read 'gate' state from Firebase!");
    }
  } else {
    Serial.println("❌ Firebase Not Connected!");
  }

  delay(3000);  // Wait before the next check
}
