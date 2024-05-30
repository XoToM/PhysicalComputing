const button = document.getElementById("btn");	//	Get the html button we use to connect to devices.

button.addEventListener("click", async () => {
	//	When the connectbutton is pressed we should sak the user which device we want to connect to, and we should connect to the selected device.
	//	The Web Serial API only lets us request connections to serial devices when a user does something on the web page.
	//	This means that we cannot do this when the page loads, and instead we have to wait for the user to press a button on the page.
	
	await navigator.serial
		.requestPort({ filters:[] })	//	Request the web browser to give us a serial connection to the arduino
		.then(async (port) => {
			btn.disabled = true;
			await port.open({baudRate:9600});	//	Open the port so we cna read and write data to it
			
			while (port.readable) {//	Repeat while connected to the device
				
				//	Setup the serial connection for reading text
				const reader = await port.readable.pipeThrough(new TextDecoderStream()).getReader();
				try {
					let textBuffer = "";	//	Setup a buffer for the incoming text
					while (true) {
						const { value, done } = await reader.read();
						if (done) {
							//	Quit the loop if the device is being disconnected
							break;
						}

						//	The arduino might split up a string while sending it over the serial connection.
						//	For this reason we have to buffer each line of text we receive until we receive the entire string
						for(let c of value){
							if(c === '\n'){
								textBuffer = textBuffer.trim();	//	Remove whitespace characters from the start and the end of the string
								receivedLine(textBuffer);	//	Process the full line of text being received
								textBuffer = "";	//	Reset the text buffer
							}else{
								textBuffer += c;	//	Add the character to the text buffer
							}
						}
					}
				} catch (error) {
					//	Print out any errors to the console
					console.error(error);
				} finally {
					//	Close the serial connection on our end.
					reader.releaseLock();
					btn.disabled = false;
				}
			}
		})
		.catch((e) => {
			//	Print out any errors to the console
			console.error(e);
			btn.disabled = false;
		});
});

function receivedLine(text){
	console.log(text);	//	Print out the received line of text in the console

	//	If the line of text says "Released" we should play a short audio clip
	if(text === "Released"){
		let audio = new Audio('./easy.mp3');
		audio.play();
	}
}