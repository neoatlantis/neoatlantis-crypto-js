(function(root){
//////////////////////////////////////////////////////////////////////////////
if('undefined' == typeof root.util) root.util = {};




function begin(random){
    return root;
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = begin(
        require('./random.js')
    );
} else {
    define([
        'util/random',
    ], begin);
};

//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
