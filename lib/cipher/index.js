(function(root){
//////////////////////////////////////////////////////////////////////////////

if(!root.cipher) root.cipher = {};

if('undefined' != typeof module && 'undefined' != typeof module.exports){
    require('./symmetric/index.js');
//    require('./asymmetric/index.js');
} else {
    define([
        'cipher/symmetric/index',
//        'cipher/asymmetric/index',
    ], function(){});
};

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
