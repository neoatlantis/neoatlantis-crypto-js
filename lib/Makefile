all: cipher.t hash.t util.t
	cat util.t cipher.t hash.t > enigma-jscrypto.js

clean:
	rm *.t

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
