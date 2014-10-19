(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'options.list-private-identities-only'};
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.filter-by-keywords'};
    });

    list.push(function doer(data, answers){
        log('Operation - listing identity, received.');
        if(answers['options.list-private-identities-only'])  
            log('The list will ONLY include private identities.');
        log('Following keywords will be used to filter the subject:\n ' +
            answers['options.filter-by-keywords']);

        var storage = tool.get('enigma.interface.storage')(_storage),
            listAllFingerprints = storage.all();

        var ret = {}, fingerprint, subject, isPrivate;
        for(var i in listAllFingerprints){
            fingerprint = listAllFingerprints[i];
            isPrivate = storage.note(fingerprint, 'isPrivate');
            subject = storage.note(fingerprint, 'subject');
            
            if(answers['options.list-private-identities-only'] && !isPrivate)
                continue;

            ret[fingerprint] = {
                'private': isPrivate,
                'subject': subject,
                'fingerprint': fingerprint,
            };
        };


        return {terminate: true, data: ret};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'options.list-private-identities-only': 'boolean',
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
