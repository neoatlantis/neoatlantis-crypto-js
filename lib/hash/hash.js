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
            ret = _genericHMAC(
                doer.hash,
                keyBuffer,
                dataBuffer,
                doer.blockSize
            );

        return _genReturn(ret);
    };

    return this;
};

///////////////////////////// HMAC ALGORITHM /////////////////////////////////

function _genericHMAC(hasher, keyBuffer, dataBuffer, blockSizeBytes){
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
    dataBuffer = new Uint8Array(dataBuffer);
    // now is keyBuffer and dataBuffer of type Uint8Array.
  
    var o_key_pad = new Uint8Array(blockSizeBytes);
    var i_key_pad = new Uint8Array(blockSizeBytes);
    for(var i=0; i<blockSizeBytes; i++){
        o_key_pad[i] = 0x5c ^ keyBuffer[i];
        i_key_pad[i] = 0x36 ^ keyBuffer[i];
    };

    // TODO use a tool function to concat buffer.
    var innen = new Uint8Array(i_key_pad.length + dataBuffer.length);
    for(var i=0; i<innen.length; i++){
        if(i < i_key_pad.length)
            innen[i] = i_key_pad[i];
        else
            innen[i] = dataBuffer[i - i_key_pad.length];
    };

    var hashInnen = new Uint8Array(hasher(innen));

    var outer = new Uint8Array(o_key_pad.length + hashInnen.length);
    for(var i=0; i<outer.length; i++){
        if(i < o_key_pad.length)
            outer[i] = o_key_pad[i];
        else
            outer[i] = hashInnen[i - o_key_pad.length];
    };

    return hasher(outer);
};

///////////////////////////// PBKDF2 IMPLEMENTATION //////////////////////////

function PBKDF2(passwordBuffer, saltBuffer, iterations, keylen){

    /* shortcut: use NodeJS's library to calculate this. */

    // FIXME the alternative implementation should be compatiable to this.
    if(true)// === CONTROL_USE_NODE_HASH_LIBRARY)
        return $.node.crypto.pbkdf2Sync(
            passwordBuffer,
            saltBuffer,
            iterations,
            keylen
        ); 

    /* alternative implementation. slow, XXX not compatiable with NodeJS! */

    var DKs = [], count = Math.ceil(keylen / 20);
    for(var i=0; i<count; i++){
        // in each loop, calculate 
        // T_i = F(pwd, salt, c, i) = U1^U2^U3...^Uc, c = iterations

        var Tret = false;

        var appendix = new $.node.buffer.Buffer(4);
        appendix.writeInt32BE(i, 0);
        var prevU = new $.node.buffer.Buffer.concat([saltBuffer, appendix]);

        for(var j=0; j<iterations; j++){
            // use SHA1-HMAC.
            var U = SHAHMAC(160, passwordBuffer, prevU);

            if(false === Tret){
                // save this first U into result.
                Tret = U;
            } else {
                // perform XOR
                for(var k=0; k<20; k++)
                    Tret.writeUInt8(U.readUInt8(k) ^ Tret.readUInt8(k), k);
            };

            // save this U for next round
            prevU = U;
        };

        // Tret is appended to DKs
        DKs.push(Tret);
    };

    return new $.node.buffer.Buffer.concat(DKs).slice(0, keylen);
};





function hashInitializer(moduleOrFalse){
    // register the module, or if it is false, return the hasher.
    if(false === moduleOrFalse) return hash;

    var test = new moduleOrFalse();

    hashFuncRegTable[test.name] = {
        constructor: moduleOrFalse,
        blockSize: test.blockSize,
        name: test.name,
    };
};



if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = hashInitializer;
} else {
    define([], function(){ return hashInitializer; });
};
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
