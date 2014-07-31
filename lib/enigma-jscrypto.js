__enigma_jscrypto__ = {};
(function(root){
//////////////////////////////////////////////////////////////////////////////

function begin(util){
    return root;
};

if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = begin(
        require('./util/index.js'),
        require('./symcipher/index.js')
    );
} else {
    define([
        'util/index',
        'symcipher/index',
    ], begin);
};

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
