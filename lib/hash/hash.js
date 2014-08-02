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
    
    var knownAlgorithms = {
        'md5': 128,
        'sha1': 160,
        'ripemd160': 160,
        'sha256': 256,
        'sha512': 512,
    };

    this.algorithms = Object.keys(hashFuncRegTable);

    this.hash = function(dataBuffer){
        if(!root.util.type(dataBuffer).isArrayBuffer()) 
            throw Error('invalid-parameter');

        algo = algo.toLowerCase().trim();

        var choosenAlgorithm = knownAlgorithms[algo];
        if(!choosenAlgorithm) throw Error('hash-algorithm-unknown');

        if('sha' == algo.substr(0, 3)){
            return SHA(choosenAlgorithm, dataBuffer);
        };

        if('ripemd160' == algo)
            return RIPEMD160(dataBuffer);

        if('md5' == algo)
            return MD5(dataBuffer);

        return Error('not-implemented');
    };

    this.mac = function(keyBuffer, dataBuffer){
        
        if(!(
            root.util.type(keyBuffer).isArrayBuffer() &&
            root.util.type(dataBuffer).isArrayBuffer()
        ))
            throw Error('invalid-parameter');

        algo = algo.toLowerCase().trim();

        var choosenAlgorithm = knownAlgorithms[algo];
        if(!choosenAlgorithm) throw Error('hash-algorithm-unknown');

        if('sha' == algo.substr(0, 3)){
            return SHAHMAC(choosenAlgorithm, keyBuffer, dataBuffer);
        };

        if('ripemd160' == algo){
            return RIPEMD160HMAC(keyBuffer, dataBuffer);
        };

        return Error('not-implemented');
    };

    return this;
};

///////////////////////////// HMAC ALGORITHMS ////////////////////////////////

function _genericHMAC(hasher, keyBuffer, dataBuffer, blockSizeBytes){
    if(keyBuffer.length > blockSizeBytes){
        // keys longer than blocksize are shortened
        keyBuffer = hasher(keyBuffer);
    } else if(keyBuffer.length < blockSizeBytes){
        // keys shorter than blocksize are zero-padded
        var padding = new $.node.buffer.Buffer(
            blockSizeBytes - keyBuffer.length
        );
        padding.fill(0);
        keyBuffer = $.node.buffer.Buffer.concat([keyBuffer, padding]);
    };
   
    var o_key_pad = new $.node.buffer.Buffer(blockSizeBytes);
    o_key_pad.fill(0x5c);

    var i_key_pad = new $.node.buffer.Buffer(blockSizeBytes);
    i_key_pad.fill(0x36);

    for(var i=0; i<blockSizeBytes; i++){
        o_key_pad.writeUInt8(
            o_key_pad.readUInt8(i) ^ keyBuffer.readUInt8(i),
            i
        );
        i_key_pad.writeUInt8(
            i_key_pad.readUInt8(i) ^ keyBuffer.readUInt8(i),
            i
        );
    };
   
    return hasher($.node.buffer.Buffer.concat([
        o_key_pad,
        hasher($.node.buffer.Buffer.concat([
            i_key_pad,
            dataBuffer,
        ])),
    ]));
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
