(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];

    list.push(function askSubject(){
        return {question: 'text.subject'};
    });

    list.push(function askAlgorithm(){
        return {question: 'select.algorithm'};
    });

    list.push(function askPassphrase(){
        return {question: 'text.passphrase'};
    });

    list.push(function generateIdentity(data, answer){
        var storage = tool.get('enigma.interface.storage')(_storage);
        var newIdentity = tool.get('enigma.identity')(),
            passphrase = tool.get('util.encoding')(
                answer['text.passphrase'],
                'ascii'
            ).toArrayBuffer();

        newIdentity.generate(
            answer['text.subject'],
            {
                algorithm: answer['select.algorithm'],
            }
        );

        var newFingerprint = newIdentity.getFingerprint(true),
            newIdentitySerializedBuf = newIdentity.exportPrivate(passphrase);
        var newIdentitySerializedB64 = tool.get('util.encoding')(
                newIdentitySerializedBuf
            ).toBase64();

        storage.value(newFingerprint, newIdentitySerializedB64);

        storage.note(newFingerprint, 'subject', answer['text.subject']);
        storage.note(newFingerprint, 'isPrivate', true);
        storage.note(newFingerprint, 'algorithm', answer['select.algorithm']);

        return {terminate: newFingerprint};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.subject': {
            type: 'string',
            validate: function(v){ return /^[0-9a-z\s]{8,255}$/i.test(v); },
        },
        'text.passphrase': {
            type: 'string',
            validate: function(v){ return /^[\x20-\x7E]{32,}$/.test(v); },
        },
        'select.algorithm': ['enum', [
            'NECRAC256',
            'NECRAC192',
            'NECRAC128',
            'NECRAC112',
            'NECRAC96'
        ]],
    },
    errors: [
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-generate', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
