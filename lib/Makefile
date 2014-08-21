all: enigma-jscrypto.js
	java -jar yuicompressor-2.4.8.jar enigma-jscrypto.js -o enigma-jscrypto.min.js	

clean:
	rm *.t


enigma-jscrypto.js: hash.t util.t cipher.t
	#cat util.t cipher.t hash.t > main.t
	cat hash.t > main.t
	cat makehead.js main.t maketail.js > enigma-jscrypto.js
	rm main.t

hash.t: hash/*.js 
	cat hash/*.js > hash.t

util.t: util/*.js
	cat util/*.js > util.t

cipher.t: asymcipher.t symcipher.t
	cat asymcipher.t symcipher.t > cipher.t

asymcipher.t: ec.asymmetric.t cipher/asymmetric/*.js
	cat ec.asymmetric.t cipher/asymmetric/*.js > asymcipher.t

ec.asymmetric.t: cipher/asymmetric/ec/*.js
	cat cipher/asymmetric/ec/*.js > ec.asymmetric.t

symcipher.t: cipher/symmetric/*.js
	cat cipher/symmetric/*.js > symcipher.t
