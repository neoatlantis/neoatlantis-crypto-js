/*
 * Asymmetric Cipher Interface
 * ===========================
 *
 * Provides an easy way of operating different types of asymmetric algorithm
 * suites.
 *
 * Asymmetric Ciphers are able to sign/verify, and encrypt/decrypt. Like
 * symmetric ciphers, they are also initializable with single private key, or
 * with a pair of public key. The private key is arbitary random, and the
 * public key must be the derivation result of corresponding private keys.
 *
 * The _ASYMCRYPT class is designed to work with arbitary length of input.
 * The hash algorithms are defined in algorithm suite. Similarly, the key
 * length used in encrypting are also fixed.
 * Encryption/Decryption have dependencies of symmetric cipher interface and
 * are therefore async. You have to specify callback functions!
 *
 * Currently supported asymmetric cipher suites:
 *  (all names are not standard and are only for our program)
 *
 */

module.exports = function(algorithmName){
    return new _ASYMCRYPT(algorithmName);
};

var algorithmSuites = {
    // For EC curves, followings are available:
    //  secp128r1, secp160k1, secp160r1, secp192k1, secp192r1,
    //  secp224r1, secp256k1, secp256r1, secp384r1, secp521r1.

    // NECRAC: NeoAtlantis Elliptic Curve Asymmetric Cipher

    //                             CREDENTIAL            CREDENTIAL      ENC-KEY
    //                              LENGTH                LENGTH         LENGTH
    'NECRAC256': ['ec', 'secp521r1', 64, 'ec', 'secp521r1', 64, 'sha512', 128],
    'NECRAC192': ['ec', 'secp384r1', 48, 'ec', 'secp384r1', 48, 'sha256', 96],
    'NECRAC128': ['ec', 'secp256r1', 32, 'ec', 'secp256k1', 32, 'sha256', 64],
    'NECRAC112': ['ec', 'secp224r1', 28, 'ec', 'secp224r1', 28, 'sha1'  , 56],
    'NECRAC96' : ['ec', 'secp192k1', 24, 'ec', 'secp192r1', 24, 'sha1'  , 48],
    'NECRAC80' : ['ec', 'secp160k1', 20, 'ec', 'secp160r1', 20, 'sha1'  , 40],
    'NECRAC64' : ['ec', 'secp128r1', 16, 'ec', 'secp128r1', 16, 'md5'   , 32],
    // NAME     SIGN-ALGO  PARAM        ENC-ALGO  PARAM        DIGEST-ALGO
};

var _implementations = {
    ec: require('./ec'),
};

module.exports.algorithms = Object.keys(algorithmSuites);

///////////////////////////// IMPLEMENTATION /////////////////////////////////
function _deriveCredentialProtectionKey(passphrase){
    // sync derivation. to optimize this program, change all PBKDF2 use cases
    // to async.
    return $.crypto.hash.PBKDF2(
        passphrase,
        new $.node.buffer.Buffer('key-from-passphrase', 'ascii'),
        100000,
        128
    ); 
};

function _ASYMCRYPT(algorithmName){
    var self = this;

    var credential = null;

    /* Initialize Algorithm Suite */
    var algorithmSuite = algorithmSuites[algorithmName];
    var pkSigning, pkEncrypting;
    if(!algorithmSuite)
        throw $.error('invalid-algorithm-choice');
    if('ec' == algorithmSuite[0])
        pkSigning = _implementations.ec(algorithmSuite[1]);
    if('ec' == algorithmSuite[3])
        pkEncrypting = _implementations.ec(algorithmSuite[4]);

    function _digest(dataBuf){
        return $.crypto.hash.digest(algorithmSuite[6], dataBuf);
    };

    function _newKey(){
        return $.crypto.random.bytes(algorithmSuite[7]);
    };

    /* initializator */
    function init(prv){
        if(prv){
            self.sign = sign;
            self.decrypt = decrypt;
            self.getPrivateKey = getPrivateKey;
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

        // join the 2 parts
        var lenBuf = new $.node.buffer.Buffer(4);
        lenBuf.writeUInt32BE(dataVerifying.length, 0);

        return $.node.buffer.Buffer.concat([
            lenBuf,
            dataVerifying,
            dataEncrypting,
        ]);
    };

    function getPrivateKey(a, b){
        /* Export the Credential
         *
         * Usage:
         *  1. getPrivateKey(), return the credential
         *  2. getPrivateKey(callback), use callback to return credential
         *  3. getPrivateKey(passphraseBuffer, callback)
         *     encrypt the credential using given passphrase, and return using
         *     callback
         */

        if(undefined === a) return credential;
        if($.tools.type.isFunction(a)) return a(null, credential);

        if(!(
            $.tools.type.isBuffer(a) &&
            $.tools.type.isFunction(b)
        ))
            throw $.error('invalid-parameter', 'get-private-key');

        var passphraseBuf = a, RR = b;

        $.crypto.crypt().setKey(passphraseBuf).encrypt(credential, RR);
    };

    function sign(dataBuf){
        if(!$.tools.type.isBuffer(dataBuf))
            throw $.error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.sign(digestBuf);
    };

    function verify(dataBuf, signatureBuf){
        if(!$.tools.type.areBuffers([dataBuf, signatureBuf]))
            throw $.error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.verify(digestBuf, signatureBuf);
    };

    function encrypt(plaintextBuf, RR){
        if(!$.tools.type.isBuffer(plaintextBuf))
            throw $.error('invalid-parameter');
        var tempKey = _newKey(),
            encryptedTempKey = pkEncrypting.encrypt(tempKey);
        
        var lenBuf = new $.node.buffer.Buffer(4);
        lenBuf.writeUInt32BE(encryptedTempKey.length, 0);

        $.crypto.crypt()
            .setKey(tempKey)
            .encrypt(plaintextBuf, function(err, res){
                if(err) return RR(err, res);
                return RR(null, $.node.buffer.Buffer.concat([
                    lenBuf,
                    encryptedTempKey,
                    res
                ]));
            })
        ;
    };

    function decrypt(ciphertextBuf, RR){
        if(!(
            $.tools.type.isBuffer(ciphertextBuf) &&
            ciphertextBuf.length > 4
        ))
            throw $.error('invalid-parameter');

        var lenBuf = ciphertextBuf.slice(0, 4),
            ciphertextBuf = ciphertextBuf.slice(4),
            splitLen = lenBuf.readUInt32BE(0);

        if(ciphertextBuf.length <= splitLen)
            throw $.error('invalid-ciphertext');

        var encryptedTempKey = ciphertextBuf.slice(0, splitLen),
            ciphertext = ciphertextBuf.slice(splitLen);

        var tempKey = pkEncrypting.decrypt(encryptedTempKey);

        $.crypto.crypt().setKey(tempKey).decrypt(ciphertext, RR);
    };


    function _setPrivateKey(plainCredentialBuf){
        // save credential for further exporting
        credential = plainCredentialBuf;

        /* 
         * Derive useful secrets for pkSigning and pkEncrypting.
         *
         * secrets for signing and encrypting algorithms are different, but
         * are from same source(using different derivations).
         *
         * the private key being imported and exported, are the source of
         * such derivations.
         */
        var secretSigning = $.crypto.hash.PBKDF2(
            credential,
            new $.node.buffer.Buffer('derivation-of-signing-key', 'ascii'),
            1024,
            algorithmSuite[2]
        );

        var secretDecrypting = $.crypto.hash.PBKDF2(
            credential,
            new $.node.buffer.Buffer('derivation-of-encrypting-key', 'ascii'),
            1024,
            algorithmSuite[5]
        );

        try{
            pkSigning.setPrivateKey(secretSigning);
            pkEncrypting.setPrivateKey(secretDecrypting);
        } catch(e){
            throw $.error('invalid-private-key', e);
        };

        init(true);
    };


    /* Exposed Functions for Initialization */
    this.setPrivateKey = function(credentialBuf, passphraseBuffer, RR){
        if(!$.tools.type.isBuffer(credentialBuf))
            throw $.error('invalid-parameter', 'private-key-buffer');

        // if no passphrase is provided, regard this as plain credential.
        if(undefined === passphraseBuffer)
            return _setPrivateKey(credentialBuf);

        // otherwise, decrypt the credential and call RR.
        if(!$.tools.type.isBuffer(passphraseBuffer))
            throw $.error('invalid-parameter', 'passphrase');


        if(undefined === RR)
            RR = function(err){
                if(err) throw $.error('unable-to-set-private-key', err);
            };
        else if(!$.tools.type.isFunction(RR))
            throw $.error('invalid-parameter', 'invalid-callback-function');

        // decrypt the private key
        $.crypto.crypt()
            .setKey(passphraseBuffer)
            .decrypt(credentialBuf, function(err, plainCredentialBuf){
                if(err) return RR(err);
                _setPrivateKey(plainCredentialBuf);
                RR(null);
            })
        ;
    };

    this.setPublicKey = function(publicKeyBuf){
        if(!(
            $.tools.type.isBuffer(publicKeyBuf) &&
            publicKeyBuf.length > 4
        ))
            throw $.error('invalid-parameter', 'public-key-buffer');

        var splitLen = publicKeyBuf.readUInt32BE(0);
        publicKeyBuf = publicKeyBuf.slice(4);

        if(publicKeyBuf.length <= splitLen)
            throw $.error('invalid-parameter', 'public-key-buffer');

        var dataVerifying = publicKeyBuf.slice(0, splitLen),
            dataEncrypting = publicKeyBuf.slice(splitLen);

        try{
            pkSigning.setPublicKey(dataVerifying);
            pkEncrypting.setPublicKey(dataEncrypting);
        } catch(e){
            throw $.error('invalid-public-key', e);
        };
        
        init(false);
    };



    return this;
};
