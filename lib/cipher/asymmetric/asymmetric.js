(function(root){
//////////////////////////////////////////////////////////////////////////////

var cipherToolkit = {};



/****************************************************************************/

function cipherInitializer(cipherConf){
    if(cipherConf){
        root.util.log.notice('Load asymmetric cipher component: [' + cipherConf.name + ']'); //    XXX
        cipherToolkit[cipherConf.name] = cipherConf.constructor;
        return;
    };

    if(
        'undefined' != typeof cipherToolkit['EC']
    ){
        root.util.log.notice('Asymmetric ciphers ready.');
        return function(){
            return new NCSC512();
        };
    };
    
    return null;
};


if('undefined' != typeof module && 'undefined' != typeof module.exports)
    module.exports = cipherInitializer;
else
    define([], function(){
        return cipherInitializer;
    });

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
