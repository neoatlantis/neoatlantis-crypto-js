(function(){
//////////////////////////////////////////////////////////////////////////////
'use strict'


//*** UMD BEGIN
if (typeof define !== 'undefined' && define.amd) { //require.js / AMD
  define([], function() {
    return secureRandom
  })
} else if (typeof module !== 'undefined' && module.exports) { //CommonJS
  module.exports = secureRandom;
}
//*** UMD END

//options.array is the only valid option
function secureRandom(count, options) {
    options = options || {}
    //we check for process.pid to prevent browserify from tricking us
    var buf = $.crypto.random.bytes(count);

    if (options.array) 
        var ret = []
    else
        var ret = new Uint8Array(count)

    for (var i = 0; i < count; ++i) {
    ret[i] = buf.readUInt8(i)
    }

    return ret
}




//////////////////////////////////////////////////////////////////////////////
})();
