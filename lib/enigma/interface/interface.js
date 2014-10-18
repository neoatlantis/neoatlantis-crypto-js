/*
 * Interface of enigma high-level interface
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////
var loadAPI = [
    'identity-list',
    'identity-generate',
    'identity-import',
    'identity-export',
    'identity-delete',

    'message-write',
    'message-read',
];

function initializer(options){

    var translator = options.translator,
        storage = options.storage;

    
    return function(apiName){
        if(loadAPI.indexOf(apiName) < 0) throw new Error('Unknown API');
        
    };
};

tool.exp('enigma.interface', initializer);
//////////////////////////////////////////////////////////////////////////////
})(tool);
