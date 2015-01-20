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
 *                                         .pbkdf2(key, salt, iteration, len)
 *
 * The MAC procedure will be mostly done using HMAC. But since BLAKE2s
 * provides an internal mechanism, it will then be used.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// holds the registered algorithms
var choosenAlgorithmName = 'whirlpool';


function hash(outputBytesLength){
    var self = this;

    var choosenAlgorithm = tool.get('hash.algorithms.' + choosenAlgorithmName);
    var choosenAlgorithmMaxOutput = new choosenAlgorithm().digestSize;
    if(!outputBytesLength || outputBytesLength > choosenAlgorithmMaxOutput)
        outputBytesLength = choosenAlgorithmMaxOutput;

    var algorithmParams = {
        length: outputBytesLength,
    };

    function _genHashReturn(retArrayBuffer){
        var sliced = retArrayBuffer.slice(0, outputBytesLength);
        return {
            hex: tool.get('util.encoding')(sliced).toHEX(),
            buffer: sliced,
        };
    };

    this.hash = function(dataBuffer){
        if(!tool.get('util.type')(dataBuffer).isArrayBuffer())
            throw Error('invalid-parameter');

        var doer = new choosenAlgorithm(algorithmParams);
        return _genHashReturn(doer.hash(dataBuffer));
    };

    this.mac = function(dataBuffer, keyBuffer){
        if(!(
            tool.get('util.type')(keyBuffer).isArrayBuffer() &&
            tool.get('util.type')(dataBuffer).isArrayBuffer()
        ))
            throw Error('invalid-parameter');

        var ret;

        var doer = new choosenAlgorithm(algorithmParams);
        if(tool.get('util.type')(doer.mac).isFunction())
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

        return _genHashReturn(ret);
    };

    this.pbkdf2 = function(keyBuf, saltBuf, iterations, length){
        if(!(
            tool.get('util.type')(keyBuf).isArrayBuffer() &&
            tool.get('util.type')(saltBuf).isArrayBuffer() &&
            iterations > 0 &&
            length > 0
        ))
            throw Error('invalid-parameter');

        return _PBKDF2(
            self.mac,
            new choosenAlgorithm().digestSize,
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

    var innen = tool.get('util.buffer').concat([i_key_pad.buffer, dataBuffer]),
        hashInnen = hasher(innen);

    var outer = tool.get('util.buffer').concat([o_key_pad.buffer, hashInnen]),
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
        var prevU = tool.get('util.buffer')
            .concat([saltBuffer, appendix.buffer]);

        for(var j=0; j<iterations; j++){
            // use MAC
            var U = macFunc(passwordBuffer, prevU).buffer;

            if(false === Tret)
                // save this first U into result.
                Tret = U;
            else
                // perform XOR
                Tret = tool.get('util.buffer').xor(U, Tret);

            // save this U for next round
            prevU = U;
        };

        DKs[i] = Tret;
    };

    return tool.get('util.buffer').concat(DKs).slice(0, keylen);
};





tool.exp('hash', hash);
tool.set('hash', hash);
//////////////////////////////////////////////////////////////////////////////
})(tool);
