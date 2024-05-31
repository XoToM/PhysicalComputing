const statusElm = document.getElementById("status");
const infoElm = document.getElementById("info");

const delaya = time => new Promise(res=>setTimeout(res,time));
let bledevice = null;
let bleservice = null;
let battery_voltage = NaN;

let lastGyro = { 
    x:0, //  Roll
    y:0, //  Pitch
    z:0  //  Yaw
  };

let gyroVis = (sketch)=>{
  sketch.setup = ()=>{
    sketch.createCanvas(300, 300, sketch.WEBGL);
  };
  sketch.draw = ()=>{
    sketch.background(100);
    
    sketch.orbitControl();
    sketch.normalMaterial();
    
    if(bledevice && bleservice){
      sketch.push();
      sketch.rotateY(lastGyro.z);
      sketch.rotateX(-lastGyro.y);
      sketch.rotateZ(-lastGyro.x);
      //sketch.rotateZ(lastGyro.z);
      //sketch.rotateY(lastGyro.y);
      sketch.box(80, 20, 120);
      sketch.pop();

      sketch.translate(0,-50,0);
      sketch.scale(0.5,0.5,0.5);
      sketch.cone();
    }
  };
}

function setup() {
  createCanvas(800,300);//(windowWidth, windowHeight);

  statusElm.innerText = "Awaiting Permissions...";
  infoElm.innerText = "Click anywhere to start";

  setInterval(async ()=>{
    if(bledevice && bleservice){
      let batteryChar = await bleservice.getCharacteristic("36e5a4fe-8709-4f33-9934-75cb915f6c9e");
      try{
        await batteryChar.readValue();
        //alert( batteryChar.value.byteLength);
        battery_voltage = batteryChar.value.getUint16();
        if(0b1000000000000000 & battery_voltage) battery_voltage |= 0xFFFF0000;
      }catch(err){
        console.error(err);
        alert(err)
      }
    }
  }, 1000);
}
async function doThing(device){
  console.log("Connecting!");
  let gatt = await device.gatt.connect();
  console.log("Connected!");
  statusElm.innerText = "Connected!";
  bleservice = await gatt.getPrimaryService("ce22b016-aea9-4f83-818a-d9d32d4afc68");
  console.log("Service gotten");
  console.log(bleservice);
  //bleservice = bleservice[0];
  let txChar = await bleservice.getCharacteristic("f3d9adf7-4968-4caf-93ae-270061bfc548");
  console.log("Battery gotten");
  txChar.addEventListener('characteristicvaluechanged', (event)=>{
    let decoder = new TextDecoder("ascii");
    console.log(decoder.decode(event.target.value));
    //battery_voltage = event.target.value.getUint16();
    //battery_voltage = (battery_voltage >> 8) | ((battery_voltage & 0xFF) << 8);
  });

  console.log("RX ready");
  txChar.startNotifications();

  
  let gyroChar = await bleservice.getCharacteristic("0affe148-5b88-48c7-95e1-d22b442dedbf");
  console.log("Gyro gotten");
  gyroChar.addEventListener('characteristicvaluechanged', (event)=>{
    let gyro = event.target.value;
    lastGyro.x = dataViewReadBEFloat(gyro, 0);
    lastGyro.y = dataViewReadBEFloat(gyro, 4);
    lastGyro.z = dataViewReadBEFloat(gyro, 8);
    //console.log(gyro);
    //console.log(`${lastGyro.x*180/Math.PI} ${lastGyro.y*180/Math.PI} ${lastGyro.z*180/Math.PI}`);
  });
  console.log("Gyro ready");
  gyroChar.startNotifications();
  
}

function touchStarted(){
  statusElm.innerText = "Awaiting Permissions...";
  infoElm.innerText = "Please select a device";
  if(bledevice===null){
    navigator.bluetooth.requestDevice({
        filters:[
          {
            services:["ce22b016-aea9-4f83-818a-d9d32d4afc68"]
          }
        ],//*/
        //acceptAllDevices:true
      }).then((device)=>{
  
        statusElm.innerText = "Device obtained!";
        infoElm.innerText = device.name;
        bledevice = device;
        console.log("Got!");
        return device;
      }).then(doThing).catch(err=>alert(err));
  }/*else{
    try{
       bledevice.gatt.disconnect();
       //bledevice.forget();
    }finally{
      bledevice = null;
      bleservice = null;
    }
  }//*/
}

function draw() {
  background(0);
  if(bledevice && bledevice.gatt.connected){
    background(255);
  }
  fill(0);
  noStroke();
  text(`Battery Voltage: ${battery_voltage}`, 50, 50)
  text(`Rotation:\n${lastGyro.x/Math.PI*180}\n${lastGyro.y/Math.PI*180}\n${lastGyro.z/Math.PI*180}`, 50, 75)

  square(battery_voltage/1023*width, 200, 25);
  
  //noStroke()
  //fill(random(colorlist));
  //ellipse(mouseX, mouseY, 25, 25);
}

function dataViewReadBEFloat(dv, offset){
  let bytes = new DataView(new ArrayBuffer(4));
  for(let i=0; i<4; i++){
    bytes.setUint8(i,dv.getUint8(offset+3-i));
  }
  return bytes.getFloat32(0);
}

new p5(gyroVis);