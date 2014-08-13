var crypto = require('./lib/enigma-jscrypto.js');

function test(name, func){
    var s = (func()?'  OK  ':'FAILED');
    s = '[' + s + '] Test item: ' + name;
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

crypto.util.log.notice('----------------------');
//////////////////////////////////////////////////////////////////////////////
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

test('Symmetric Cipher Encryption and Decryption', function(){
    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);
    var plaintext = new crypto.util.srand().bytes(97);

    var ciphertext = encryptor.encrypt(plaintext);
    var decrypted = decryptor.decrypt(ciphertext);

    return crypto.util.buffer.equal(decrypted, plaintext);
});
