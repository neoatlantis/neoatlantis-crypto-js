(function(root){
//////////////////////////////////////////////////////////////////////////////
var cipherFileList = [
    'ec/ec'
];
//////////////////////////////////////////////////////////////////////////////
function cipherInitializationCaller(cipherInitializer){
    for(var i=1; i<arguments.length; i++) cipherInitializer(arguments[i]);
    root.cipher.asymmetric = cipherInitializer(false);
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var list = [require('./asymmetric.js'),];
    for(var i in cipherFileList) 
        list.push(require('./' + cipherFileList[i] + '.js'));
    cipherInitializationCaller.apply(this, list);
} else {
    var list = ['cipher/asymmetric/asymmetric'];
    for(var i in cipherFileList) 
        list.push('cipher/asymmetric/' + cipherFileList[i]);
    require(list, cipherInitializationCaller);
};
//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
