(function(tool){
//////////////////////////////////////////////////////////////////////////////

function concat(ary){
    var i, j, count=0, buf;
    for(i=0; i<ary.length; i++) count += ary[i].byteLength;
    
    var concat = new Uint8Array(count), pointer = 0;
    for(i=0; i<ary.length; i++){
        buf = new Uint8Array(ary[i]);
        for(j=0; j<buf.length; j++){
            concat[pointer] = buf[j];
            pointer += 1;
        };
    };
    return concat.buffer;       
};

function xor(a, b){
    if(a.byteLength != b.byteLength) throw Error('xor-unequal-length-buffer');
    var product = new Uint8Array(a.byteLength),
        ab = new Uint8Array(a),
        bb = new Uint8Array(b);
    for(var i=0; i<product.length; i++)
        product[i] = ab[i] ^ bb[i];
    return product.buffer;
};

function equal(a, b){
    try{
        var x = new Uint8Array(a), y = new Uint8Array(b);
    } catch(e){
        return false;
    };
    if(x.length != y.length) return false;
    for(var i=0; i<x.length; i++)
        if(x[i] != y[i]) return false;
    return true;
};

function reverse(b){
    var buffer = new Uint8Array(b);
    var max = buffer.length - 1, mid = Math.floor(max / 2);
    var r = max, t;
    for(var l=0; l<=mid; l++){
        t = buffer[l];
        buffer[l] = buffer[r];
        buffer[r] = t;
        r -= 1;
    };
    return buffer.buffer;
};

var exporter = {
    concat: concat,
    xor: xor,
    equal: equal,
    reverse: reverse,
};

tool.set('util.buffer', exporter);
tool.exp('util.buffer', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
