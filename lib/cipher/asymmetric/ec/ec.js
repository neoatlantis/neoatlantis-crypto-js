/*
 * ECDSA and ECDH implementation utilizing JSBN library.
 */
(function(root){
//////////////////////////////////////////////////////////////////////////////

function invoker(_ecparams, _ecdsa, _ecurve, _bigi){


/****************************************************************************/

function EC(curveName){
    var self = this;

    var bigiPrivateKey = null, bigiPublicKey = null;
    var ecparams = _ecparams(curveName);

    if(!ecparams) throw Error('unknown-ec-curve-name');
    var ecdsa = _ecdsa(ecparams);

    function toArray(uarray){
        var r = new Array(uarray.length);
        for(var i=0; i<r.length; i++) r[i] = uarray[i];
        return r;
    };

    /* Interface for initializing */

    this.setPrivateKey = function(privateKeyBuf){
        if(!root.util.type(privateKeyBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        initWithPrivateKey(root.util.encoding(privateKeyBuf).toArray());
    };

    this.setPublicKey = function(publicKeyBuf){
        if(!root.util.type(publicKeyBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        initWithPublicKey(root.util.encoding(publicKeyBuf).toArray());
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
            return new Uint8Array(bigiPublicKey).buffer;
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
        if(!root.util.type(digestBuffer).isArrayBuffer())
            throw new Error('invalid-parameter');
        
        var signature = ecdsa.sign(
            root.util.encoding(digestBuffer).toArray(),
            bigiPrivateKey
        );
        return root.util.encoding(signature).toArrayBuffer();
    };

    function verify(digestBuffer, signatureBuffer){
        if(!(
            root.util.type(digestBuffer).isArrayBuffer() &&
            root.util.type(signatureBuffer).isArrayBuffer()
        ))
            throw new Error('invalid-parameter');

        try{
            var signatureArray = root.util.encoding(signatureBuffer).toArray(),
                digestArray = root.util.encoding(digestBuffer).toArray();
            var ret = ecdsa.verify(
                digestArray,
                signatureArray, 
                bigiPublicKey
            );
        } catch(e){
            console.log(e);
            return false;
        };

        return ret;
    };

    function _computeSecret(anotherPublicKeyBuf){
        if(!root.util.type(anotherPublicKeyBuf).isArrayBuffer())
            throw Error('invalid-parameter');

        var anotherPublicKeyArray = 
            root.util.encoding(anotherPublicKeyBuf).toArray();

        var Q = _ecurve.ECPointFp.decodeFrom(
            ecparams.getCurve(), 
            anotherPublicKeyArray
        );

        var S = Q.multiply(bigiPrivateKey);

        var sharedsecretArray = S.getEncoded().slice(1);
        return root.util.encoding(sharedsecretArray).toArrayBuffer();
    };

    function encrypt(dataBuf){
        if(!root.util.type(dataBuf).isArrayBuffer())
            throw new Error('invalid-parameter');

        // create another EC instance with a new private key, then use the new
        // instance to calculate SharedSecret with the public key of this
        // instance. Encryption is done by using this SharedSecret as key.
        // As return value the public key of the created new EC instance is
        // attached.

        var tempEC = new EC(curveName); 
        tempEC.setPrivateKey(new root.util.srand().bytes(128));
        
        var sharedsecret = tempEC._computeSecret(self.getPublicKey()),
            tempPublicKey = tempEC.getPublicKey();

        var encryptor = new root.cipher.symmetric().key(sharedsecret),
            ciphertextBuf = encryptor.encrypt(dataBuf);

        // pack the result
        var lenBuf = new Uint16Array([tempPublicKey.byteLength]);
        return root.util.buffer.concat([
            lenBuf.buffer,
            tempPublicKey,
            ciphertextBuf,
        ]);
    };

    function decrypt(dataBuf){
        if(!(
            root.util.type(dataBuf).isArrayBuffer() &&
            dataBuf.byteLength > 2
        ))
            throw new Error('invalid-parameter');

        // first extract the public key of the created instance from dataBuf.
        // then calculate SharedSecret using the extracted public key and
        // the private key of this instance.

        var lenBuf = dataBuf.slice(0, 2),
            dataBuf = dataBuf.slice(2);

        var splitLen = new Uint16Array(lenBuf)[0];
        if(dataBuf.length <= splitLen)
            throw new Error('invalid-ciphertext');

        var tempPublicKey = dataBuf.slice(0, splitLen),
            ciphertextBuf = dataBuf.slice(splitLen);

        var sharedsecret = _computeSecret(tempPublicKey);

        var decryptor = new root.cipher.symmetric().key(sharedsecret);
        var decryption = decryptor.decrypt(ciphertextBuf);
        return decryption;
    };


    return this;
};





/****************************************************************************/
return {
    name: 'EC',
    constructor: function(p){
        return new EC(p.curve);
    },
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
        [
            'cipher/asymmetric/ec/ecparams',
            'cipher/asymmetric/ec/ecdsa',
            'cipher/asymmetric/ec/ecurve',
            'cipher/asymmetric/ec/bigi'
        ],
        function(_ecparams, _ecdsa, _ecurve, _bigi){
            return invoker(_ecparams, _ecdsa, _ecurve, _bigi);
        }
    );
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
