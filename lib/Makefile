all: neoatlantis-crypto-js.js
	java -jar yuicompressor-2.4.8.jar neoatlantis-crypto-js.js -o neoatlantis-crypto-js.min.js
	rm -f *.t

clean:
	rm -f *.t

clear: 
	rm -f *.t 
	rm -f neoatlantis-crypto-js.js neoatlantis-crypto-js.min.js

test: neoatlantis-crypto-js.js
	node test.js

test-enigma: neoatlantis-crypto-js.js ../demo.js
	node ../demo.js

test-enigma-intensive: neoatlantis-crypto-js.js test-enigma.js
	node test-enigma.js

neoatlantis-crypto-js.js: main.t makehead.js maketail.js
	cat makehead.js main.t maketail.js > neoatlantis-crypto-js.js
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
