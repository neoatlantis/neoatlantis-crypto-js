all: enigma-jscrypto.js
	java -jar yuicompressor-2.4.8.jar enigma-jscrypto.js -o enigma-jscrypto.min.js
	rm -f *.t

clean:
	rm -f *.t

clear: 
	rm -f *.t 
	rm -f enigma-jscrypto.js enigma-jscrypto.min.js

test: enigma-jscrypto.js
	node test.js

test-enigma: enigma-jscrypto.js ../demo.js
	node ../demo.js

test-enigma-intensive: enigma-jscrypto.js test-enigma.js
	node test-enigma.js

enigma-jscrypto.js: main.t makehead.js maketail.js
	cat makehead.js main.t maketail.js > enigma-jscrypto.js
	rm main.t

main.t: util.t hash.t cipher.t enigma.t accelerator.t
	cat util.t hash.t cipher.t enigma.t accelerator.t > main.t

hash.t: hash/*.js 
	cat hash/*.js > hash.t

util.t: util.serialize.t util/*.js
	cat util/*.js util.serialize.t > util.t

util.serialize.t: util/serialize/*.js
	cat util/serialize/*.js > util.serialize.t

enigma.t: interface.enigma.t enigma/*.js
	cat enigma/*.js interface.enigma.t > enigma.t

cipher.t: asymcipher.t symcipher.t
	cat asymcipher.t symcipher.t > cipher.t

asymcipher.t: ec.asymmetric.t cipher/asymmetric/*.js
	cat ec.asymmetric.t cipher/asymmetric/*.js > asymcipher.t

ec.asymmetric.t: cipher/asymmetric/ec/*.js
	cat cipher/asymmetric/ec/*.js > ec.asymmetric.t

symcipher.t: cipher/symmetric/*.js
	cat cipher/symmetric/*.js > symcipher.t

accelerator.t: accelerator/*.js
	cat accelerator/*.js > accelerator.t

interface.enigma.t: enigma/interface/*.js
	cat enigma/interface/*.js > interface.enigma.t
