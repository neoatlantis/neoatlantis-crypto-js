/*
 * NeoAtlantis Cascade Symmetric Cipher (with 512-bit key)
 * =======================================================
 *
 * This aims at doing a cascaded symmetric cipher for NeoAtlantis. It is a
 * block cipher with a 512-bit key. 
 *
 * The result is designed to fill a requirement, that a single
 * bit's failure in ciphertext will destroy the possibility of decrypting any
 * part of the ciphertext -- before and after: we do this by applying CBC mode
 * 2 times in encryption, and between them a reversal of intermediate result.
 * A failure will lead to destroying the remaining part's decryption in the
 * first round, whose result is the leading part in the second round and render
 * it into impossible.
 */

(function(root){
///////////////////////////// IMPLEMENTATION /////////////////////////////////

var cipherToolkit = {};


function NCSC512(){
    var self = this;

    function padding(srcBuffer, blockSize){
        // RFC 5652 Padding, blockSize should be (0, 256).
        var oldlen = srcBuffer.byteLength,
            padlen = blockSize - oldlen % blockSize,
            oldView = new Uint8Array(srcBuffer),
            newBuffer = new Uint8Array(oldlen + padlen);
        for(var i=0; i<newBuffer.length; i++)
            if(i<oldlen)
                newBuffer[i] = oldView[i];
            else
                newBuffer[i] = padlen;
        return newBuffer.buffer;
    };

    function unpadding(buffer){
        var view = new Uint8Array(buffer);
        var padlen = view[view.length - 1];
        
        if(view.length < padlen) return false;
        return buffer.slice(0, buffer.byteLength - padlen);
    };

    //////////////////////////////////////////////////////////////////////

    var keyBuffer = null;

    /* derivation of `round` keys */
    function deriveKey(keyBuf, saltBuf, keyCount){
        var eachKeyLen = 256;
        
        var stream = new root.hash('BLAKE2s').pbkdf2(
            keyBuf,
            saltBuf,
            128, // This is to randomize the result, but not to slow down
                 // a rainbow table search. You still need to pass a 512-bit
                 // key into `keyBuf`, which may be done by a slowing-down
                 // process.
            keyCount * eachKeyLen
        );

        var result = new Array(keyCount);
        for(var i=0; i<keyCount; i++)
            result[i] = new root.hash('WHIRLPOOL').digest(
                stream.slice(i * eachKeyLen, (i+1) * eachKeyLen)
            );
        return result;
    };

    var encrypt = function(dataBuffer){
        if(!root.util.type(dataBuffer).isArrayBuffer())
            throw new Error('invalid-parameter');

        // get random bytes
        var salt = root.util.random.bytes(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, salt, 5);

        // generate MAC for plaintext and attach to plaintext
        var MAC = new root.hash('BLAKE2s', {length: 6})
            .mac(dataBuffer, keys[0])
            .digest()
        ;
        dataBuffer = root.util.buffer.concat([MAC, dataBuffer]);
        
        // cascade encryption
        var result = dataBuffer;
        // TODO COMPRESS
        result = padding(result, 16);
        result = Salsa20Encrypt(keys[1], result);
        result = AESECBEncrypt(keys[2], result);
        result = CamelliaCBCEncrypt(keys[3], result);
        reverseText(result);
        result = CamelliaCBCEncrypt(keys[4], result);

        return root.util.buffer.concat([salt, result]);
    };

    var decrypt = function(dataBuffer){
        if(!(
            root.util.type(dataBuffer).isArrayBuffer() &&
            dataBuffer.length > 32
        ))
            throw new Error('invalid-parameter');

        // get salt 
        var salt = dataBuffer.slice(0, 10);
        dataBuffer = dataBuffer.slice(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, salt, 5);

        // cascade decryption
        var result = dataBuffer;
        result = CamelliaCBCDecrypt(keys[4], result);
        reverseText(result);
        result = CamelliaCBCDecrypt(keys[3], result);
        result = AESECBDecrypt(keys[2], result);
        result = Salsa20Decrypt(keys[1], result);
        result = unpadding(plaintext, 16);
        // TODO result = uncompress(result);
        
        // verify the first 6 byte MAC string
        var gotMAC = result.slice(0, 6);
        result = result.slice(6);
        var foundMAC =  new root.hash('BLAKE2s', {length: 6})
            .mac(result, keys[0])
            .digest()
        ;

        if(root.util.buffer.equal(gotMAC, foundMAC)) return result;
        return null;
    };

    /* initially exposed functions */

    this.key = function(keyBuf){
        if(!root.util.type(keyBuf).isArrayBuffer())
            throw new Error('invalid-key');
        keyBuffer = keyBuf;
        
        self.encrypt = encrypt;
        self.decrypt = decrypt;
        
        return self;
    };

    return this;
};

//////////////////// ENCRYPTION CALLS AND IMPLEMENTATIONS ////////////////////

var reverseText = function(buffer){
    var max = buffer.length - 1, mid = Math.floor(max / 2);
    var r = max, t;
    for(var l=0; l<=mid; l++){
        t = buffer[l];
        buffer[l] = buffer[r];
        buffer[r] = t;
        r -= 1;
    };
};

/* AES Encrypt & Decrypt in ECB mode */
var AESECB = cipherToolkit["AESECB"];

var AESECBEncrypt = function(key, plaintext){
    try{
        return AESECB().key(key).encrypt(plaintext);
    } catch(e){
        return $.error('unable-to-encrypt', e);
    };
};

var AESECBDecrypt = function(key, ciphertext){
    try{
        return AESECB().key(key).decrypt(ciphertext);
    } catch(e){
        return $.error('unable-to-decrypt', e);
    };
};

/* Salsa20 Encrypt & Decrypt */
var Salsa20 = cipherToolkit["Salsa20"];

var Salsa20Encrypt = function(key, plaintext){
    try{
        return Salsa20(20).key(key).encrypt(plaintext);
    } catch(e){
        return $.error('unable-to-encrypt', e);
    };
};

var Salsa20Decrypt = function(key, ciphertext){
    try{
        return Salsa20(20).key(key).decrypt(ciphertext);
    } catch(e){
        return $.error('unable-to-decrypt', e);
    };
};

/* Camellia Encrypt & Decrypt */
var CamelliaCBC = cipherToolkit["CAMELLIA"];

var CamelliaCBCEncrypt = function(key, plaintext){
    try{
        return CamelliaCBC().key(key).encrypt(plaintext);
    } catch(e){
        return $.error('unable-to-encrypt', e);
    };
};

var CamelliaCBCDecrypt = function(key, ciphertext){
    try{
        return CamelliaCBC().key(key).decrypt(ciphertext);
    } catch(e){
        return $.error('unable-to-decrypt', e);
    };
};




function cipherInitializer(cipherConf){
    if(cipherConf){
        root.util.log.notice('Load symmetric cipher component: [' + cipherConf.name + ']'); //     XXX
        cipherToolkit[cipherConf.name] = cipherConf;
        return;
    };

    if(
        'undefined' != typeof cipherToolkit['AESECB'] &&
        'undefined' != typeof cipherToolkit['CAMELLIA'] &&
        'undefined' != typeof cipherToolkit['Salsa20/20']
    ){
        root.util.log.notice('Symmetric cascading cipher [NCSC512] ready.');
        return NCSC512;
    };
    
    return null;
};


if('undefined' != typeof module && 'undefined' != typeof module.exports)
    module.exports = cipherInitializer;
else
    define([], function(){
        return cipherInitializer;
    });

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
