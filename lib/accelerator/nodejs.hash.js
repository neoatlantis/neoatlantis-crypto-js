/*
 * Acceleration under NodeJS
 */
(function(tool){
if(!tool.get('env.isNode')) return;

//////////////////////////////////////////////////////////////////////////////

try{
    var createHash = require('crypto').createHash,
        buffer = require('buffer');
} catch(e){
    return;
};

var supportWhirlpool = true;
try{
    createHash('whirlpool');
} catch(e){
    supportWhirlpool = false;
};

var supportRipemd160 = true;
try{
    createHash('ripemd160');
} catch(e){
    supportRipemd160 = false;
};

/* Whirlpool Hash Acceleration */
if(supportWhirlpool) tool.acc('hash.algorithms.whirlpool', function(){
    var self = this;

    this.name = 'WHIRLPOOL';
    this.blockSize = 64;
    this.digestSize = 64;

    this.hash = function(dataBuf){
        var hasher = createHash('whirlpool');
        hasher.update(new buffer.Buffer(new Uint8Array(dataBuf)));
        var ret = hasher.digest(), retary = new Uint8Array(ret.length);
        for(var i=0; i<retary.length; i++) retary[i] = ret[i];
        return retary.buffer;
    };

    return this;
});

/* RIPEMD160 Hash Acceleration */
if(supportWhirlpool) tool.acc('hash.algorithms.ripemd160', function(){
    var self = this;

    this.name = 'RIPEMD160';
    this.blockSize = 64;
    this.digestSize = 20;

    this.hash = function(dataBuf){
        var hasher = createHash('ripemd160');
        hasher.update(new buffer.Buffer(new Uint8Array(dataBuf)));
        var ret = hasher.digest(), retary = new Uint8Array(ret.length);
        for(var i=0; i<retary.length; i++) retary[i] = ret[i];
        return retary.buffer;
    };

    return this;
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
