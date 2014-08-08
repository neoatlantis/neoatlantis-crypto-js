(function(root){

var exporter = {
    notice: console.log,
    error: console.error,
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
