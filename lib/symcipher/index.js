(function(root){
//////////////////////////////////////////////////////////////////////////////
if('undefined' == typeof root.symcipher) root.symcipher = {};




function begin(){
    return root;
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = begin(
        require('./salsa20.js'),
        require('./aes.js')
    );
} else {
    define([
        'symcipher/salsa20',
        'symcipher/aes',
    ], begin);
};

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
