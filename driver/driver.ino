#include "time.h"
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include "logo.h"
#include "envs.h"

#define I2C_SDA 21
#define I2C_SCL 22

#define i2c_Address 0x3c

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET 19

#define SEALEVELPRESSURE_HPA (1013.25)

const char *ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;
const int daylightOffset_sec = 3600;

TaskHandle_t UploadTask;

TwoWire I2CWire = TwoWire(0);
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &I2CWire, OLED_RESET);
Adafruit_BME280 bme;

void setup()
{
  Serial.begin(115200);
  I2CWire.begin(I2C_SDA, I2C_SCL, 100000);

  delay(250);
  display.begin(i2c_Address, true);
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.clearDisplay();
  display.drawBitmap((SCREEN_WIDTH - 32) / 2, (SCREEN_HEIGHT - 32) / 2, logo, 32, 32, SH110X_WHITE);
  display.display();
  delay(250);

  bool status;

  WiFi.begin(ssid, password);
  Serial.print("Connecting...");

  // Clear the buffer.
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting to WiFi");
  display.display();

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    display.print(".");
    display.display();
  }

  display.clearDisplay();

  Serial.println("");
  Serial.print("Connected to WiFi\n");

  display.setCursor(0, 0);
  display.println("Connected to WiFi");
  display.display();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  status = bme.begin(0x76, &I2CWire);
  if (!status)
  {
    Serial.println("Could not find the BME280 sensor!");
    while (1)
    {
      display.setCursor(0, 0);
      display.invertDisplay(false);
      display.clearDisplay();
      display.println("BME280 sensor not found!");
      display.display();
      delay(1500);
      display.setCursor(0, 0);
      display.clearDisplay();
      display.invertDisplay(true);
      display.println("BME280 sensor not found!");
      display.display();
      delay(1500);
    }
  }
}

void loop()
{
  struct tm timeinfo;
  getLocalTime(&timeinfo);

  int temp = bme.readTemperature();
  int pressure = bme.readPressure() / 100.0F;
  int humidity = bme.readHumidity();

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Temp: " + String(temp) + " C");
  display.println("Pressure: " + String(pressure) + " hPa");
  display.println("Humidity: " + String(humidity) + "%");
  display.println("");
  display.println(&timeinfo, "%H:%M:%S");
  display.drawBitmap(SCREEN_WIDTH - 32, SCREEN_HEIGHT - 32, logo, 32, 32, SH110X_WHITE);
  display.display();

  delay(500);
}