Enigma Cryptographic Library in JavaScript
==========================================

> **NOTICE**: "Do not use home brewed library like this!" _Follow the
> pedagogical instructions and use conservative and well-behaved things like
> OpenSSL and enjoy the Spagetti and Heartbleed Flaw!_

> **This code is freshly out of the oven. It does works, but I need to improve
> it a lot. Do not use it to treat important files or data since
> un-backward-compatiable modifications are predictable.**

This is a Javascript implemented library for doing a rich bunch of
cryptographical tasks. It is primarily evolved with the idea separating the
core tasks of **ENIGMA**, a GPG-alike application, into a self-contained
library, but is now more than that. Now this is a library capable of 1)_doing
symmetric encryption/decryption_, 2)_asymmetric encryption/decryption with
ECDSA/ECDH_, 3)_hashing with Whirlpool, RIPEMD-160 and BLAKE2s_, 4)_doing
Base32/Base64/HEX/ArrayBuffer conversion_, and notably, 5)_mimicing the PGP
message format's idea and being used to constructing a PGP-alike system_ as
well as 6)_providing a high-level interactive API to accomplish such
constructions_ on both browser and server(NodeJS). The only disadvantage might
be(I don't think it is, but some may do), that its features mimics the standard
but does not obey them.

The library is designed to protect small pieces of data(several hundred bytes,
up to several megabytes) as secure as possible, but the speed is not at first.
It may be very slow(partly because it is based on JavaScript).

Features included:

* A PGP-like(functionally alike) message center. *Planning and implementing,
  not finished.*

  * Identity manager(generating and reading identity -- public key with
    description).
  * Generating ciphertext with one/more identities and optionally signature.
  * Reading ciphertext, decrypting with given identity.
  
  The trust chain or more features are not planned. The reason is, that the
  author think they are beyond the layer of PGP message center. To show the
  trust of some identity, a special formatted content should be set to the
  PGP message body, not to design a new format of PGP message. This applies 
  to all other applications of PGP, e.g. OTR key authentication or exchange.
  In short, such features are plugins.

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
* All incoming/outcoming parameter are enforced in format `ArrayBuffer`. A tool
  function for converting encoding(HEX, Base64, Base32, ArrayBuffer) is there.

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
