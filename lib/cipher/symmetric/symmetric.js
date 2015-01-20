/*
 * NeoAtlantis Cascade Symmetric Cipher (with 512-bit key)
 * =======================================================
 *
 * This aims at doing a cascaded symmetric cipher for NeoAtlantis. It is a
 * block cipher with a 512-bit key.
 */

(function(tool){
///////////////////////////// IMPLEMENTATION /////////////////////////////////

function NCSC512(){
    var self = this;

    function padding(srcBuffer, blockSize){
        // RFC 5652 Padding, blockSize should be (0, 256).
        var oldlen = srcBuffer.byteLength,
            padlen = blockSize - (oldlen % blockSize),
            sumlen = oldlen + padlen,
            oldView = new Uint8Array(srcBuffer),
            newBuffer = new Uint8Array(sumlen);
        for(var i=0; i<sumlen; i++)
            if(i<oldlen)
                newBuffer[i] = oldView[i];
            else
                newBuffer[i] = padlen;
        return newBuffer.buffer;
    };

    function unpadding(buffer){
        var view = new Uint8Array(buffer);
        var padlen = view[view.length - 1];

        if(view.length < padlen) return null;
        return buffer.slice(0, buffer.byteLength - padlen);
    };


    function compress(buffer){
        return buffer; // TODO
    };

    function uncompress(buffer){
        return buffer; // TODO
    };

    //////////////////////////////////////////////////////////////////////

    var keyBuffer = null;

    /* derivation of `round` keys */
    function deriveKey(keyBuf, saltBuf, keyCount){
        var eachKeyLen = new tool.get('hash')().getOutputBytesLength();
        var stream = new tool.get('hash')(64).pbkdf2(
            keyBuf,
            saltBuf,
            4,   // This is to randomize the result, but not to slow down
                 // a rainbow table search. You still need to pass a 512-bit
                 // key into `keyBuf`, which may be done by a slowing-down
                 // process.
            keyCount * eachKeyLen
        );
        var result = new Array(keyCount);
        for(var i=0; i<keyCount; i++)
            result[i] = new tool.get('hash')().hash(
                stream.slice(i * eachKeyLen, (i+1) * eachKeyLen)
            ).buffer;
        return result;
    };

    var encrypt = function(dataBuffer){
        if(!tool.get('util.type')(dataBuffer).isArrayBuffer())
            throw new Error('invalid-parameter');

        // get random bytes
        var saltBuf = new tool.get('util.srand')().bytes(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, saltBuf, 5);

        // generate MAC for plaintext and attach to plaintext
        var MAC = new tool.get('hash')(6)
            .mac(dataBuffer, keys[0])
            .buffer
        ;
        dataBuffer = tool.get('util.buffer').concat([MAC, dataBuffer]);

        // cascade encryption
        var result = dataBuffer;
        result = compress(result);
        result = padding(result, 16);
        result = Salsa20Encrypt(keys[1], result);
        result = AESECBEncrypt(keys[2], result);

        return tool.get('util.buffer').concat([saltBuf, result]);
    };

    var decrypt = function(dataBuffer){
        if(!(
            tool.get('util.type')(dataBuffer).isArrayBuffer() &&
            dataBuffer.byteLength >= 26
        ))
            throw new Error('invalid-parameter');

        // get salt
        var salt = dataBuffer.slice(0, 10);
        dataBuffer = dataBuffer.slice(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, salt, 5);

        // cascade decryption
        var result = dataBuffer;
        result = AESECBDecrypt(keys[2], result);
        result = Salsa20Decrypt(keys[1], result);
        result = unpadding(result, 16);
        if(!tool.get('util.type')(result).isArrayBuffer()) return null;
        result = uncompress(result);
        if(!tool.get('util.type')(result).isArrayBuffer()) return null;

        // verify the first 6 byte MAC string
        var gotMAC = result.slice(0, 6);
        result = result.slice(6);
        var foundMAC =  new tool.get('hash')(6)
            .mac(result, keys[0])
            .buffer
        ;

        if(tool.get('util.buffer').equal(gotMAC, foundMAC)) return result;
        return null;
    };

    /* initially exposed functions */

    this.key = function(keyBuf){
        if(!tool.get('util.type')(keyBuf).isArrayBuffer())
            throw new Error('invalid-key');
        keyBuffer = keyBuf;

        delete self.key;
        self.encrypt = encrypt;
        self.decrypt = decrypt;

        return self;
    };

    return this;
};

//////////////////// ENCRYPTION CALLS AND IMPLEMENTATIONS ////////////////////

/* AES Encrypt & Decrypt in ECB mode */
var AESECBEncrypt = function(key, plaintext){
    try{
        var aes = tool.get('cipher.symmetric.aes').constructor;
        return aes().key(key).encrypt(plaintext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-encrypt', e);
    };
};

var AESECBDecrypt = function(key, ciphertext){
    try{
        var aes = tool.get('cipher.symmetric.aes').constructor;
        return aes().key(key).decrypt(ciphertext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-decrypt', e);
    };
};

/* Salsa20 Encrypt & Decrypt */
var Salsa20Encrypt = function(key, plaintext){
    try{
        var salsa20 = tool.get('cipher.symmetric.salsa20').constructor;
        return salsa20().key(key).encrypt(plaintext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-encrypt');
    };
};

var Salsa20Decrypt = function(key, ciphertext){
    try{
        var salsa20 = tool.get('cipher.symmetric.salsa20').constructor;
        return salsa20().key(key).decrypt(ciphertext) ;
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-decrypt', e);
    };
};

function exporter(){ return new NCSC512(); };
tool.set('cipher.symmetric', exporter);
tool.exp('cipher.symmetric', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
