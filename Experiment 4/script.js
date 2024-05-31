//  Reference the html elements on the page
const statusElm = document.getElementById("status");
const infoElm = document.getElementById("info");

//  Setup global variables
let bledevice = null;
let bleservice = null;
let battery_voltage = NaN;

function setup() {
  //  Setup the main page
  createCanvas(800,600);

  statusElm.innerText = "Awaiting Permissions...";
  infoElm.innerText = "Click anywhere to start";
}

async function loadCharacteristics(device){
  //  Connect to the device
  let gatt = await device.gatt.connect();
  statusElm.innerText = "Connected!";
  //  Get a reference to the ble service we defined in the arduino code
  bleservice = await gatt.getPrimaryService("8bc88216-cabd-4348-94a1-eef05605c81c");

  //  Get a reference to the ble battery characteristic we defined. We only defined one characteristic, so we don't have to specify the id
  let batteryChar = (await bleservice.getCharacteristics())[0];

  //  Set up bluetooth so that it listens for changes to the battery level, and only runs the code below when said battery level changes
  batteryChar.addEventListener('characteristicvaluechanged', (event)=>{
    //  Read the battery level. The battery level is a signed 16 bit integer, but the nano has a different endianness, so we have to manually reverse the bytes whenever we read the data its sending us.
    let tmp = batteryChar.value.getUint16();
    tmp = ((tmp&0xFF) << 8) | ((tmp&0xFF00) >> 8)
    if(0b1000000000000000 & tmp) tmp |= 0xFFFF0000;

    battery_voltage = tmp;
    console.log("update", battery_voltage);  //  Log the new battery voltage to the console
  });

  batteryChar.startNotifications();  //  Tell the browser that we are listening for changes to this characteristic

  try{
    //  Read and update the know battery value
    await batteryChar.readValue();

    //  Read the battery level. The battery level is a signed 16 bit integer, but the nano has a different endianness, so we have to manually reverse the bytes whenever we read the data its sending us.
    let tmp = batteryChar.value.getUint16();
    tmp = ((tmp&0xFF) << 8) | ((tmp&0xFF00) >> 8)
    if(0b1000000000000000 & tmp) tmp |= 0xFFFF0000;
    battery_voltage = tmp;

  }catch(err){  //  Log errors
    console.error(err);
    alert(err)
  }
}

function touchStarted(){
  //  We have to wait for the user to do something before we can connect to a device.
  statusElm.innerText = "Awaiting Permissions...";
  infoElm.innerText = "Please select a device";
  if(bledevice===null){
    try{
      //  Try to connect to the nano
    navigator.bluetooth.requestDevice({
        filters:[
          {
            services:["8bc88216-cabd-4348-94a1-eef05605c81c"]
          }
        ]
      }).then((device)=>{
        //  If we have connected we should tell the user, and setup the battery tracking
        statusElm.innerText = "Device obtained!";
        infoElm.innerText = device.name;
        bledevice = device;
        return device;
      }).then(loadCharacteristics);
    }catch(err){
      //  We failed to connect. Show a red screen and log the error
      console.error(err);
      noLoop();
      background(255,0,0);
    }
  }else{
    //  Disconnect from the ble device
    bledevice.gatt.disconnect();
    bledevice = null;
    bleservice = null;
  }
}

function draw() {
  background(0);
  if(bledevice && bledevice.gatt.connected){
    background(255);  //  Draw a white background when we are connected to the nano
  }
  fill(0);
  noStroke();
  text(`Battery Voltage: ${battery_voltage/1023*6.6}`, 50, 50)  //  Draw the battery voltage on the screen

  square(battery_voltage/1023*width, 200, 25);  //  Display a little square which moves to the left as the battery discharges
}