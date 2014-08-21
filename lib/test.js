(function(){
//////////////////////////////////////////////////////////////////////////////

function beginTest(crypto){

//console.log(crypto);
/****************************************************************************/
if('undefined' != typeof document){
    crypto.util.log.notice = function(i){
        document.write('<font color="#0000FF">' + i + '</font><br />');
    };
    crypto.util.log.error = function(i){
        document.write('<font color="#AA0000">' + i + '</font><br />');
    };
};

function test(name, func){
    var begin, end;
    begin = new Date().getTime();
    var s = (func()?'  OK  ':'FAILED');
    end = new Date().getTime();
    var timediff = end - begin;
    s = '[' + s + '] Test ' + name + ' done within ' + timediff + 'ms.';
    crypto.util.log.notice(s);
};

var theFoxEog = crypto.util.encoding(
    '54686520717569636b2062726f776e20666f78206a7' +
    '56d7073206f76657220746865206c617a7920656f67', 
    'hex'
).toArrayBuffer();
var theFoxDog = crypto.util.encoding(
    '54686520717569636b2062726f776e20666f78206a7' +
    '56d7073206f76657220746865206c617a7920646f67', 
    'hex'
).toArrayBuffer();
var plaintext10K = new crypto.util.srand().bytes(10240),
    plaintext100K = new crypto.util.srand().bytes(102400),
    plaintext1M = new crypto.util.srand().bytes(1048576);

crypto.util.log.notice('----------------------');

test('Random Generator', function(){
    var x = new crypto.util.srand().bytes(1024);
    return 1024 == x.byteLength;
});

test('Hash Function (RIPEMD160)', function(){
    return (
        crypto.util.buffer.equal(
            new crypto.hash('RIPEMD160').hash(
                new Uint8Array([]).buffer
            ).buffer,
            crypto.util.encoding(
                '9c1185a5c5e9fc54612808977ee8f548b2258d31', 
                'hex'
            ).toArrayBuffer()
        ) &&
        crypto.util.buffer.equal(
            new crypto.hash('RIPEMD160').hash(
                new Uint8Array([0x61, 0x62, 0x63]).buffer
            ).buffer,
            crypto.util.encoding(
                '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc', 
                'hex'
            ).toArrayBuffer()
        )
    );
});

test('Hash Function (WHIRLPOOL)', function(){
    return ( 
        crypto.util.buffer.equal(
            new crypto.hash('WHIRLPOOL').hash(theFoxDog).buffer,
            crypto.util.encoding(
                'B97DE512E91E3828B40D2B0FDCE9CEB3C4A71F9BEA8' +
                'D88E75C4FA854DF36725FD2B52EB6544EDCACD6F8BE' +
                'DDFEA403CB55AE31F03AD62A5EF54E42EE82C3FB35',
                'hex'
            ).toArrayBuffer()
        ) &&
        crypto.util.buffer.equal(
            new crypto.hash('WHIRLPOOL').hash(theFoxEog).buffer,
            crypto.util.encoding(
                'C27BA124205F72E6847F3E19834F925CC666D097416' +
                '7AF915BB462420ED40CC50900D85A1F923219D83235' +
                '7750492D5C143011A76988344C2635E69D06F2D38C',
                'hex'
            ).toArrayBuffer()
        )
    );
});

test('Hash Function (BLAKE2s)', function(){
    return ( 
        crypto.util.buffer.equal(
            new crypto.hash('BLAKE2s').hash(theFoxDog).buffer,
            crypto.util.encoding(
                '606beeec743ccbeff6cbcdf5d5302aa8' +
                '55c256c29b88c8ed331ea1a6bf3c8812',
                'hex'
            ).toArrayBuffer()
        ) &&
        crypto.util.buffer.equal(
            new crypto.hash('BLAKE2s', {length: 16}).hash(theFoxEog).buffer,
            crypto.util.encoding(
                '1bf0ddcbac60e4b706a0a96aaf521eee',
                'hex'
            ).toArrayBuffer()
        )
    );
});

test('Symmetric Cipher: Encryption and Decryption of 10kB data', function(){
    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);

    var ciphertext = encryptor.encrypt(plaintext10K);
    var decrypted = decryptor.decrypt(ciphertext);

    // FIXME under firefox not working. decrypt returned null.

    return crypto.util.buffer.equal(decrypted, plaintext10K);
});


test('Symmetric Cipher: Encryption and Decryption of 100kB data', function(){
    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);

    var ciphertext = encryptor.encrypt(plaintext100K);
    var decrypted = decryptor.decrypt(ciphertext);

    // FIXME under firefox not working. decrypt returned null.

    return crypto.util.buffer.equal(decrypted, plaintext100K);
});


test('Symmetric Cipher: Encryption and Decryption of 1MB data', function(){
    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);

    var ciphertext = encryptor.encrypt(plaintext1M);
    var decrypted = decryptor.decrypt(ciphertext);

    // FIXME under firefox not working. decrypt returned null.

    return crypto.util.buffer.equal(decrypted, plaintext1M);
});

test('Asymmetric Cipher: Public Key Derivation', function(){
    var secret = new crypto.util.srand().bytes(128);
    var asym = crypto.cipher.asymmetric('NECRAC256');
    asym.setPrivateKey(secret);
    return crypto.util.encoding(asym.getPublicKey()).toHEX().length > 20;
});

test('Asymmetric Cipher: Signing and Verifying of 10kB', function(){
    var secret = new crypto.util.srand().bytes(128);
    var asym1 = crypto.cipher.asymmetric('NECRAC256'),
        asym2 = crypto.cipher.asymmetric('NECRAC256');
    asym1.setPrivateKey(secret);
    asym2.setPublicKey(asym1.getPublicKey());

    var wrong = crypto.util.buffer.xor(
            new crypto.util.srand().bytes(10240),
            plaintext10K
        );

    var signature = asym1.sign(plaintext10K);

    return (
        asym2.verify(plaintext10K, signature) &&
        !asym2.verify(wrong, signature)
    );
});

test('Asymmetric Cipher: Encrypting and Decrypting of 10kB', function(){
    var secret = new crypto.util.srand().bytes(128);
    var asym1 = crypto.cipher.asymmetric('NECRAC256'),
        asym2 = crypto.cipher.asymmetric('NECRAC256');
    asym1.setPrivateKey(secret);
    asym2.setPublicKey(asym1.getPublicKey());

    var ciphertext = asym2.encrypt(plaintext10K);

    var decrypted = asym1.decrypt(ciphertext);
    return crypto.util.buffer.equal(decrypted, plaintext10K);
});


crypto.util.log.notice('----------------------');
crypto.util.log.notice('All tests done.');


if(document) document.close();
};
/****************************************************************************/

if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var crypto = require('./enigma-jscrypto.js');
    beginTest(crypto);
} else {
    require(['enigma-jscrypto'], beginTest);
};
//////////////////////////////////////////////////////////////////////////////
})();
