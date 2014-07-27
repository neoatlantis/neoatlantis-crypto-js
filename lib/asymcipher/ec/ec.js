/*
 * ECDSA and ECDH implementation utilizing JSBN library.
 */
(function(){
//////////////////////////////////////////////////////////////////////////////

function invoker(_ecparams, _ecdsa, _ecurve, _bigi){





return function EC(curveName, srand){
    var self = this;

    var bigiPrivateKey = null, bigiPublicKey = null;
    var ecparams = _ecparams(curveName);

    if(!ecparams) throw Error('unknown-ec-curve-name');
    var ecdsa = new _ecdsa(ecparams, srand);


    /* Interface for initializing */

    this.setPrivateKey = function(privateKeyArray){
        if(!Array.isArray(privateKeyArray))
            throw new Error('invalid-parameter');
        initWithPrivateKey(privateKeyArray);
    };

    this.setPublicKey = function(publicKeyArray){
        if(!Array.isArray(publicKeyArray))
            throw new Error('invalid-parameter');
        initWithPublicKey(publicKeyArray);
    };

    /* Internal Function for initializing */

    // remove or add functions to this instance.
    function init(prv){
        if(prv){
            self.sign = sign;
            self.decrypt = decrypt;
            self._computeSecret = _computeSecret;
        };

        self.verify = verify;
        self.encrypt = encrypt;
        self.getPublicKey = function(){
            return bigiPublicKey;
        };

        delete self.setPrivateKey;
        delete self.setPublicKey;
    };

    function initWithPublicKey(publicKeyArray){
        // convert publicKeyBuffer to array as library required.
        bigiPrivateKey = null;
//        bigiPublicKey = _bigi(publicKeyBuffer.toString('hex'), 16); 
        bigiPublicKey = publicKeyArray;
//        console.log(bigiPublicKey);

        init(false);
    };

    function initWithPrivateKey(privateKeyArray){
        // convert privateKeyBuffer to array as library required.
//        bigiPrivateKey = _bigi(privateKeyBuffer.toString('hex'), 16);
        bigiPrivateKey = _bigi.fromByteArrayUnsigned(privateKeyArray);
            
        // calculate public key.
        var pubPoint = ecparams.getG().multiply(bigiPrivateKey);
        bigiPublicKey = pubPoint.getEncoded(false);

        init(true);
    };


    /* Functions for normal working */

    function sign(digestBuffer){
        if(!$.tools.type.isBuffer(digestBuffer))
            throw Error('invalid-parameter');
        
        var signature = ecdsa.sign(digestBuffer, bigiPrivateKey);

        return new $.node.buffer.Buffer(signature);
    };

    function verify(digestBuffer, signatureBuffer){
        if(!(
            $.tools.type.isBuffer(digestBuffer) &&
            $.tools.type.isBuffer(signatureBuffer)
        ))
            throw Error('invalid-parameter');

        try{
//            var signatureArray = _bigi(signatureBuffer.toString('hex'), 16);
            var signatureArray = buffer2array(signatureBuffer);
            var ret = ecdsa.verify(
                digestBuffer,
                signatureArray, 
                bigiPublicKey
            );
        } catch(e){
            console.log('error', e);
            return false;
        };

        return ret;
    };

    function _computeSecret(anotherPublicKeyArray){
        if(!Array.isArray(anotherPublicKeyArray))
            throw Error('invalid-parameter');

        var Q = _ecurve.ECPointFp.decodeFrom(
            ecparams.getCurve(), 
            anotherPublicKeyArray
        );

        var S = Q.multiply(bigiPrivateKey);

        return S.getEncoded().slice(1);
    };

    function _XOR(sharedsecret, salt, dataBuf){
        var cryptStream = $.crypto.hash.PBKDF2(
            sharedsecret,
            salt,
            1024,
            dataBuf.length
        );

        var resultStream = new $.node.buffer.Buffer(dataBuf.length);
        for(var i=0; i<resultStream.length; i++)
            resultStream.writeUInt8(
                dataBuf.readUInt8(i) ^ cryptStream.readUInt8(i),
                i
            );

        return resultStream;
    };

    
    // TODO remove buffer
    function encrypt(dataBuf){
        if(!$.tools.type.isBuffer(dataBuf))
            throw $.error('invalid-parameter');

        // create another EC instance with a new private key, then use the new
        // instance to calculate SharedSecret with the public key of this
        // instance. Encryption is done by using this SharedSecret as key.
        // As return value the public key of the created new EC instance is
        // attached.
        var tempEC = new EC(curveName),
            tempCredential = $.crypto.random.bytes(128);

        tempEC.setPrivateKey(tempCredential);
        
        var sharedsecret = tempEC._computeSecret(self.getPublicKey()),
            tempPublicKey = tempEC.getPublicKey();

        // use XOR to encrypt
        var resultStream = _XOR(sharedsecret, tempPublicKey, dataBuf);
        
        // pack the result
        var lenBuf = new $.node.buffer.Buffer(2);
        lenBuf.writeUInt16BE(tempPublicKey.length, 0);

        return $.node.buffer.Buffer.concat([
            lenBuf,
            tempPublicKey,
            resultStream,
        ]);
    };

    function decrypt(dataBuf){
        if(!(
            $.tools.type.isBuffer(dataBuf) &&
            dataBuf.length > 2
        ))
            throw $.error('invalid-parameter');

        // first extract the public key of the created instance from dataBuf.
        // then calculate SharedSecret using the extracted public key and
        // the private key of this instance.

        var lenBuf = dataBuf.slice(0, 2),
            dataBuf = dataBuf.slice(2);

        var splitLen = lenBuf.readUInt16BE(0);
        if(dataBuf.length <= splitLen)
            throw $.error('invalid-ciphertext');

        var tempPublicKey = dataBuf.slice(0, splitLen),
            resultStream = dataBuf.slice(splitLen);

        var sharedsecret = _computeSecret(tempPublicKey);

        return _XOR(sharedsecret, tempPublicKey, resultStream);
    };


    return this;
};






};  // end of invoker


if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var _ecparams = require('./ecparams.js'),
        _ecdsa = require('./ecdsa.js'),
        _ecurve = require('./ecurve.js'),
        _bigi = require('./bigi.js');
    module.exports = invoker(_ecparams, _ecdsa, _ecurve, _bigi);
} else
    define(
        ['ecparams', 'ecdsa', 'ecurve', 'bigi'],
        function(_ecparams, _ecdsa, _curve, _bigi){
            return invoker(_ecparams, _ecdsa, _ecurve, _bigi);
        }
    );
//////////////////////////////////////////////////////////////////////////////
})();
