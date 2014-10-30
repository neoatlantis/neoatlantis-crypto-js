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
        var isPrivate = false, identity = tool.get('engima.identity');
        try{
            isPrivate = identity.canLoadPrivate(data.identityBuf);
        } catch(e){
            return {error: 'identity-could-not-be-loaded'};
        };

        if(!isPrivate) 
            return {
                data: {isPrivate: isPrivate},
                jump: 'loadIdentity',
            };
        return {data: {isPrivate: isPrivate}};
    });

    list.push(function askIdentitySavePassphrase(){
        return {question: 'text.read-passphrase'};
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
        'identity-not-found',
        'private-identity-not-loaded',
        'identity-could-not-be-loaded',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-import', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
