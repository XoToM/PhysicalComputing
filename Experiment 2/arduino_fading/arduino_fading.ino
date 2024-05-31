//  Simple code which fades a led in and out through PWM.

long phase = 1000;  //  How quickly should the light fade in and out

void setup() {
  pinMode(4, OUTPUT); //  Set the output mode for the pin the LED is connected to
}

void loop() {
  long mil = millis() % (2*phase); //  Causes the code below to restart every 2000 milliseconds

  if(mil >= phase){  //  If we have passed the half way point the strength should decrease
    mil -= phase;
    analogWrite(4, map(mil, 0, phase-1, 255, 0));   //  Map the amount of milliseconds to the strength of the pwm output the arduino should generate
  }else{
    analogWrite(4, map(mil, 0, phase-1, 0, 255));
  }
}
