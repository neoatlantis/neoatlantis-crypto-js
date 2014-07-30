(function(root){
//////////////////////////////////////////////////////////////////////////////

function encoding(i, format){
    var self = this;


    function toArray(){
    };

    function toUTF16(){
    };

    function toBase64(){
    };

    return this;
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
