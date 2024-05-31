#include <ArduinoBLE.h>
#include <Ewma.h>
#include <Arduino_LSM9DS1.h>
#include <MadgwickAHRS.h>


const char* droneServiceUuid = "ce22b016-aea9-4f83-818a-d9d32d4afc68";
const char* txCharacteristicUuid = "f3d9adf7-4968-4caf-93ae-270061bfc548";

BLEService droneService(droneServiceUuid);

//    --- Setup the debug logging ---
BLEStringCharacteristic txChar(txCharacteristicUuid, BLERead | BLENotify, 128);

void console_println(const String& value){
  Serial.println(value);
  
  txChar.writeValue(value);
  txChar.broadcast();
}

//    --- Setup the battery monitor ---
BLEUnsignedShortCharacteristic batteryLevelChar("36e5a4fe-8709-4f33-9934-75cb915f6c9e", BLERead); // remote clients will be able to get notifications if this characteristic changes
Ewma batteryFilter(0.06);   // 0.1 == Less smoothing - faster to detect changes, but more prone to noise

void update_battery(){
  double batteryLevel = batteryFilter.filter(analogRead(A4)); //  Upadte the filter with the readings from the battery. The battery voltage divieder is connected to pin A4
  batteryLevelChar.writeValueBE((unsigned short)map((long)batteryLevel, 2360, 2700, 0,100));
}


Madgwick gyro;
union gyro_ble_packet {
  struct __attribute__((packed)){
    float rx;
    float ry;
    float rz;
  };
  uint8_t bytes[12];
};

union gyro_ble_packet gyro_ble;

BLECharacteristic gyroChar("0affe148-5b88-48c7-95e1-d22b442dedbf", BLERead | BLENotify, 12, true);

void update_gyro(){
  if(IMU.gyroscopeAvailable() && IMU.accelerationAvailable()){
    float ax,ay,az, gx,gy,gz, mx,my,mz;
    IMU.readAcceleration(ax, ay, az);
    IMU.readGyroscope(gx, gy, gz);

    gx *= -1.0f;
    gy *= -1.0f;

    //gyro.updateIMU(gx-2.72, gy-0.89, gz-2.72, ax+0.01, ay+0.02, az+0.01);
    gyro.updateIMU(gx, gy, gz, ax, ay, az);
    gyro_ble.rx = gyro.getRollRadians();//.getRoll();
    gyro_ble.ry = gyro.getPitchRadians();//.getPitch();
    gyro_ble.rz = gyro.getYawRadians();//.getYaw();
    gyroChar.writeValue(gyro_ble.bytes, 12, false);
  }
}


void setup() {
  analogReadResolution(12);

  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  if (!BLE.begin()) {
    console_println("Starting BLE failed!");

    digitalWrite(LED_BUILTIN, HIGH);
    while (1);
  }


  droneService.addCharacteristic(batteryLevelChar); // add the battery level characteristic

  droneService.addCharacteristic(txChar);
  droneService.addCharacteristic(gyroChar);
  BLE.addService(droneService);
  BLE.setAdvertisedService(droneService);
  
  BLE.setLocalName("Qbit's thingamajig");
  

  BLE.setEventHandler( BLEConnected, onBleConnect );
  BLE.setEventHandler( BLEDisconnected, onBleDisconnect );

  BLE.advertise();
  

  if (!IMU.begin()) {
    console_println("Failed to initialize IMU!");
    
    digitalWrite(LED_BUILTIN, HIGH);
    while (1);
  }
  gyro.begin(104);


  console_println("Ready");
  console_println(BLE.address());
}

void onBleConnect(BLEDevice central){
  console_println("Central Connected");
}
void onBleDisconnect(BLEDevice central){
  console_println("Central Disconnected");
}

bool checkIfCrashed(){
  float roll = gyro.getRollRadians();
  float pitch = gyro.getPitchRadians();
  float yaw = gyro.getYawRadians();//0.0f; 

  float cr = cos(roll * 0.5);
  float sr = sin(roll * 0.5);
  float cp = cos(pitch * 0.5);
  float sp = sin(pitch * 0.5);
  float cy = cos(yaw * 0.5);
  float sy = sin(yaw * 0.5);

  float q[4];
  q[3] = cr * cp * cy + sr * sp * sy;
  q[0] = sr * cp * cy - cr * sp * sy;
  q[1] = cr * sp * cy + sr * cp * sy;
  q[2] = cr * cp * sy - sr * sp * cy;

  //console_println(String(q[0])+" "+String(q[1])+" "+String(q[2])+" "+String(q[3]));

  float down[4] = {1.0f,0.0f,0.0f,0.0f};
  float acc = 0.0f;
  for(int i=0; i<4; i++)acc += down[i]*q[i];

  float er = abs(roll)+abs(pitch);
  //console_println(String(acc) +"  "+String(er) + " " + String);

  return (er < 1.0471975511965976); //  Really weird way of checking if drone is facing down through euler angles. I'm not 100% sure if this always works, but I haven't seen it be wrong yet, so here it goes.
}

long lastTick = 0;
long lastUpdate = 0;
void loop() {
  long currentTick = millis();
  if(currentTick - lastTick > 10){
    BLE.poll();
    lastTick = currentTick;

    if(currentTick - lastUpdate > 500){
      lastUpdate = currentTick;
      if(checkIfCrashed()){
        console_println("Crashed!");
      }
      update_battery();
    }
    update_gyro();

    lastTick = currentTick;
  }
}
