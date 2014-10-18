(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(storage, log){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'options.list-include-private-identities'}
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.list-include-public-identities'}
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.filter-by-keywords'}
    });

    list.push(function doer(data, answers){
        
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'options.list-include-private-identities': 'boolean',
        'options.list-include-public-identities': 'boolean',
        'options.filter-by-keywords': 'string',
    },
    errors: {
    },
    constructor: function(storage){
        return getTaskList(storage);
    },
};
tool.set('enigma.interface.api.identity-list', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
