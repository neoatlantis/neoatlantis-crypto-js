/*
 * Hash Function Caller
 * ====================
 *
 * `__enigma_jscrypto__.hash`  is a function, usage like:
 *
 *      __enigma_jscrypto__.hash(ALGORITHM).hash(STRING).digest()
 *                                                      .hexdigest()
 *                                         .mac(STRING, KEY)
 *                                                      .digest()
 *                                                      .hexdigest()
 *
 * The MAC procedure will be mostly done using HMAC. But since BLAKE2s
 * provides an internal mechanism, it will then be used.
 */
(function(root){
//////////////////////////////////////////////////////////////////////////////

// holds the registered algorithms
var hashFuncRegTable = {};


function hash(algorithmName){
    var self = this;
    
    this.algorithms = Object.keys(hashFuncRegTable);

    if(this.algorithms.indexOf(algorithmName) < 0)
        throw new Error('hash-algorithm-unknown');
    var choosenAlgorithm = hashFuncRegTable[algorithmName];

    function _genReturn(retArrayBuffer){
        return {
            hex: root.util.encoding(retArrayBuffer).toHEX(),
            buffer: retArrayBuffer,
        };
    };

    this.hash = function(dataBuffer){
        if(!root.util.type(dataBuffer).isArrayBuffer()) 
            throw Error('invalid-parameter');

        var ret = new choosenAlgorithm.constructor().hash(dataBuffer);
        return _genReturn(ret);
    };

    this.mac = function(dataBuffer, keyBuffer){
        if(!(
            root.util.type(keyBuffer).isArrayBuffer() &&
            root.util.type(dataBuffer).isArrayBuffer()
        ))
            throw Error('invalid-parameter');

        var ret;

        var doer = new choosenAlgorithm.constructor();
        if(root.util.type(doer.mac).isFunction())
            // when there is a built-in MAC function
            ret = doer.mac(dataBuffer, keyBuffer);
        else
            // use HMAC method to calculate that
            ret = _HMAC(
                doer.hash,
                keyBuffer,
                dataBuffer,
                doer.blockSize
            );

        return _genReturn(ret);
    };

    this.pbkdf2 = function(keyBuf, saltBuf, iterations, length){ 
        if(!(
            root.util.type(keyBuf).isArrayBuffer() &&
            root.util.type(saltBuf).isArrayBuffer() &&
            iterations > 0 &&
            length > 0
        ))
            throw Error('invalid-parameter');

        return _PBKDF2(
            self.mac,
            choosenAlgorithm.digestSize,
            keyBuf,
            saltBuf,
            iterations,
            length
        );
    };

    return this;
};

///////////////////////////// HMAC ALGORITHM /////////////////////////////////

function _HMAC(hasher, keyBuffer, dataBuffer, blockSizeBytes){
    if(keyBuffer.byteLength > blockSizeBytes){
        // keys longer than blocksize are shortened
        keyBuffer = new Uint8Array(hasher(keyBuffer));
    } else if(keyBuffer.byteLength < blockSizeBytes){
        // keys shorter than blocksize are zero-padded
        var padBuf = new Uint8Array(blockSizeBytes),
            viewBuf = new Uint8Array(keyBuffer);
        for(var i=0; i<padBuf.length; i++){
            if(i < keyBuffer.byteLength)
                padBuf[i] = viewBuf[i];
            else
                padBuf[i] = 0;
        };
        keyBuffer = padBuf;
    };
    // now is keyBuffer of type Uint8Array.
  
    var o_key_pad = new Uint8Array(blockSizeBytes);
    var i_key_pad = new Uint8Array(blockSizeBytes);
    for(var i=0; i<blockSizeBytes; i++){
        o_key_pad[i] = 0x5c ^ keyBuffer[i];
        i_key_pad[i] = 0x36 ^ keyBuffer[i];
    };

    var innen = root.util.buffer.concat([i_key_pad.buffer, dataBuffer]),
        hashInnen = hasher(innen);

    var outer = root.util.buffer.concat([o_key_pad.buffer, hashInnen]),
        hashOuter = hasher(outer);
    return hashOuter;
};

///////////////////////////// PBKDF2 IMPLEMENTATION //////////////////////////

function _PBKDF2(
    macFunc,
    hashLength,
    passwordBuffer,
    saltBuffer,
    iterations,
    keylen
){
    var blockCount = Math.ceil(keylen / hashLength);
    var DKs = new Array(blockCount);

    for(var i=0; i<blockCount; i++){
        // in each loop, calculate 
        // T_i = F(pwd, salt, c, i) = U1^U2^U3...^Uc, c = iterations

        var Tret = false;

        var appendix = new Uint32Array([i]);
        var prevU = root.util.buffer.concat([saltBuffer, appendix.buffer]);

        for(var j=0; j<iterations; j++){
            // use MAC
            var U = macFunc(passwordBuffer, prevU).buffer;

            if(false === Tret)
                // save this first U into result.
                Tret = U;
            else
                // perform XOR
                Tret = root.util.buffer.xor(U, Tret);

            // save this U for next round
            prevU = U;
        };

        DKs[i] = Tret;
    };

    return root.util.buffer.concat(DKs).slice(0, keylen);
};





function hashInitializer(moduleOrFalse){
    // register the module, or if it is false, return the hasher.
    if(false === moduleOrFalse) return hash;

    var test = new moduleOrFalse();

    hashFuncRegTable[test.name] = {
        constructor: moduleOrFalse,
        blockSize: test.blockSize,
        digestSize: test.digestSize,
        name: test.name,
    };

    root.util.log.notice('Load hash algorithm: [' + test.name + ']');//                            XXX
};



if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = hashInitializer;
} else {
    define([], function(){ return hashInitializer; });
};
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
