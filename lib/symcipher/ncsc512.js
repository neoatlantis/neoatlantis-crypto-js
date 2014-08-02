/*
 * NCSC512: NeoAtlantis Cascade Symmetric Cipher - 512
 * ===================================================
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

    function compress(buffer, CB){
        $.node.zlib.gzip(buffer, function(err, res){
            if(err)
                return CB($.error('unable-to-compress'));
            CB(null, res);
        });
    };

    function uncompress(buffer, CB){
        $.node.zlib.gunzip(buffer, function(err, res){
            if(err)
                return CB($.error('unable-to-uncompress'));
            CB(null, res);
        });
    };

    var keyBuffer = null;

    /*
     * Only a derivation of several sub keys used for algorithms.
     * need not to be time-consuming in order to be against Rainbow-Tables.
     */
    function deriveKey(keyBuffer, salt, keyCount){
        var result = [], lastKey = keyBuffer;
        for(var i=0; i<keyCount; i++){
            var hashed = $.crypto.hash.HMAC('SHA512', salt, lastKey);
            result.push(hashed);
            lastKey = hashed;
        };
        return result;
    };

    var encrypt = function(dataBuffer, CB){
        if(!(
            $.tools.type.isBuffer(keyBuffer) &&
            $.tools.type.isBuffer(dataBuffer)
        ))
            CB($.error('invalid-parameter'));

        // get random bytes
        var salt = $.crypto.random.bytes(32);

        // derive keys for cascade algorithms
        // NOTE: because above salt are derived each time and attached at the
        //       final ciphertext output, it is safe to take following derived
        //       key or its part as IV.
        var keys = deriveKey(keyBuffer, salt, 4);

        $.node.async.waterfall([
            function(RR){
                // compress dataBuffer
                compress(dataBuffer, RR);
            },

            function(raw, RR){
                // cascade encryption
                var ciphertext = padding(raw, 16);
                ciphertext = Salsa20Encrypt(keys[0], ciphertext);
                ciphertext = AESECBEncrypt(keys[1], ciphertext);
                ciphertext = CamelliaCBCEncrypt(keys[2], ciphertext);
                reverseText(ciphertext);
                ciphertext = CamelliaCBCEncrypt(keys[3], ciphertext);

                if($.tools.type.isBuffer(ciphertext))
                    RR(null, ciphertext);
                else
                    RR($.error('unable-to-encrypt'));
            },
        ], function(err, ciphertext){
            if(err)
                return CB($.error('unable-to-encrypt'));
            CB(null, new $.node.buffer.Buffer.concat([salt, ciphertext]));
        });
    };

    var decrypt = function(dataBuffer, CB){
        if(!(
            $.tools.type.isBuffer(keyBuffer) &&
            $.tools.type.isBuffer(dataBuffer) &&
            dataBuffer.length > 32
        ))
            CB($.error('invalid-parameter'));

        // get salt 
        var salt = dataBuffer.slice(0, 32);
        dataBuffer = dataBuffer.slice(32);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, salt, 5);

        $.node.async.waterfall([
            function(RR){
                // cascade encryption
                var plaintext = dataBuffer;
                plaintext = CamelliaCBCDecrypt(keys[3], plaintext);
                reverseText(plaintext);
                plaintext = CamelliaCBCDecrypt(keys[2], plaintext);
                plaintext = AESECBDecrypt(keys[1], plaintext);
                plaintext = Salsa20Decrypt(keys[0], plaintext);
                plaintext = unpadding(plaintext, 16);
                if($.tools.type.isBuffer(plaintext))
                    RR(null, plaintext);
                else
                    RR($.error('unable-to-decrypt'));
            },

            function(dataBuffer, RR){
                // uncompress dataBuffer
                uncompress(dataBuffer, RR);
            },
        ], function(err, plaintext){
            if(err)
                return CB($.error('unable-to-decrypt'));
            CB(null, plaintext);
        });
    };

    /* initially exposed functions */

    this.setKey = function(keyBuf){
        if(!$.tools.type.isBuffer(keyBuf))
            throw $.error('invalid-key');
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

/* OpenSSL Encrypt & Decrypt */

var OpenSSLEncrypt = function(algorithm, key, plaintext){
    try{
        var cipher = $.node.crypto.createCipher(algorithm, key);
        var buf1 = cipher.update(plaintext);
        var buf2 = cipher.final();
//                console.log('Encrypt with algorithm [' + algorithm + '].');
        return new $.node.buffer.Buffer.concat([buf1, buf2]);
    } catch (e){
        return $.error('unable-to-encrypt');
    };
};

var OpenSSLDecrypt = function(algorithm, key, ciphertext){
    try{
        var decipher = $.node.crypto.createDecipher(algorithm, key);
        var buf1 = decipher.update(ciphertext);
        var buf2 = decipher.final();
//                console.log('Decrypt with algorithm [' + algorithm + '].');
        return new $.node.buffer.Buffer.concat([buf1, buf2]);
    } catch (e){
        return $.error('unable-to-decrypt');
    };
};

/* AES Encrypt & Decrypt in ECB mode */
var AESECB = require('./_aes.js');

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
var Salsa20 = require('./_salsa20.js');

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
var CamelliaCBC = require('./_camellia.js');

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







// TODO add dependencies
var exporter = function(){
    return new NCSC512();
};

if('undefined' != typeof module && 'undefined' != typeof module.exports)
    module.exports = exporter;
else
    define([], function(){
        return exporter;
    });

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
