/*
 * Replace internal random generator
 * =================================
 *
 * This plugin implements an API provided by `enigma-fsbrowser`. It is a
 * new getRandomBytes() function implemented in Python utilizing its
 * `os.urandom` function, which provides cryptographically secure random bytes.
 */
(function(tool){

var supportEnhancement = (
    ('undefined' !== typeof ENIGMA_ENHANCEMENT) &&
    ('undefined' !== typeof ENIGMA_ENHANCEMENT.getRandomBytes)
);

if(supportEnhancement) tool.acc('util.srand.getRandomBytes', function(n){
    return ENIGMA_ENHANCEMENT.getRandomBytes(n);
});

})(tool);
