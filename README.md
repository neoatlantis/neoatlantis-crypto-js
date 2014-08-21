Enigma Cryptographic Library in JavaScript
==========================================

> **NOTICE**: "Do not use home brewed library like this!" _Follow the
> pedagogical instructions and use conservative and well-behaved things like
> OpenSSL and enjoy the Spagetti and Heartbleed Flaw!_

> **This code is freshly out of the oven. It does works, but I need to improve
> it a lot. Do not use it to treat important files or data since
> un-backward-compatiable modifications are predictable.**

This is to separate the cryptography library used by my `enigma` project and
make it more easy to maintain. The library will be then made into runable on
both browser and NodeJS.

Features included:

* A non-standard home-brew symmetric cascading cipher. Not secure and not
  consistent and do not use it ;)
* Asymmetric cipher, also not standard. Use ECDH and ECDSA to combine and
  provide signing & encrypting feature with one single secret or one public
  key. ECDH is modified from the key-exchange protocol to a public key cipher
  by providing temporary pairing key to the receiver(the private key holder).
* Hash function, with MAC(_Message Authentication Code_) calculations. Now
  supports `RIPEMD-160`, `WHIRLPOOL` and `BLAKE2s`. MAC is done with HMAC by
  default, but for `BLAKE2s` it's calling an integrated function of the
  algorithm.
* Internal global secure(home-brewed, hopefully) random generator. Seeds
  feedable with external events.
* All incoming/outcoming parameter are enforced in format `ArrayBuffer`. A
  tool function for converting encoding(HEX, Base64, ArrayBuffer) is there.

Licensed under GPLv3.

## API Overview

The primary data type used in this library is `ArrayBuffer`. That being said,
what you feed to hash, to encrypt, are `ArrayBuffer`s. This is mandatory. The
outputs are mostly also of this type.

For most usages, see `lib/test.js`.

### 1. Random generator

The random generator is located in `util/random.js`. In program, it is
accessible via `crypto.util.srand`. The random generator uses **Salsa20**'s
core function and captures CPU load as default input. You may use the `touch`
method to feed more seeds, like mousemove, or user keypress.

Example 1.1: _to get random bytes_
```javascript
var x = new crypto.util.srand().bytes(1024); // 1024 bytes will be returned
```

### 2. Hash Function

The hash generator is accessible via `hash`, which is found at `hash/hash.js`.
3 major functions are done: simple hash, or calculate Message Authentication
Code(MAC), or use MAC function in PBKDF2 to derive a key.

#### 2.1 To Simply Hash a String

Example 2.1.1 _to get hash_
```javascript
var src = new Uint8Array([1,2,3,4,5,6,7,8]).buffer; // use `ArrayBuffer`.

// choose algorithm: RIPEMD160, alternative: BLAKE2s, WHIRLPOOL.
var result = crypto.hash('RIPEMD160').hash(src);

// see: result.hex, or result.buffer
```

Currently supported algorithms are `RIPEMD160`, `BLAKE2s`, `WHIRLPOOL`. You may
also provide the second argument to give the algorithm some hint:

Example 2.1.2 _to get BLAKE2s generate shorter hash_
```javascript
var src = ... // see Example 2.1.1

// max. digest length of BLAKE2s should be 32. It is possible to choose a
// shorter digest length.
var result = crypto.hash('BLAKE2s', {length: 4}).hash(src);
```

#### 2.2 To Generate MAC

MAC are generated by default using HMAC. But for algorithms like `BLAKE2s`,
there's a internal built mechanism to generate that. It will overwrite HMAC.

Parameters passing to hash functions, like Example 2.1.2 showed, is also valid
here.

Example 2.2 _to get a MAC result_
```javascript
var src = ... // see Example 2.1.1
var key = new Uint8Array([1,2,3]).buffer;
var result = crypto.hash('BLAKE2s', {length: 31}).mac(src, key);
// result is returned in result.hex and result.buffer - 2 formats.
```
