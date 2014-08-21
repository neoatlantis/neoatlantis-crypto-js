all: enigma-jscrypto.js
	java -jar yuicompressor-2.4.8.jar enigma-jscrypto.js -o enigma-jscrypto.min.js	

clean:
	rm *.t


enigma-jscrypto.js: hash.t util.t cipher.t
	#cat util.t cipher.t hash.t > main.t
	cat hash.t > main.t
	cat makehead.js main.t maketail.js > enigma-jscrypto.js
	rm main.t

hash.t: hash/hash.js hash/blake2s.js hash/ripemd160.js hash/whirlpool.js
	cat hash/blake2s.js hash/ripemd160.js hash/whirlpool.js hash/hash.js > hash.t

util.t: util/buffer.js util/encoding.js util/log.js util/random.js util/type.js
	cat util/buffer.js util/encoding.js util/log.js util/random.js util/type.js > util.t

cipher.t: asymcipher.t symcipher.t
	cat asymcipher.t symcipher.t > cipher.t

asymcipher.t:
	cat cipher/asymmetric/*.js > asymcipher.t

symcipher.t:
	cat cipher/symmetric/*.js > symcipher.t
