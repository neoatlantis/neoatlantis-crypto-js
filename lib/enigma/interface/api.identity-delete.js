(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];

    list.push(function askFingerprint(){
        return {question: 'text.fingerprint'};
    });

    list.push(function doer(data, answers){
        log('Operation - delete identity, received.');

        var storage = tool.get('enigma.interface.storage')(_storage),
            fingerprint = answers['text.fingerprint'];
        var get = storage.value(fingerprint);

        if(null == get)
            return {terminate: true, error: 'identity-not-found'};

        storage.remove(fingerprint);

        log('Identity [' + fingerprint + '] is deleted.');

        return {terminate: fingerprint};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.fingerprint': {
            type: 'string',
            validate: function(v){
                return /^[0-9a-z]+$/.test(v);
            },
        },
    },
    errors: [
        'identity-not-found',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-delete', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
