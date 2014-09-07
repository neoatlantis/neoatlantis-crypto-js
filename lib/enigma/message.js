/*
 * Enigma Message(something like PGP message) Manager
 * ==================================================
 *
 * Generate: Generate message like PGP messages. Features include:
 *  o multiple identities as receivers
 *  o plaintext can be signed
 *  o output multiple formats is possible
 *
 * Read:
 *  1 Read message, and see if it is encrypted.
 *  2 If yes, a list of hints, indicating possible decryptable identites will
 *    be returned.
 *
 * Decrypt(when examined to be encrypted):
 *  by supplying the possible identity, it will be tried to decrypt the
 *  ciphertext.
 *
 * Verify:
 *  After decryption the instance will have a `read` and a `verify` attribute.
 *  An indication, which shows who have signed the text, will be given. By
 *  supplying an identity, this text will be verified.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// payload can be directly released(which is a `clear sign`, or be encrypted in
// serialized form and set to be value of `payload` in envelope.
var templatePayload = {
    '_': ['constant', new Uint8Array([69, 112]).buffer],
    'signers': 'shortArray',
    'signatures': 'array',
    'content': 'longBinary',
};

var templateEnvelope = {
    '_': ['constant', new Uint8Array([69, 67]).buffer],
    'encrypted': 'boolean',
    'compression': ['enum',[
        'no',
        'lzw',
    ]],
    'receivers': 'shortArray',
    'decryptors': 'array',
    'payload': 'longBinary',
};

function message(){
    var self = this;
    var testType = tool.get('util.type');

    var payloadSerializer = tool.get('util.serialize')(templatePayload),
        envelopeSerializer = tool.get('util.serialize')(templateEnvelope);

    var plaintextBuf, mainKeyBuf, receivers = [], decryptors = [],
        signatures = [], signers = [];
    var ciphertextBuf;

    /////////////// METHODS FOR INITIALIZING THIS INSTANCE ///////////////

    /* Prepares a encryption by supplying the plaintext. */
    this.write = function(plaintext){
        if(!testType(plaintext).isArrayBuffer())
            throw new Error('enigma-invalid-input');
        
        plaintextBuf = plaintext;
        mainKeyBuf = new tool.get('util.srand')().bytes(64);

        delete self.write;
        delete self.read;
        self.sign = sign;
        self.encrypt = encrypt;
        self.done = done;
    };

    /* Prepares a decryption by supplying the ciphertext. */
    this.read = function(ciphertext){
        if(!testType(ciphertext).isArrayBuffer())
            throw new Error('enigma-invalid-input');
        ciphertextBuf = cipher.text;

        delete self.write;
        delete self.read;
        self.decrypt = decrypt;
        self.verify = verify;
    };

    ////////////////// METHODS FOR A WRITTEN INSTANCE ////////////////////

    function sign(withIdentity){
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-sign');

        var withIdentityFp = withIdentity.getFingerprint();
        var signature = withIdentity.sign(plaintextBuf);
        signers.push(withIdentityFp);
        signatures.push(signature);
    };

    function encrypt(toIdentity){
        var decryptor = toIdentity.encrypt(mainKeyBuf);
        var toIdentityFp = toIdentity.getFingerprint();
        receivers.push(toIdentityFp);
        decryptors.push(decryptor);
        return true;
    };

    function done(){
        delete self.sign;
        delete self.encrypt;

        var payloadBuf = payloadSerializer.serialize({
            'signers': signers,
            'signatures': signatures,
            'content': plaintextBuf,
        });

        // TODO
        var envelopeBuf = envelopeSerializer.serialize({
            'encrypted': 'boolean',
            'compression': ['enum',[
                'no',
                'lzw',
            ]],
            'receivers': 'shortArray',
            'decryptors': 'array',
            'payload': 'longBinary',
        });
    };

    ////////////////// METHODS FOR A READING INSTANCE ////////////////////

    function decrypt(withIdentity){
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-decrypt');
    };

    function verify(withIdentity){
    };

    return this;
};


/****************************************************************************/
function exporter(){ return new message(); };
tool.set('enigma.message', exporter);
tool.exp('enigma.message', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
