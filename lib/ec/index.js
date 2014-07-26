/*
 * Interface to ECDSA and ECDH
 */
var ec = require('./ec.js');
module.exports = function(curveName){
    return new ec(curveName);
};
