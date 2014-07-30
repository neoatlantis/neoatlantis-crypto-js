(function(root){
//////////////////////////////////////////////////////////////////////////////

function encoding(){
};


if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = encoding;
} else {
    define([], function(){
        return encoding;
    });
};
root.util.encoding = encoding;
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
