(function(root){

var exporter = {
    notice: function(x){console.log(x);},
    error: function(x){console.error(x);},
};


if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = exporter;
} else {
    define([], function(){
        return exporter;
    });
};

root.util.log = exporter;
})(__enigma_jscrypto__);
