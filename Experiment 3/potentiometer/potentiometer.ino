//  A simple script which reads the state of the potentiometer on pin A0, and sends the result over the serial connection. The sent data will be visible in the Arduino IDE's serial plotter.

void setup() {
  pinMode(A0, INPUT); //  Setup the A0 pin as an analog input for the potentiometer
  
  Serial.begin(9600); //  Initialize the Serial connection

  while(!Serial){}  //  Wait for a serial device to connect
}

void loop() {
  Serial.println(analogRead(A0)); //  Read the data from the analog pin, and send the result through the serial connection.
  delay(50);  //  A short delay to decrease the frequency of the serial writes. 
  //  The Arduino IDE has a hard limit on how many data points it can plot in its serial plotter, so the faster we send the data, the shorter amount of time the data will be visible for before it gets replaced with new data.
}
