/*
 * ECDSA and ECDH implementation utilizing JSBN library.
 */
var _ecparams = require('./_ecparams.js'),
    _ecdsa = require('./_ecdsa.js'),
    _ecurve = require('./_ecurve.js'),
    _bigi = require('./_bigi.js');

module.exports = function EC(curveName){
    var self = this;

    var bigiPrivateKey = null, bigiPublicKey = null;
    var ecparams = _ecparams(curveName);

    if(!ecparams) throw Error('unknown-ec-curve-name');
    var ecdsa = new _ecdsa(ecparams);

    function buffer2array(buffer){
        var ret = [];
        for(var i=0; i<buffer.length; i++)
            ret.push(buffer.readUInt8(i));
        return ret;
    };


    /* Interface for initializing */

    this.setPrivateKey = function(privateKeyBuffer){
        if(!$.tools.type.isBuffer(privateKeyBuffer))
            throw Error('invalid-parameter');
        else 
            initWithPrivateKey(privateKeyBuffer);
    };

    this.setPublicKey = function(publicKeyBuffer){
        if(!$.tools.type.isBuffer(publicKeyBuffer))
            throw Error('invalid-parameter');
        else
            initWithPublicKey(publicKeyBuffer);
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
            return new $.node.buffer.Buffer(bigiPublicKey);
        };

        delete self.setPrivateKey;
        delete self.setPublicKey;
    };

    function initWithPublicKey(publicKeyBuffer){
        // convert publicKeyBuffer to array as library required.
        bigiPrivateKey = null;
//        bigiPublicKey = _bigi(publicKeyBuffer.toString('hex'), 16); 
        bigiPublicKey = buffer2array(publicKeyBuffer);
//        console.log(bigiPublicKey);

        init(false);
    };

    function initWithPrivateKey(privateKeyBuffer){
        // convert privateKeyBuffer to array as library required.
//        bigiPrivateKey = _bigi(privateKeyBuffer.toString('hex'), 16);
        bigiPrivateKey = _bigi.fromByteArrayUnsigned(
            buffer2array(privateKeyBuffer)
        );
            
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

    function _computeSecret(anotherPublicKeyBuffer){
        if(!$.tools.type.isBuffer(anotherPublicKeyBuffer))
            throw Error('invalid-parameter');

        var Q = _ecurve.ECPointFp.decodeFrom(
            ecparams.getCurve(), 
            buffer2array(anotherPublicKeyBuffer)
        );

        var S = Q.multiply(bigiPrivateKey);

        return new $.node.buffer.Buffer(S.getEncoded()).slice(1);
    };

    function _XOR(sharedsecret, salt, dataBuf){
        // use XOR to encrypt dataBuf from sharedsecret.
        //
        // this is because we don't want to make this procedure mixed with
        // `$.crypto.crypt` and therefore making this function async. And,
        // it should have been noticed that encrypting a data larger than
        // the public key's result is not secure.
        //
        // use PBKDF2 or at least some hash functions to derive psedo-numbers
        // from sharedsecret. The sharedsecret have fixed formats and 
        // should NEVER be used directly into XOR.
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
