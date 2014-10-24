(function(tool){
//////////////////////////////////////////////////////////////////////////////


function getTaskList(_storage, log){
    var list = [];

    list.push(function askRawData(){
        return {question: 'text.data'};
    });

    list.push(function prepareMessage(data, answer){
        var dataBuf = tool.get('util.encoding')(answer['text.data'], 'hex')
            .toArrayBuffer();

        data.message = tool.get('enigma.message')();
        
        try{
            data.message.read(dataBuf);
        } catch(e){
            return {error: 'unable-to-read-message', terminate: true};
        };

        return {data: data};
    });


    // try to decrypt the message

    list.push(function tryDecrypt(data, answer){
        // if data.message is not encrypted, jump to verify
        if(undefined == data.message.decrypt) return {jump: 'tryVerify'};

        log('Decryption needed.');

        var storage = tool.get('enigma.interface.storage')(_storage);
        
        var receivers = data.message.getReceivers(); // fingerprints in string
        var fingerprint;
        var tryIdentities = [];
        for(var i in receivers){
            if(!/^[0-9a-z]+$/i.test(receivers[i])) continue;
            fingerprint = receivers[i];
            if(true != storage.note(fingerprint, 'isPrivate')) continue;
            tryIdentities.push(fingerprint);
        };

        return {data: {decrypt: tryIdentities}};
    });

    list.push(function askDecryptPassphrase(data, answer){
        // ask passphrase for one possible decrypting identity
        if(data.decrypt.length < 1){
            log('No more identity to try for decryption. End.');
            return {error: 'no-identity-to-decrypt', terminate: true};
        };

        var storage = tool.get('enigma.interface.storage')(_storage);
        log('Try to decrypt with identity, fingerprint=' + data.decrypt[0]);
        return {
            question: 'text.passphrase', 
            hint: {
                fingerprint: data.decrypt[0],
                subject: storage.note(data.decrypt[0], 'subject'),
            },
        };
    });

    list.push(function doDecryptWithPassphrase(data, answer){
        var identityLoader = tool.get(
            'enigma.interface.api.message.common.loadIdentity'
        );
        
        // try to load this identity
        try{
            var identity = identityLoader(
                _storage,
                data.decrypt[0],
                tool.get('util.encoding')(
                    answer['text.passphrase'],
                    'ascii'
                ).toArrayBuffer()
            );
            if(!identity)
                return {
                    error: 'unable-to-load-identity',
                    jump: 'askDecryptPassphrase'
                };
        } catch(e){
            return {
                error: 'unable-to-load-identity',
                jump: 'askDecryptPassphrase'
            };
        };

        // identity successfully loaded, try use it to decrypt
        try{
            data.message.decrypt(identity);
        } catch(e){
            // when decryption is not successful...
            if('enigma-message-corrupted' == e.message){
                // message itself is corrputed. terminate the progress.
                return {
                    error: 'message-corrupted',
                    terminate: true,
                };
            } else {
                // identity cannot be used to decrypt. remove the used identity
                // from list and goto ask another
                data.decrypt.shift();
                return {
                    data: {decrypt: data.decrypt},
                    jump: 'askDecryptPassphrase',
                    error: 'wrong-identity-to-decrypt',
                };
            };
        };

        return {};
    });


    // try to verify the message if possible

    list.push(function tryVerify(data, answer){
        // if `verify` not shown, directly goto doer to produce result.
        if(undefined == data.message.verify){
            log('Verification jumped, reason: no signature found.');
            return {data: {verify: {}}, jump: 'doer'};
        };

        log('Verification possible.');

        var identityLoader = tool.get(
            'enigma.interface.api.message.common.loadIdentity'
        );

        var result = {};
        var signers = data.message.getSigners();
        for(var i in signers){
            result[signers[i]] = false;

            // try to load this identity
            try{
                var identity = identityLoader(
                    _storage,
                    signers[i],
                    false
                );
                if(!identity) continue;
            } catch(e){
                continue;
            };

            // try to validate
            try{
                if(true === data.message.verify(identity))
                    result[signers[i]] = true;
            } catch(e){
            };
        };

        return {data: {verify: result}};
    });


    // produce the message
    list.push(function doer(data, answer){
        var ret = {};
        
        ret.plaintext = tool.get('util.encoding')(data.message.getPlaintext())
            .toHEX();
        ret.verify = data.verify;

        return {terminate: ret};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.data': {
            type: 'string',
            validate: function(v){
                return 0 == v.length % 2 && /^[0-9a-f]+$/i.test(v);
            },
        },
        'text.passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
    },
    errors: [
        'unable-to-read-message',
        'unable-to-load-identity',
        'no-identity-to-decrypt',
        'message-corrupted',
        'wrong-identity-to-decrypt',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.message-read', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
