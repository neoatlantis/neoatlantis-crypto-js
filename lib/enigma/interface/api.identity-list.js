(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(storage){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'options.list-include-private-identities'}
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.list-include-public-identities'}
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
