(function(tool){
//////////////////////////////////////////////////////////////////////////////

var cipherToolkit = {};
var definition = {
    'NECRAC256': {
        secretLength: 128,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp521r1'},
            secretLength: 64,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp521r1'},
            secretLength: 64,
        },
        hashAlgorithm: 'WHIRLPOOL',
    },

    'NECRAC192': {
        secretLength: 96,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp384r1'},
            secretLength: 48,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp384r1'},
            secretLength: 48,
        },
        hashAlgorithm: 'BLAKE2s',
    },

    'NECRAC128': {
        secretLength: 64,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp256r1'},
            secretLength: 32,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp256k1'},
            secretLength: 32,
        },
        hashAlgorithm: 'BLAKE2s',
    },

    /* // Old Designs
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
        var hasher = new tool.get('hash')(algorithmSuite.hashAlgorithm);
        return hasher.hash(dataBuf).buffer;
    };

    function _loadAsymModule(conf){
        var constructor = tool
            .get('cipher.asymmetric.' + conf.algorithm)
            .constructor
        ;
        return constructor(conf.parameters);
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

        return tool.get('util.buffer').concat([
            new Uint16Array([dataVerifying.byteLength]).buffer,
            dataVerifying,
            dataEncrypting,
        ]);
    };

    function sign(dataBuf){
        if(!tool.get('util.type')(dataBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.sign(digestBuf);
    };

    function verify(dataBuf, signatureBuf){
        if(!(
            tool.get('util.type')(dataBuf).isArrayBuffer() &&
            tool.get('util.type')(signatureBuf).isArrayBuffer()
        ))
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.verify(digestBuf, signatureBuf);
    };

    function encrypt(plaintextBuf){
        if(!tool.get('util.type')(plaintextBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        return pkEncrypting.encrypt(plaintextBuf);
    };

    function decrypt(ciphertextBuf){
        if(!tool.get('util.type')(ciphertextBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        return pkEncrypting.decrypt(ciphertextBuf);
    };


    /* Exposed Functions for Initialization */
    this.setPrivateKey = function(credentialBuf){
        if(!tool.get('util.type')(credentialBuf).isArrayBuffer())
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
        var pbkdf2 = new tool.get('hash')(algorithmSuite.hashAlgorithm).pbkdf2;

        var secretSigning = pbkdf2(
            credentialBuf,
            tool.get('util.encoding')('derivation-of-signing-key', 'ascii').toArrayBuffer(),
            4,
            algorithmSuite.sign.secretLength
        );

        var secretDecrypting = pbkdf2(
            credentialBuf,
            tool.get('util.encoding')('derivation-of-encrypting-key', 'ascii').toArrayBuffer(),
            4,
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
            tool.get('util.type')(publicKeyBuf).isArrayBuffer() &&
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
        tool.get('util.log').notice('Load asymmetric cipher component: [' + cipherConf.name + ']'); //    XXX
        cipherToolkit[cipherConf.name] = cipherConf.constructor;
        return;
    };

    if(
        'undefined' != typeof cipherToolkit['EC']
    ){
        tool.get('util.log').notice('Asymmetric ciphers ready.');
        return function(x){
            return new AsymmetricCipher(x);
        };
    };
    
    return null;
};

var exporter = function(x){ return new AsymmetricCipher(x); };
tool.set('cipher.asymmetric', exporter);
tool.exp('cipher.asymmetric', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
