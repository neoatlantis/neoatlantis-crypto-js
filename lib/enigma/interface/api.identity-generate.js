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

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'text.subject': {
            type: 'string',
            validate: function(v){ return /^[0-9a-z\s]{8,255}$/i.test(v); },
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
