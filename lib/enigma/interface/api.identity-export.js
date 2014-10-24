(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];

    list.push(function askFingerprint(){
        return {data: {}, question: 'text.fingerprint'};
    });

    list.push(function checkIfPrivate(data, answers){
        var storage = tool.get('enigma.interface.storage')(_storage);
        var fingerprint = answers['text.fingerprint'];
        var isPrivate = storage.note(fingerprint, 'isPrivate');

        if(null === isPrivate)
            return {terminate: true, error: 'identity-not-found'};
        
        data.isPrivate = isPrivate;
        if(!isPrivate) return {data: data, jump: 'doer'};
        return {data: data};
    });


    list.push(function askIfIncludePrivate(){
        return {question: 'option.include-private'};
    });

    list.push(function determineAskPassphrase(data, answers){
        if(!answers['option.include-private']) 
            return {jump: 'doer'};
        return {};
    });

    list.push(function askPassphrase(){
        return {question: 'text.passphrase'};
    });

    list.push(function askSavePassphrase(){
        return {question: 'text.save-passphrase'};
    });


    list.push(function doer(data, answers){
        log('Operation - export identity, received.');

        var storage = tool.get('enigma.interface.storage')(_storage),
            fingerprint = answers['text.fingerprint'];
        var get = storage.value(fingerprint);

        var loadPrivate = true, passphraseBuf, savePassphraseBuf;
        if(false === data.isPrivate)
            loadPrivate = false;
        else if(!answers['option.include-private'])
            loadPrivate = false;
        else {
            passphraseBuf = tool.get('util.encoding')(
                answers['text.passphrase'],
                'ascii'
            )
                .toArrayBuffer();
            savePassphraseBuf = tool.get('util.encoding')(
                answers['text.save-passphrase'],
                'ascii'
            )
                .toArrayBuffer();
        };

        if(null == get)
            return {terminate: true, error: 'identity-not-found'};

        try{
            var identitySerializedBuf = 
                tool.get('util.encoding')(get, 'base64').toArrayBuffer();
            var identity = tool.get('enigma.identity')();

            console.log(get);

            if(loadPrivate){
                log('Private identity is being read.');
                identity.loadPrivate(identitySerializedBuf, passphraseBuf);
            } else {
                log('Public identity is being read.');
                identity.loadPublic(identitySerializedBuf);
            };
        } catch(e){
            console.log(e);
            return {error: 'identity-could-not-be-loaded', terminate: true};
        };
        

        if(loadPrivate){
            var exportBuf = identity.exportPrivate(savePassphraseBuf);
        } else {
            var exportBuf = identity.exportPublic();
        };

        var exportHEX = tool.get('util.encoding')(exportBuf).toHEX();
        return {terminate: exportHEX};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.fingerprint': {
            type: 'string',
            validate: function(v){
                return /^[0-9a-z]+$/i.test(v);
            },
        },
        'text.passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
        'text.save-passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
        'option.include-private': 'boolean',
    },
    errors: [
        'identity-not-found',
        'identity-could-not-be-loaded',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-export', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
