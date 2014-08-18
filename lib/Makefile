all: enigma-jscrypto.js
	java -jar yuicompressor-2.4.8.jar enigma-jscrypto.js -o enigma-jscrypto.min.js	

clean:
	rm *.t


enigma-jscrypto.js: cipher.t hash.t util.t
	cat util.t cipher.t hash.t > main.t
	cat makehead.js main.t maketail.js > enigma-jscrypto.js

hash.t:
	cat hash/*.js > hash.t

util.t:
	cat util/*.js > util.t

cipher.t: asymcipher.t symcipher.t
	cat asymcipher.t symcipher.t > cipher.t

asymcipher.t:
	cat cipher/asymmetric/*.js > asymcipher.t

symcipher.t:
	cat cipher/symmetric/*.js > symcipher.t
