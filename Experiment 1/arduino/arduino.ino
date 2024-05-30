void setup() {
  Serial.begin(9600);
  while(!Serial){}  //  Wait for a device to connect to the arduino

  pinMode(4, INPUT_PULLUP); //  Tell the arduino that the button is connected to pin 4, and that we are going to be reading from that pin.
  //  The arduino has a built in resistor for reading data from pins, which can be used to greatly simplify the circuit when we are reading data from buttons.
  //  To do this we have to tell the arduino to use the INPUT_PULLUP mode on the pin instead of INPUT. This will cause the arduino to connect this pin to 5V through a resistor internally. 
  //  Reading from this pin will then make the arduino check if this pin has a connection to ground or not. This makes connecting buttons to the arduino a lot simpler, as we no longer have to add the resistor and the connections ourselves.
}

bool lastPressed = false;
void loop() {
  bool pressed = !digitalRead(4); //  Read the input from the pin the button is connected to. The input will be inverted, so we should invert it back.

  if(pressed && !lastPressed) { //  Detect when the button is pressed, and print a message through the serial connection.
    Serial.println("Pressed");
  }
  if(!pressed && lastPressed){ //  Detect when the button is released, and print a message through the serial connection.
    delay(200); //  Some extra delay to prevent the arduino from incorrectly detecting button presses when there aren't any. This also makes helps time the audio clip better on the website provided in this repo. 
    Serial.println("Released");
  }

  lastPressed = pressed;  //  Update the last known state of the button
  delay(10);  //  Add some delay to prevent the arduino from incorrectly detecting false presses/releases (this sometimes happens when cheap components are used for the circuit)
}
