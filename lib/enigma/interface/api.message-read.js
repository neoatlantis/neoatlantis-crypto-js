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

    list.push(function tryDecrypt(data, answer){
        // if data.message is not encrypted, jump to verify
        if(undefined == data.message.decrypt) return {jump: 'tryVerify'};

        var storage = tool.get('enigma.interface.storage')(_storage);
        
        var receivers = data.message.getReceivers(); // fingerprints in string
        var fingerprint;
        var tryIdentities = {};
        for(var i in receivers){
            if(!/^[0-9a-z]+$/i.test(receivers[i])) continue;
            fingerprint = receivers[i];
            if(true != storage.note(fingerprint, 'isPrivate')) continue;
            tryIdentities[fingerprint] = storage.note(fingerprint, 'subject');
        };

        
        
    });


    // produce the message
    list.push(function doer(data, answer){
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
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.message-read', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
