/*
 * `__enigma_jscrypto__.hash`  is a function, usage like:
 *
 *      __enigma_jscrypto__.hash(ALGORITHM).hash(STRING).digest()
 *                                                      .hexdigest()
 *                                         .mac(STRING, KEY)
 *                                                      .digest()
 *                                                      .hexdigest()
 */

(function(root){
var hashFuncFileList = [
    'blake2s',
];
//////////////////////////////////////////////////////////////////////////////
function hashInitializationCaller(hashInitializer){
    /*
     * gets the modules from the second passed argument. using module calling
     * the `hashInitializer` special function will register the module. When a
     * `false` is passed, the real hash do-er is returned, which will be
     * assigned to `root.hash`.
     */
    for(var i=1; i<arguments.length; i++) hashInitializer(arguments[i]);
    root.hash = hashInitializer(false);
};




if('undefined' != typeof module && 'undefined' != typeof module.exports){
    var list = [require('./hash.js'),];
    for(var i in hashFuncFileList) 
        list.push(require('./' + hashFuncFileList[i] + '.js'));
    hashInitializationCaller.apply(this, list);
} else {
    var list = ['hash/hash'];
    for(var i in hashFuncFileList) list.push('hash/' + hashFuncFileList[i]);
    require(list, hashInitializationCaller);
};
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
