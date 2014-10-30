(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];


    // read in and decode data

    list.push(function askIdentityData(){
        return {question: 'text.data'};
    });

    list.push(function decodeIdentityData(data, answer){
        var decoder = tool.get('util.encoding')(answer['text.data'], 'hex');
        data.identityBuf = decoder.toArrayBuffer();
        return {data: data};
    });


    // read identity

    list.push(function readIdentity(data, answer){
        var isPrivate = false, identity = tool.get('enigma.identity')();
        try{
            isPrivate = identity.canLoadPrivate(data.identityBuf);
        } catch(e){
            console.error(e);
            return {error: 'identity-could-not-be-loaded', terminate: true};
        };

        if(!isPrivate) 
            return {
                data: {isPrivate: false},
                jump: 'loadIdentity',
            };
        return {data: {isPrivate: true}};
    });

    list.push(function askIdentityReadPassphrase(){
        // for decrypting the identity
        return {question: 'text.read-passphrase'};
    });

    
    // load the identity into memory

    list.push(function loadIdentity(data, answer){
        // if isPrivate, try to load the secret part, if failed, throw an
        // error and ask the passphrase again
        var newdata = {};
        newdata.identity = tool.get('enigma.identity')();
        
        try{
            if(data.isPrivate){
                var pinkeyBuf = tool.get('util.encoding')(
                    answer['text.read-passphrase'],
                    'ascii'
                ).toArrayBuffer();
                newdata.identity.loadPrivate(data.identityBuf, pinkeyBuf);
            } else {
                newdata.identity.loadPublic(data.identityBuf);
            };
        } catch(e){
            if('enigma-invalid-pinkey' == e.message)
                return {
                    error: 'identity-could-not-be-loaded',
                    jump: 'askIdentityReadPassphrase',
                };
            if('enigma-identity-invalid' == e.message)
                return {error: 'invalid-identity', terminate: true};
            return {error: 'identity-could-not-be-loaded', terminate: true};
        };

        if(!data.isPrivate) return {data: newdata, jump: 'saveIdentity'};
        return {data: newdata};
    });


    // ask save passphrase when necessary

    list.push(function askPassphrase(){
        // if the identity was private, use this to save the private part
        return {question: 'text.passphrase'};
    });


    // save identity

    list.push(function saveIdentity(data, answer){
        var storage = tool.get('enigma.interface.storage')(_storage);
        var fingerprint = data.identity.getFingerprint(true);

        if(data.isPrivate){
            var passphraseBuf = tool.get('util.encoding')(
                    answer['text.passphrase'],
                    'ascii'
                ).toArrayBuffer();
            var identityBuf = data.identity.exportPrivate(passphraseBuf);
        } else
            var identityBuf = data.identity.exportPublic();

        var identityB64 = tool.get('util.encoding')(identityBuf).toBase64();
        storage.value(fingerprint, identityB64);

        storage.note(fingerprint, 'subject', data.identity.getSubject());
        storage.note(fingerprint, 'isPrivate', data.isPrivate);
        storage.note(fingerprint, 'algorithm', data.identity.getAlgorithm());

        return {terminate: fingerprint};
    });



    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.data': {
            type: 'string',
            validate: function(v){
                return (0 == v.length % 2) && /^[0-9a-f]+$/i.test(v);
            },
        },
        'text.passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
        'text.read-passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
    },
    errors: [
        'identity-could-not-be-loaded',
        'invalid-identity',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-import', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
