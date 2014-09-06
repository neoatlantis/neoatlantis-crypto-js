/*
 * Enigma Identity Class
 * =====================
 *
 * In `Enigma`, an identity is a public key bound with a description. It is
 * always self-signed(this is the only signature that exists in Enigma system
 * and doesn't follow the standard format of signing--the signing in message).
 *
 * To initialize a class, 2 ways are provided:
 *  1 by generating an identity. Providing description and selecting algorithm.
 *  2 by providing a serialized public/private part of identity. A passphrase
 *    will be required, when a private part is given.
 *
 * After initialization, public identity part will be always ready to export.
 * The private part will be able to export, only when the initialization is
 * done by generation or by providing a private part. Either way, another
 * passphrase for protecting the private part is required.
 *
 * The identity is also ready for encryption/decryption/signing/verifying based
 * on how it is generated.
 *
 *
 * ===================================
 * IMPORTANT!! Remarks on `pinkey` !!!
 * ===================================
 *  Using a PIN to protect the secret key is necessary, and this PIN serves
 *  also as an identification process, which ties the personality and the data
 *  together.
 *
 *  But we know a PIN is too weak to be directly used as a key to encrypt the
 *  secret. Therefore PBKDF2, scrypt or bcrypt should be applied. Now comes the
 *  problem, that browser and javascript implemented such algorithms are too
 *  slow to be comparable with those code in C. Lacking speed means also that
 *  such protections are no-use(to delay the same length time we have to reduce
 *  the calculation rounds).
 *
 *  --------------------------------------------------------------------------
 *  Therefore, the author is decided, not to accept a PIN and derive the
 *  encryption key natively using javascript, but instead require a `derived
 *  key`. The derivation should be done somewhere else, may be using browser's
 *  `crypto`.
 *  --------------------------------------------------------------------------
 *  
 *  In short, you YOURSELF are responsible for providing key good enough to
 *  secure the user's secret(seed used to initialize all user's private key
 *  instances).
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////
// Adjustable
var defaults = {
    algorithmName: 'NECRAC128', // default and fallback algorithm choice 
};
/****************************************************************************/

var template = {
    '_': ['constant', new Uint8Array([69, 73]).buffer],
    'subject': 'shortBinary',
    'algorithm': ['enum', [
        'NECRAC96',
        'NECRAC112',
        'NECRAC128',
        'NECRAC192',
        'NECRAC256',
    ]],
    'public': 'binary',
    'secret': 'shortBinary',
        // optional. if given, should be ciphertext protected with pinkey
        // max. length: 255 bytes. should be enough!
    'signature': 'binary',
};

function identity(){
    var self = this;
    var hash = tool.get('hash');
    var buffer = tool.get('util.buffer');
    var getDef = tool.get('cipher.asymmetric.definition');

    var subjectBuf, secretBuf, publicKeyBuf, algorithmName, signatureBuf,
        asymCipher;

    function getID(){
        return hash('BLAKE2s').mac(publicKeyBuf, subjectBuf).buffer;
    };

    ////////////////////// STAGE 1 INITIALIZATION ////////////////////////

    /*
     * Each method of initialization must do followings:
     *  o set `subjectBuf`
     *  o set `publicKeyBuf`
     *  o set `signatureBuf`
     *  o set `algorithmName`
     *  o initialize `asymCipher`
     */

    function initialize(prv){
        
    };

    this.generate = function(subject, options){
        /*
         * Generate a new identity
         *  1. Test subject validity
         *  2. Fetch random secret
         *  3. set asymCipher, algorithmName
         *  4. get public key and signature
         */
        if(!options) options = {};
        if(!/^[0-9a-z\s]{8,255}$/i.test(subject))
            throw new Error('invalid-subject');

        // write subject buf
        subjectBuf =
            tool.get('util.encoding')(subject, 'ascii').toArrayBuffer();

        // generate asymmetric key
        algorithmName = options.algorithm || defaults.algorithmName;
        var algorithm = getDef(algorithmName);
        if(!algorithm){
            algorithmName = defaults.algorithmName;
            algorithm = getDef(algorithmname);
        };

        secretBuf = tool.get('util.srand')().bytes(algorithm.secretLength);
        asymCipher = tool.get('cipher.asymmetric')(algorithm.name);
        asymCipher.setPrivateKey(secretBuf);
        publicKeyBuf = asymCipher.getPublicKey();

        signatureBuf = asymCipher.sign(getID());

        // initialize the instance
        initialize(true);
    };

    this.loadPublic = function(publicIdentityBuf){
        /*
         * Read the public identity
         *  1. read `subjectBuf`, test validity
         *  2. read `publicKeyBuf`, use it to initialize `asymCipher`
         *  3. read `signatureBuf`
         *  4. check signature against subject and publicKey.
         *  5. call `initialize(false)`.
         */
    };

    this.loadPrivate = function(secretIdentityBuf, pinkeyBuf){
    };

    ////////////////////////// STAGE 2 USAGE ////////////////////////////

    function exportPublic(){
    };

    function exportPrivate(pinkeyBuf){
    };

    function validate(plaintext, signature){
    };

    function sign(plaintext){
    };

    function encrypt(plaintext){
    };

    function decrypt(ciphertext){
    };

    return this;
};



var exporter = function(){ return new identity(); };
tool.set('enigma.identity', exporter);
tool.exp('enigma.identity', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
