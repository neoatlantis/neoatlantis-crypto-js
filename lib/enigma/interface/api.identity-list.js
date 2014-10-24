(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(_storage, log){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'option.list-private-identities-only'};
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'option.filter-by-keywords'};
    });

    list.push(function doer(data, answers){
        log('Operation - listing identity, received.');
        if(answers['option.list-private-identities-only'])  
            log('The list will ONLY include private identities.');
        log('Following keywords will be used to filter the subject:\n ' +
            answers['option.filter-by-keywords']);

        var filter = false;
        if(answers['option.filter-by-keywords'])
            filter = answers['option.filter-by-keywords']
                .toLowerCase().split(' ');

        var storage = tool.get('enigma.interface.storage')(_storage),
            listAllFingerprints = storage.all();

        var ret = {}, fingerprint, subject, isPrivate;
        var subjectLow, filtered = false;
        for(var i in listAllFingerprints){
            fingerprint = listAllFingerprints[i];
            isPrivate = storage.note(fingerprint, 'isPrivate');
            subject = storage.note(fingerprint, 'subject');

            if(answers['option.list-private-identities-only'] && !isPrivate)
                continue;

            if(filter){
                subjectLow = subject.toLowerCase();
                filtered = false;
                for(var j in filter){
                    if(!filter[j]) continue;
                    if(subjectLow.indexOf(filter[j]) < 0){
                        filtered = true;
                        break;
                    };
                };
                if(filtered) continue;
            };
            
            ret[fingerprint] = {
                'private': isPrivate,
                'subject': subject,
                'fingerprint': fingerprint,
            };
        };


        return {terminate: ret};
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'option.list-private-identities-only': 'boolean',
        'option.filter-by-keywords': 'string',
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
