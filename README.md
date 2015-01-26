NeoAtlantis JS Crypto Library
=============================

> **NOTICE**: "Do not use home brewed library like this!" _Follow the
> pedagogical instructions and use conservative and well-behaved things like
> OpenSSL and enjoy the Spagetti and Heartbleed Flaw!_

> **This code is freshly out of the oven. It does works, but I need to improve
> it a lot. Do not use it to treat important files or data since
> un-backward-compatiable modifications are predictable.**

This is a JavaScript implemented library for doing a rich bunch of
cryptographic tasks(listed [below](#overview)).

The library is self-contained. All stated functions have native
implementations. However under extensions, the library can also detect and use
local functions for accelerating, for example when under NodeJS and doing
hashing, or under [a python based fullscreen webkit browser] [FSB] and use an
external random source.

[FSB]: https://github.com/neoatlantis/enigma-fsbrowser

Overview
--------

> Rather sophisticated documentations available in different languages, and there
> will be no updates here. Please move to:
>
> * [English version](https://neoatlantis.github.io/%E7%94%B5%E5%B7%A5%E7%94%B5%E5%AD%90%E5%8F%8A%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF/2014/11/01/neoatlantis-crypto-js-en.html)
> * [简体中文文档](https://neoatlantis.github.io/%E7%94%B5%E5%B7%A5%E7%94%B5%E5%AD%90%E5%8F%8A%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF/2014/11/01/neoatlantis-crypto-js-zh.html)

Here is only a brief overview of functions provided by this library.

* **Hash** Whirlpool, truncated length possible. Under NodeJS acceleration
  using native OpenSSL interface possible.
* **Cipher**
    * **Symmetric** Cascaded 512 bit cipher(on Salsa20/20 and ChaCha20/20).
    * **Asymmetric** ECDH and ECDSA(composed to one system).
* **Utilities**
    * Encoding conversion between UTF16, HEX, Base64 and Base32.
    * ArrayBuffer operation: compare, xor, concat, reverse.
    * Random bytes generator.
    * UUID generator.
    * Variable type detection.
    * Symmetric encryption secured localStorage interface(undergoing).
    * **Data structure serialization** supporting serialization and reverse on
      a predefined key-value data structure. Types including binary, boolean,
      constant, datetime, enumeration, array of binaries.
* **Enigma** a system like PGP(but not compatible).
    * generating and reading `identity`(like PGP key).
    * generating `messages`(encrypted to a given `identity`, and/or signed with
      another `identity`).
    * **Interface** high-level APIs for a nearly completed PGP system.
        * basing on localStorage compatible storage
        * users may just connect API questions and user answers using their
          UI.
* **Self-tests** (undergoing) a collection of comprehensive test vectors on the
 building blocks of this system.
    * hash(Whirlpool)
    * Salsa20
    * ChaCha20
    * ...
