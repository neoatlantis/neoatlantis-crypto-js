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
//////////////////////////////////////////////////////////////////////////////
if('undefined' != typeof module && 'undefined' != typeof module.exports){
    root.hash = require('./hash.js');
} else {
    require(['hash/hash'], function(h){
        root.hash = h;
        return root.hash;
    });
};
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
