var CONTROL_USE_NODE_HASH_LIBRARY = false;

module.exports = new (function(){
    var self = this;
    
    var knownAlgorithms = {
        'md5': 128,
        'sha1': 160,
        'ripemd160': 160,
        'sha256': 256,
        'sha512': 512,
    };

    this.algorithms = Object.keys(knownAlgorithms);

    this.PBKDF2 = function(passwordBuffer, saltBuffer, iterations, keylen){
        
        // WARNING in different choices of implementations, there are 
        // compatiblity related issues!!! XXX

        if(!(
            $.tools.type.isBuffer(passwordBuffer) &&
            $.tools.type.isBuffer(saltBuffer) &&
            $.tools.type.isNumber(iterations) && iterations > 0 &&
            $.tools.type.isNumber(keylen) && keylen > 0
        ))
            throw Error('invalid-parameter');

        return PBKDF2(passwordBuffer, saltBuffer, iterations, keylen);
    };

    this.digest = function(algo, dataBuffer){

        if(!$.tools.type.isBuffer(dataBuffer)) 
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

    this.objectID = function(algo, obj){
        
        if($.tools.type.isString(obj))
            return self.digest(algo, new $.node.buffer.Buffer(obj, 'ascii'));

        if($.tools.type.isBuffer(obj))
            return self.digest(algo, obj);

        if($.tools.type.isArray(obj)){
            var hashResult = new Array(obj.length);
            for(var i=0; i<obj.length; i++)
                hashResult[i] = self.objectID(algo, obj[i]);
            return self.digest(algo, $.node.buffer.Buffer.concat(hashResult));
        };

        if($.tools.type.isObject(obj)){
            var keys = Object.keys(obj).sort(),
                hashResult = new Array(keys.length);
            for(var i=0; i<keys.length; i++){
                hashResult[i] = self.HMAC(
                    algo,
                    new $.node.buffer.Buffer(keys[i], 'ascii'),
                    self.objectID(algo, obj[keys[i]])
                );
            };
            return self.digest(algo, $.node.buffer.Buffer.concat(hashResult));
        };

        throw $.error('unsupported-object');
    };

    this.HMAC = function(algo, keyBuffer, dataBuffer){
        
        if(!(
            $.tools.type.isBuffer(keyBuffer) &&
            $.tools.type.isBuffer(dataBuffer)
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
})();

///////////////////////////// HASH ALGORITHMS ////////////////////////////////

function _nodeJSHash(algoName, dataBuffer){
    var obj = $.node.crypto.createHash(algoName);
    obj.update(dataBuffer);
    return obj.digest();
};

function MD5(dataBuffer){
    return _nodeJSHash('md5', dataBuffer);
};

function SHA(length, dataBuffer){
    if(true === CONTROL_USE_NODE_HASH_LIBRARY){
        /* SHA worker will be defined using NodeJS's `crypto` library, which
         * depends on OpenSSL.*/
        var worker = function(length, dataBuffer){
            var algoName = {
                160: 'sha1',
                256: 'sha256',
                512: 'sha512',
            }[length];
            if(!algoName) throw Error('hash-algorithm-unknown');
            return _nodeJSHash(algoName, dataBuffer);
        };
    } else {
        /* SHA worker will be defined using a library called `jsSHA`:
         *  https://github.com/Caligatio/jsSHA  */
        var worker = function(length, dataBuffer){
            var algoName = {
                160: 'SHA-1',
                256: 'SHA-256',
                512: 'SHA-512',
            }[length];
            if(!algoName) throw Error('hash-algorithm-unknown');
            var obj = new $.node.jssha(dataBuffer.toString('hex'), 'HEX');
            var ret = obj.getHash(algoName, "HEX");
            return new $.node.buffer.Buffer(ret, 'hex');
        };
    };

    return worker(length, dataBuffer);
};

function RIPEMD160(dataBuffer){
    return $.node.ripemd160(dataBuffer);
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

function _nodeJSHMAC(algoName, keyBuffer, dataBuffer){
    var obj = $.node.crypto.createHmac(algoName, keyBuffer);
    obj.update(dataBuffer);
    return obj.digest();
};

function SHAHMAC(length, keyBuffer, dataBuffer){
    if(true === CONTROL_USE_NODE_HASH_LIBRARY){
        /* SHA worker will be defined using NodeJS's `crypto` library, which
         * depends on OpenSSL.*/
        var worker = function(length, keyBuffer, dataBuffer){
            var algoName = {
                160: 'sha1',
                256: 'sha256',
                512: 'sha512',
            }[length];
            if(!algoName) throw Error('hash-algorithm-unknown');
            return _nodeJSHMAC(algoName, keyBuffer, dataBuffer);
        };
    } else {
        /* SHA worker will be defined using a library called `jsSHA`:
         *  https://github.com/Caligatio/jsSHA  */
        var worker = function(length, keyBuffer, dataBuffer){
            var algoName = {
                160: 'SHA-1',
                256: 'SHA-256',
                512: 'SHA-512',
            }[length];
            if(!algoName) throw Error('hash-algorithm-unknown');
            var obj = new $.node.jssha(dataBuffer.toString('hex'), 'HEX');
            var ret = obj.getHMAC(
                keyBuffer.toString('hex'),
                "HEX",
                algoName,
                "HEX"
            );
            return new $.node.buffer.Buffer(ret, 'hex');
        };
    };

    return worker(length, keyBuffer, dataBuffer);
};

function RIPEMD160HMAC(keyBuffer, dataBuffer){
    return _genericHMAC(RIPEMD160, keyBuffer, dataBuffer, 64);
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
