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

function message(){
    var self = this;

    /////////////// METHODS FOR INITIALIZING THIS INSTANCE ///////////////

    /* Prepares a encryption by supplying the plaintext. */
    this.write = function(plaintextBuf){
    };

    /* Prepares a decryption by supplying the ciphertext. */
    this.read = function(ciphertextBuf){
    };

    ////////////////// METHODS FOR A WRITTEN INSTANCE ////////////////////

    function sign(withIdentity){
    };

    function encrypt(toIdentity){
    };

    function writeDone(){
    };

    ////////////////// METHODS FOR A READING INSTANCE ////////////////////

    function decrypt(withIdentity){
    };

    function verify(withIdentity){
    };

    return this;
};


/****************************************************************************/
function exporter(){ return new message(); };
tool.exp('enigma.message', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
