(function(){
//////////////////////////////////////////////////////////////////////////////

function beginTest(crypto){

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
    var begin, end, between = {};
    function reg(name){
        between[name] = new Date().getTime();
    };

    begin = new Date().getTime();


    var s = (func(reg)?'  OK  ':'FAILED');
    end = new Date().getTime();
    var timediff = end - begin;
    s = '[' + s + '] Test ' + name + ' done within ' + timediff + 'ms.';

    for(var each in between){
        s += '\n @ ' + (between[each] - begin) + '  ' + each;
    };

    crypto.util.log.notice(s);
};

var genericStr = '朱,聿𪚥 abc 平雪迎骨水直',
    plaintext1K = new crypto.util.srand().bytes(1024),
    plaintext10K = new crypto.util.srand().bytes(10240);

crypto.util.log.notice('----------------------');

test('Generating a UUID', function(){
    var uuid = crypto.util.uuid();
    return /^[0-9a-f]{8}\-([0-9a-f]{4}\-){3}[0-9a-f]{12}$/i.test(uuid);
});

test('Encoding and Decoding String in HEX', function(){
    var general = crypto.util.encoding(genericStr);
    var hex = general.toHEX();
    var again = crypto.util.encoding(hex, 'HEX');
    return (genericStr == again.toUTF16());
});

test('Encoding and Decoding String in Base32', function(){
    var src = genericStr;
    var general = crypto.util.encoding(src);
    var b32 = general.toBase32();
    var again = crypto.util.encoding(b32, 'base32');
    return (src == again.toUTF16());
});

test('Compressing and Decompressing String', function(){
    var src = 'TOBEORNOTTOBEORTOBEORNOT朱,聿𪚥 abc 平雪迎骨水直';
    src = crypto.util.encoding(src).toArrayBuffer();

    var comp = crypto.util.compress(src);
    var decomp = crypto.util.decompress(comp);

    return crypto.util.buffer.equal(src, decomp);
});

test('Internal self-test', function(){
    var ret = crypto.test();
    console.log(JSON.stringify(ret));
    return ret.conclusion;
});

test('Random Generator', function(){
    var x = new crypto.util.srand().bytes(1024);
    return 1024 == x.byteLength;
});

test('Symmetric Cipher: Encryption and Decryption of Very Short Data', function(){
    var src = new crypto.util.srand().bytes(128);

    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);

    var ciphertext = encryptor.encrypt(src);
    var decrypted = decryptor.decrypt(ciphertext);

    console.log(ciphertext.byteLength);
    return crypto.util.buffer.equal(decrypted, src) &&
        ciphertext.byteLength < 256;
});

test('Symmetric Cipher: Encryption and Decryption of 10kB data', function(){
    var key = new crypto.util.srand().bytes(128);
    var encryptor = new crypto.cipher.symmetric().key(key),
        decryptor = new crypto.cipher.symmetric().key(key);

    var ciphertext = encryptor.encrypt(plaintext10K);
    var decrypted = decryptor.decrypt(ciphertext);

    return crypto.util.buffer.equal(decrypted, plaintext10K);
});

test('Asymmetric Cipher: Public Key Derivation', function(r){
    var secret = new crypto.util.srand().bytes(128);
    r('random secret key generated');
    var asym = crypto.cipher.asymmetric('NECRAC128');
    r('asymmetric cipher initialized');
    asym.setPrivateKey(secret);
    r('private key set');
    var pubkey = asym.getPublicKey();
    console.log(crypto.util.encoding(pubkey).toBase32());
    r('public key got');
    return crypto.util.encoding(pubkey).toHEX().length > 20;
});





var algorithm = 'NECRAC128', algbyte = 32;
var secret = new crypto.util.srand().bytes(algbyte);
var asym1 = crypto.cipher.asymmetric(algorithm),
    asym2 = crypto.cipher.asymmetric(algorithm);
var wrong10K = crypto.util.buffer.xor(
    new crypto.util.srand().bytes(10240),
    plaintext10K
);
asym1.setPrivateKey(secret);
asym2.setPublicKey(asym1.getPublicKey());

test('Asymmetric Cipher: Signing and Verifying of 10kB', function(){
    var signature = asym1.sign(plaintext10K);
    return (
        asym2.verify(plaintext10K, signature)
        && !asym2.verify(wrong10K, signature)
    );
});


test('Asymmetric Cipher: Encrypting and Decrypting of 1kB', function(r){
    var ciphertext = asym2.encrypt(plaintext1K);
    r('encrypted');
    var decrypted = asym1.decrypt(ciphertext);
    r('decrypted');
    var result = crypto.util.buffer.equal(decrypted, plaintext1K);
    r('verified');
    return result;
});

test('Asymmetric Cipher: Encrypting and Decrypting of 10kB', function(){
    var ciphertext = asym2.encrypt(plaintext10K);
    var decrypted = asym1.decrypt(ciphertext);
    return crypto.util.buffer.equal(decrypted, plaintext10K);
});




test('Enigma/Identity: Generation, Reload and Test', function(r){
    try{
        var origIdentity = crypto.enigma.identity();
        origIdentity.generate('Test Key For This', {algorithm: 'NECRAC128'});
        r('generate');
        var privIdentity = crypto.enigma.identity(),
            pubIdentity = crypto.enigma.identity();
        var dummyKey = new Uint32Array([0, 0, 0, 0, 0, 0, 0, 0]).buffer;
        var msg = new Uint32Array([0, 1, 2, 3]).buffer;
        privIdentity.loadPrivate(
            origIdentity.exportPrivate(dummyKey),
            dummyKey
        );
        r('private identity reloaded');
        pubIdentity.loadPublic(origIdentity.exportPublic());
        r('public identity reloaded');
        var ciphertext = pubIdentity.encrypt(msg);
        return crypto.util.buffer.equal(
            privIdentity.decrypt(ciphertext),
            msg
        );
    } catch(e){
        return false;
    };
    return true;
});

test('Enigma/Message: Encrypt and Decrypt', function(r){
    var alice = crypto.enigma.identity(),
        bob = crypto.enigma.identity();
    alice.generate('identity for alice');
    bob.generate('identity for bob');

    var sendMsg = crypto.enigma.message();
    var plaintext = new Uint8Array([0,1,2,3]).buffer;
    sendMsg.write(plaintext)
    sendMsg.encrypt(alice);
    sendMsg.encrypt(bob);
    var ciphertext = sendMsg.done();
    r('encrypt to Alice and Bob');

    var recvMsg = crypto.enigma.message();
    recvMsg.read(ciphertext);
    recvMsg.decrypt(alice);
    r('decrypt by Alice');
    return crypto.util.buffer.equal(recvMsg.getPlaintext(), plaintext);
});

crypto.util.log.notice('----------------------');
crypto.util.log.notice('All tests done.');


if('undefined' != typeof document)
    document.close();
else
    process.exit();
};
/****************************************************************************/

if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var crypto = require('./neoatlantis-crypto-js.js');
    beginTest(crypto);
} else {
    require(['neoatlantis-crypto-js'], beginTest);
};
//////////////////////////////////////////////////////////////////////////////
})();
