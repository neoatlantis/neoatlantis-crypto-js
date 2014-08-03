(function(root){
//////////////////////////////////////////////////////////////////////////////
if('undefined' == typeof root.util) root.util = {};




function begin(){
    return root;
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = begin(
        require('./type.js'),
        require('./buffer.js'),
        require('./random.js'),
        require('./encoding.js')
    );
} else {
    define([
        'util/type',
        'util/buffer',
        'util/random',
        'util/encoding',
    ], begin);
};

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
