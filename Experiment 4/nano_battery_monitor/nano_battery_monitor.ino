//  Import the Arduino BLE library
#include <ArduinoBLE.h>

//  Set up the UUIDs for ble.
const char* droneServiceUuid = "8bc88216-cabd-4348-94a1-eef05605c81c";
const char* batteryCharacteristicUuid = "36e5a4fe-8709-4f33-9934-75cb915f6c9e";

//  Set up the ble objects
BLEService droneService(droneServiceUuid); 
BLEShortCharacteristic batteryCharacteristic(batteryCharacteristicUuid, BLERead | BLENotify); //  The battery haracteristic should be readable by the central device, and the central device should be notified when the value changes


void setup() {
  //  Setup the pins we are using
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(A2,INPUT);
  
  //  Setup the BLE chip on the nano
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }
  
  //  Set up the BLE library so that we can actually connect to the nano and see the battery. This involves registering the services and charactreistics with the ble library
  BLE.setLocalName("Arduino Drone");
  BLE.setAdvertisedService(droneService);
  droneService.addCharacteristic(batteryCharacteristic);
  batteryCharacteristic.writeValue(0);
  BLE.addService(droneService);

  //  Tell the BLE library that the nano is ready to receive connections
  BLE.advertise();
}

void loop() { //  Wait for a device to connect
  BLEDevice central = BLE.central();
  while(central.connected()) {
    //  When a device is connected we should blink the built in led
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    batteryCharacteristic.writeValue(analogRead(A2)); //  Update the battery value
    batteryCharacteristic.broadcast();
  }

  digitalWrite(LED_BUILTIN, LOW);
  delay(100);
}
