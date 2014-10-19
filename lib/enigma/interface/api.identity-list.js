(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(storage, log){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'options.list-include-private-identities'};
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.list-include-public-identities'};
    });

    list.push(function checkOptionCompatibility(data, answers){
        if(!(
            answers['options.list-include-private-identities'] ||
            answers['options.list-include-public-identities']
        ))
            return {
                error: 'option-results-in-empty-return',
                jump: 'askOptionIncludePrivate',
            };
        return {data: {}};
    });


    list.push(function askOptionIncludePublic(){
        return {question: 'options.filter-by-keywords'};
    });

    list.push(function doer(data, answers){
        log('Operation - listing identity, received.');
        if(answers['options.list-include-private-identities'])  
            log('The list will include private identities.');
        if(answers['options.list-include-public-identities'])  
            log('The list will include public identities.');
        log('Following keywords will be used to filter the subject:\n ' +
            answers['options.filter-by-keywords']);

        return {terminate: true, data: 'test'};
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
    errors: [
        'option-results-in-empty-return',
    ],
    constructor: function(storage, log){
        return getTaskList(storage, log);
    },
};
tool.set('enigma.interface.api.identity-list', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
