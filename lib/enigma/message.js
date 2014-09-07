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
    'compression': ['enum',
        false,
        'lzw',
    ],
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
        signatures = [], signers = [], clearSign = false;

    var payloadBuf;

    /////////////// METHODS FOR INITIALIZING THIS INSTANCE ///////////////

    /* Prepares a encryption by supplying the plaintext. */
    this.write = function(plaintext, options){
        if(!testType(plaintext).isArrayBuffer())
            throw new Error('enigma-invalid-input');
        
        plaintextBuf = plaintext;
        mainKeyBuf = new tool.get('util.srand')().bytes(64);
        clearSign = (options && true === options.clearsign);

        delete self.write;
        delete self.read;
        self.sign = sign;
        if(!clearSign) self.encrypt = encrypt;
        self.done = done;
    };

    /* Prepares a decryption by supplying the ciphertext. */
    this.read = function(textBuf){
        if(!testType(textBuf).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        // see if we can treat the message as something enveloped.
        var isEnvelope = true;
        try{
            var envelopeDeserialized = envelopeSerializer.deserialize(textBuf);
        } catch(e){
            isEnvelope = false;
        };
        if(isEnvelope){
            var dReceivers = envelopeDeserialized.receivers,
                dDecryptors = envelopeDeserialized.decryptors,
                dCompression = envelopeDeserialized.compression,
                dPayload = envelopeDeserialized.payload;

            // get payload: if compressed, decompress.
            if('lzw' == dCompression){
                try{
                    payloadBuf = tool.get('util.decompress')(dPayload);
                } catch(e){
                    throw new Error('enigma-invalid-input');
                };
            } else if(false === dCompression){
                payloadBuf = dPayload;
            } else
                throw new Error('enigma-invalid-input');

            if(dReceivers.length != dDecryptors.length)
                throw new Error('enigma-invalid-input');
   
            if(dReceivers.length > 0){
                // payload needs to be decrypted.
                decryptors = dDecryptors;
                receivers = dReceivers;
                self.decrypt = decrypt;
                self.getReceivers = getReceivers;
                // ... and therefore no more processing.
                return;
            };
            // otherwise, payload is already clear. this needs to be proceeded
            // with following sequence.

            // overwrite textBuf with payloadBuf. 
            textBuf = payloadBuf;
        }; // !! or this is not a envelope at all! continue to unpack payload.

        continueUnpackPayload(textBuf);

        delete self.write;
        delete self.read;
    };

    function continueUnpackPayload(textBuf){
        // this may be called immediate after `this.read`, or after
        // a decryption.

        try{
            var payloadDeserialized = payloadSerializer.deserialize(textBuf);
        } catch(e){
            // payload being here must be readable. ciphertext must have been
            // provided with decryptors, which happens above.
            throw new Error('enigma-invalid-input');
        };
        
        var dSignatures = payloadDeserialized.signatures,
            dSigners = payloadDeserialized.signers,
            dPlaintext = payloadDeserialized.content;

        if(dSignatures.length != dSigners.length)
            throw new Error('enigma-invalid-input');

        plaintextBuf = dPlaintext;
        self.getPlaintext = getPlaintext;

        if(dSigners.length > 0){
            signatures = dSignatures;
            signers = dSigners;
            self.verify = verify;
            self.getSigners = getSigners;
        };
    };

    ////////////////// METHODS FOR A WRITTEN INSTANCE ////////////////////

    function sign(withIdentity){
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-sign');

        var withIdentityFp = withIdentity.getFingerprint();
        var signature = withIdentity.sign(plaintextBuf);
        signers.push(withIdentityFp);
        signatures.push(signature);

        if(signers.length >= 255) delete self.sign;
    };

    function encrypt(toIdentity){
        var decryptor = toIdentity.encrypt(mainKeyBuf);
        var toIdentityFp = toIdentity.getFingerprint();
        receivers.push(toIdentityFp);
        decryptors.push(decryptor);

        if(receivers.length >= 255) delete self.encrypt;
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

        if(clearSign) return payloadBuf;

        
        var compress = 'lzw';
        if(compress){
            payloadBuf = tool.get('util.compress')(payloadBuf);
        };

        var encrypt = (decryptors.length > 0);
        if(encrypt){
            payloadBuf = tool.get('cipher.symmetric')()
                .key(mainKeyBuf)
                .encrypt(payloadBuf)
            ;
        };

        var envelopeBuf = envelopeSerializer.serialize({
            'compression': compress || false,
            'receivers': receivers,
            'decryptors': decryptors,
            'payload': payloadBuf,
        });

        return envelopeBuf;
    };

    ////////////////// METHODS FOR A READING INSTANCE ////////////////////

    function decrypt(withIdentity){
        // decrypt `payloadBuf`. and call `continueUnpackPayload`.
        
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-decrypt');

        var identityFingerprint = withIdentity.getFingerprint(),
            found = false;
        for(var i=0; i<receivers.length; i++){
            if(tool.get('util.buffer').equal(
                identityFingerprint,
                receivers[i]
            )){
                found = true;
                break;
            };
        };

        if(!found) throw new Error('enigma-invalid-identity-for-decrypt');

        var decryptor = decryptors[i];
        try{
            var mainKeyBuf = withIdentity.decrypt(decryptor);
        } catch(e){
            throw new Error('enigma-invalid-identity-for-decrypt');
        };

        try{
            payloadBuf = tool.get('cipher.symmetric')()
                .key(mainKeyBuf)
                .decrypt(payloadBuf)
            ;
        } catch(e){
            throw new Error('enigma-message-corrupted');
        };

        continueUnpackPayload(payloadBuf);
        delete self.decrypt;
        delete self.getReceivers;
    };

    function verify(withIdentity){
        var identityFingerprint = withIdentity.getFingerprint(),
            found = false;
        for(var i=0; i<receivers.length; i++){
            if(tool.get('util.buffer').equal(
                identityFingerprint,
                receivers[i]
            )){
                found = true;
                break;
            };
        };

        if(!found) throw new Error('enigma-invalid-identity-for-verify');

        var signature = signatures[i];
        try{
            return withIdentity.verify(plaintextBuf, signature);
        } catch(e){
            throw new Error('enigma-invalid-identity-for-verify');
        };
    };

    function getPlaintext(){ return plaintextBuf; };
    function getReceivers(){ return receivers; }; // TODO bug for insecurity, copy the array
    function getSigners(){ return signers; }; 

    return this;
};


/****************************************************************************/
function exporter(){ return new message(); };
tool.set('enigma.message', exporter);
tool.exp('enigma.message', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
