(function(root){
//////////////////////////////////////////////////////////////////////////////

var cipherToolkit = {};
var definition = {
    'NECRAC256': {
        secretLength: 128,
        sign: {
            algorithm: 'EC',
            parameters: {curve: 'secp521r1'},
            secretLength: 64,
        },
        crypt: {
            algorithm: 'EC',
            parameters: {curve: 'secp521r1'},
            secretLength: 64,
        },
        hashAlgorithm: 'WHIRLPOOL',
    },
    /* // Old Designs
    'NECRAC192': ['ec', 'secp384r1', 48, 'ec', 'secp384r1', 48, 'sha256', 96],
    'NECRAC128': ['ec', 'secp256r1', 32, 'ec', 'secp256k1', 32, 'sha256', 64],
    'NECRAC112': ['ec', 'secp224r1', 28, 'ec', 'secp224r1', 28, 'sha1'  , 56],
    'NECRAC96' : ['ec', 'secp192k1', 24, 'ec', 'secp192r1', 24, 'sha1'  , 48],
    'NECRAC80' : ['ec', 'secp160k1', 20, 'ec', 'secp160r1', 20, 'sha1'  , 40],
    'NECRAC64' : ['ec', 'secp128r1', 16, 'ec', 'secp128r1', 16, 'md5'   , 32],
    */
};


function AsymmetricCipher(algorithmName){
    var self = this;

    /* Initialize Algorithm Suite */
    var algorithmSuite = definition[algorithmName];
    var pkSigning, pkEncrypting;
    if(!algorithmSuite) throw new Error('invalid-algorithm-choice');
    
    function _digest(dataBuf){
        var hasher = new root.hash(algorithmSuite.hashAlgorithm);
        return hasher.hash(dataBuf).buffer;
    };

    function _loadAsymModule(conf){
        if(!cipherToolkit[conf.algorithm]) return null;
        return cipherToolkit[conf.algorithm](conf.parameters);
    };
    pkSigning = _loadAsymModule(algorithmSuite.sign);
    pkEncrypting = _loadAsymModule(algorithmSuite.crypt);

    /* initializator */
    function init(prv){
        if(prv){
            self.sign = sign;
            self.decrypt = decrypt;
        };

        self.verify = verify;
        self.encrypt = encrypt;
        self.getPublicKey = getPublicKey;

        delete self.setPrivateKey;
        delete self.setPublicKey;
    };

    
    /* Implementations */

    function getPublicKey(){
        var dataVerifying = pkSigning.getPublicKey(),
            dataEncrypting = pkEncrypting.getPublicKey();

        return root.util.buffer.concat([
            new Uint16Array([dataVerifying.byteLength]).buffer,
            dataVerifying,
            dataEncrypting,
        ]);
    };

    function sign(dataBuf){
        if(!root.util.type(dataBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.sign(digestBuf);
    };

    function verify(dataBuf, signatureBuf){
        if(!(
            root.util.type(dataBuf).isArrayBuffer() &&
            root.util.type(signatureBuf).isArrayBuffer()
        ))
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.verify(digestBuf, signatureBuf);
    };

    function encrypt(plaintextBuf){
        if(!root.util.type(plaintextBuf).isArrayBuffer())
            throw $.error('invalid-parameter');
        var tempKey = new root.util.srand().bytes(algorithmSuite.secretLength),
            encryptedTempKey = pkEncrypting.encrypt(tempKey);
        
        var lenBuf = new Uint32Array([encryptedTempKey.length]);

        var ciphertextBuf = new root.cipher.symmetric()
            .setKey(tempKey)
            .encrypt(plaintextBuf)
        ;
        return root.util.buffer.concat([
            lenBuf,
            encryptedTempKey,
            ciphertextBuf,
        ]);
    };

    function decrypt(ciphertextBuf){
        if(!(
            root.util.type(ciphertextBuf).isArrayBuffer() &&
            ciphertextBuf.byteLength > 4
        ))
            throw new Error('invalid-parameter');

        var lenBuf = new Uint32Array(ciphertextBuf.slice(0, 4)),
            ciphertextBuf = ciphertextBuf.slice(4),
            splitLen = lenBuf[0];

        if(ciphertextBuf.byteLength <= splitLen)
            throw new Error('invalid-ciphertext');

        var encryptedTempKey = ciphertextBuf.slice(0, splitLen),
            ciphertext = ciphertextBuf.slice(splitLen);

        var tempKey = pkEncrypting.decrypt(encryptedTempKey);

        return new root.cipher.symmetric().setKey(tempKey).decrypt(ciphertext);
    };


    /* Exposed Functions for Initialization */
    this.setPrivateKey = function(credentialBuf){
        if(!root.util.type(credentialBuf).isArrayBuffer())
            throw new Error('invalid-parameter');

        /* 
         * Derive useful secrets for pkSigning and pkEncrypting.
         *
         * secrets for signing and encrypting algorithms are different, but
         * are from same source(using different derivations).
         *
         * the private key being imported and exported, are the source of
         * such derivations.
         */
        var pbkdf2 = new root.hash(algorithmSuite.hashAlgorithm).pbkdf2;

        var secretSigning = pbkdf2(
            credentialBuf,
            root.util.encoding('derivation-of-signing-key', 'ascii').toArrayBuffer(),
            1024,
            algorithmSuite.sign.secretLength
        );

        var secretDecrypting = pbkdf2(
            credentialBuf,
            root.util.encoding('derivation-of-encrypting-key', 'ascii').toArrayBuffer(),
            1024,
            algorithmSuite.crypt.secretLength
        );

        try{
            pkSigning.setPrivateKey(secretSigning);
            pkEncrypting.setPrivateKey(secretDecrypting);
        } catch(e){
            throw new Error('invalid-private-key');
        };

        init(true);
    };

    this.setPublicKey = function(publicKeyBuf){
        if(!(
            root.util.type(publicKeyBuf).isArrayBuffer() &&
            publicKeyBuf.byteLength > 2
        ))
            throw new Error('invalid-public-key');

        var splitLen = new Uint16Array(publicKeyBuf.slice(0, 2))[0];
        publicKeyBuf = publicKeyBuf.slice(2);

        if(publicKeyBuf.byteLength <= splitLen)
            throw new Error('invalid-public-key');

        var dataVerifying = publicKeyBuf.slice(0, splitLen),
            dataEncrypting = publicKeyBuf.slice(splitLen);

        try{
            pkSigning.setPublicKey(dataVerifying);
            pkEncrypting.setPublicKey(dataEncrypting);
        } catch(e){
            throw new Error('invalid-public-key');
        };
        
        init(false);
    };


    return this;
};

/****************************************************************************/

function cipherInitializer(cipherConf){
    if(cipherConf){
        root.util.log.notice('Load asymmetric cipher component: [' + cipherConf.name + ']'); //    XXX
        cipherToolkit[cipherConf.name] = cipherConf.constructor;
        return;
    };

    if(
        'undefined' != typeof cipherToolkit['EC']
    ){
        root.util.log.notice('Asymmetric ciphers ready.');
        return function(x){
            return new AsymmetricCipher(x);
        };
    };
    
    return null;
};


if('undefined' != typeof module && 'undefined' != typeof module.exports)
    module.exports = cipherInitializer;
else
    define([], function(){
        return cipherInitializer;
    });

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
