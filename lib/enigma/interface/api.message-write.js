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
        data.message.write(dataBuf);
        return {data: data};
    });


    // loop to add 'encrypt-to'
    
    list.push(function askAddEncrypt(){
        return {question: 'option.add-encrypt'};
    });

    list.push(function askEncryptToFingerprint(data, answer){
        if(!answer['option.add-encrypt']) return {jump: 'askAddSign'};
        return {question: 'text.fingerprint'};
    });

    list.push(function addEncrypt(data, answer){
        var identityLoader = tool.get(
            'enigma.interface.api.message.common.loadIdentity'
        );

        try{
            var identity = identityLoader(
                _storage,
                answer['text.fingerprint'],
                false
            );
            if(!identity)
                return {
                    error: 'unable-to-load-identity',
                    jump: 'askAddEncrypt'
                };
        } catch(e){
            return {error: 'unable-to-load-identity', jump: 'askAddEncrypt'};
        };

        try{
            data.message.encrypt(identity);
        } catch(e){
            return {
                error: 'unable-to-encrypt-using-this-identity',
                jump: 'askAddEncrypt',
            };
        };

        return {jump: 'askAddEncrypt'};
    });


    // loop to add 'sign-with'

    list.push(function askAddSign(){
        return {question: 'option.add-sign'};
    });

    list.push(function askSignWithFingerprint(data, answer){
        if(!answer['option.add-sign']) return {jump: 'doer'};
        return {question: 'text.fingerprint'};
    });

    list.push(function askSignWithPassphrase(data, answer){
        return {question: 'text.passphrase'};
    });

    list.push(function addSign(data, answer){
        var identityLoader = tool.get(
            'enigma.interface.api.message.common.loadIdentity'
        );

        try{
            var identity = identityLoader(
                _storage,
                answer['text.fingerprint'],
                tool.get('util.encoding')(
                    answer['text.passphrase'],
                    'ascii'
                ).toArrayBuffer()
            );
            if(!identity)
                return {
                    error: 'unable-to-load-identity',
                    jump: 'askAddSign'
                };
        } catch(e){
            return {error: 'unable-to-load-identity', jump: 'askAddSign'};
        };

        try{
            data.message.sign(identity);
        } catch(e){
            return {
                error: 'unable-to-sign-using-this-identity',
                jump: 'askAddSign',
            };
        };

        return {jump: 'askAddSign'};
    });


    // produce the message
    list.push(function doer(data, answer){
        if(undefined == data.message.done)
            return {error: 'nothing-to-do', terminate: true};

        var result = data.message.done();
        var resultHEX = tool.get('util.encoding')(result).toHEX();
        return {terminate: resultHEX};
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
        'option.add-encrypt': 'boolean',
        'option.add-sign': 'boolean',
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
    },
    errors: [
        'unable-to-load-identity',
        'unable-to-encrypt-using-this-identity',
        'unable-to-sign-using-this-identity',
        'nothing-to-do',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.message-write', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
