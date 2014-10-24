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
        data.message.read(dataBuf);
        return {data: data};
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
        'unable-to-load-identity',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.message-read', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
