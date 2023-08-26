#include "time.h"
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include "logo.h"
// Contains the WiFi credentials and the Supabase URL and key
#include "envs.h"

#define I2C_SDA 21
#define I2C_SCL 22
#define WAKEUP_PIN 4

#define i2c_Address 0x3c

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET 19

// Time between uploads to the database
#define DATABASE_INTERVAL 20000
#define SEALEVELPRESSURE_HPA (1013.25)

#define INTEGER_LIMIT 2147483647

const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;
const int daylightOffset_sec = 3600;

TaskHandle_t UploadTask;

TwoWire I2CWire = TwoWire(0);
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &I2CWire, OLED_RESET);
Adafruit_BME280 bme;

String uploadError = "";

int screenTime = 0;

void setup()
{
  pinMode(WAKEUP_PIN, INPUT);
  Serial.begin(115200);
  I2CWire.begin(I2C_SDA, I2C_SCL, 100000);

  delay(250);
  display.begin(i2c_Address, true);
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.clearDisplay();
  display.drawBitmap((SCREEN_WIDTH - 32) / 2, (SCREEN_HEIGHT - 32) / 2, logo, 32, 32, SH110X_WHITE);
  display.setCursor((SCREEN_WIDTH - 32) / 2 - 16, (SCREEN_HEIGHT - 32) / 2 + 38);
  display.println("pkozak.org");
  display.display();
  delay(350);

  bool status = bme.begin(0x76, &I2CWire);
  if (!status)
  {
    Serial.println("Could not find the BME280 sensor!");
    display.setTextSize(2);
    while (1)
    {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.invertDisplay(false);
      display.println("BME280 sensor not found!");
      display.display();
      delay(1500);
      display.clearDisplay();
      display.setCursor(0, 0);
      display.invertDisplay(true);
      display.println("BME280 sensor not found!");
      display.display();
      delay(1500);
    }
  }

  WiFi.begin(ssid, password);
  Serial.print("Connecting...");

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting to WiFi");
  display.display();

  while (WiFi.status() != WL_CONNECTED && WiFi.status() != WL_CONNECT_FAILED)
  {
    delay(500);
    Serial.print(".");
    display.print(".");
    display.display();
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  if (WiFi.status() != WL_CONNECT_FAILED)
  {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    Serial.println("");
    Serial.print("Connected to WiFi\n");

    display.println("Connected to WiFi");
    display.display();

    xTaskCreatePinnedToCore(
        UploadData,   /* Task function. */
        "uploadData", /* name of task. */
        10000,        /* Stack size of task */
        NULL,         /* parameter of the task */
        1,            /* priority of the task */
        &UploadTask,  /* Task handle to keep track of created task */
        1);           /* pin task to core 1 */
  }
  else
  {
    Serial.println("");
    Serial.println("Connection failed\n");
    Serial.println("Working in offline mode");

    display.println("Connection failed");
    display.println("Working in offline mode");
    display.display();
  }
}

void loop()
{
  // After 10s of inactivity, display the screen saver
  if (screenTime >= 10000)
  {
    int x = random(0, SCREEN_WIDTH - 32);
    int y = random(0, SCREEN_HEIGHT - 32);

    int vx = random(-2, 2);
    int vy = random(-2, 2);

    // Animate until button a press
    while (digitalRead(WAKEUP_PIN) == LOW)
    {
      display.clearDisplay();
      display.drawBitmap(x, y, logo, 32, 32, SH110X_WHITE);
      display.display();

      x += vx;
      y += vy;

      if (x < 0 || x > SCREEN_WIDTH - 32)
      {
        vx *= -1;
      }

      if (y < 0 || y > SCREEN_HEIGHT - 32)
      {
        vy *= -1;
      }

      delay(50);
    }

    screenTime = 0;
  }

  struct tm timeinfo;
  getLocalTime(&timeinfo);

  int temp = bme.readTemperature();
  int pressure = bme.readPressure() / 100.0F;
  int humidity = bme.readHumidity();

  display.clearDisplay();
  display.setCursor(0, 0);
  if (temp == INTEGER_LIMIT) // Avoid displaying invalid data
  {
    display.setTextSize(2);
    display.println("Error while reading data");
    display.setTextSize(1);
    display.println("Please restart");
  }
  else
  {
    display.println("Temp: " + String(temp) + " C");
    display.println("Pressure: " + String(pressure) + " hPa");
    display.println("Humidity: " + String(humidity) + "%");
    screenTime += 500;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    display.println("");
    display.println(&timeinfo, "%H:%M:%S");
  }
  else
  {
    display.setCursor(0, SCREEN_HEIGHT - 10);
    display.println("Offline");
  }

  if (uploadError != "")
  {
    display.setCursor(0, SCREEN_HEIGHT - 10);
    display.println(uploadError);
  }

  display.drawBitmap(SCREEN_WIDTH - 32, SCREEN_HEIGHT - 32, logo, 32, 32, SH110X_WHITE);
  display.display();

  if (digitalRead(WAKEUP_PIN) == HIGH)
  {
    Serial.println("Waking up");
  }

  delay(500);
}

void UploadData(void *pvParameters)
{
  while (1)
  {
    int temp = bme.readTemperature();
    if (temp == NULL || temp == INTEGER_LIMIT) // Avoid uploading invalid data
    {
      Serial.println("Error while reading data, skipping upload");
      delay(DATABASE_INTERVAL);
      return;
    }

    HTTPClient http;
    http.begin(SUPABASE_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + String(SUPABASE_KEY));
    http.addHeader("apikey", String(SUPABASE_KEY));

    JSONVar weather;

    weather["temperature"] = bme.readTemperature();
    weather["pressure"] = bme.readPressure() / 100.0F;
    weather["humidity"] = bme.readHumidity();

    int resp = http.POST(JSON.stringify(weather));
    if (resp != 201)
    {
      Serial.println("Error uploading data");
      Serial.println(http.errorToString(resp));
      Serial.println(http.getString());
      uploadError = "Error code " + String(resp);
    }
    else
    {
      uploadError = "";
    }

    delay(DATABASE_INTERVAL);
  }
}