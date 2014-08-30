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
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function identity(){
    var self = this;

    var subjectBuf, asymCipher, signatureBuf; 
    var header = new Uint8Array([69, 73]).buffer;

    ////////////////////// STAGE 1 INITIALIZATION ////////////////////////

    this.generate = function(subject, options){
        if(!/^[0-9a-z]{8, 255}$/i.test(subject))
            throw new Error('invalid-subject');

        subjectBuf = tool.get('util.encoding')(subject).toArrayBuffer();

        // TODO read options
        var secret = tool.get('util.srand')().bytes(128);
        asymCipher = tool.get('cipher.asymmetric')('NECRAC256');
        asymCipher.setPrivateKey(secret);

        // TODO move to stage 2.
    };

    this.loadPublic = function(publicIdentityBuf){
    };

    this.loadPrivate = function(secretIdentityBuf, passphrase){
    };

    ////////////////////////// STAGE 2 USAGE ////////////////////////////

    function exportPublic(){
    };

    function exportPrivate(passphrase){
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



//////////////////////////////////////////////////////////////////////////////
})(tool);
