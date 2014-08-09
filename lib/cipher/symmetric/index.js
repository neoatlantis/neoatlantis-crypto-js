(function(root){
//////////////////////////////////////////////////////////////////////////////
var cipherFileList = [
    'aes',
    'salsa20',
    'camellia',
];

function cipherInitializationCaller(cipherInitializer){
    for(var i=1; i<arguments.length; i++) cipherInitializer(arguments[i]);
    root.cipher.symmetric = cipherInitializer(false);
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var list = [require('./symmetric.js'),];
    for(var i in cipherFileList) 
        list.push(require('./' + cipherFileList[i] + '.js'));
    cipherInitializationCaller.apply(this, list);
} else {
    var list = ['cipher/symmetric/symmetric'];
    for(var i in cipherFileList) 
        list.push('cipher/symmetric/' + cipherFileList[i]);
    require(list, cipherInitializationCaller);
};
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);


