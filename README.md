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

Example: _to get random bytes_
```javascript
var x = new crypto.util.srand().bytes(1024); # 1024 bytes will be returned
```
