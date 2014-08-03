(function(root){
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

var exporter = {
    concat: concat,
    xor: xor,
};

if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = exporter;
} else {
    define([], function(){
        return exporter;
    });
};
root.util.buffer = exporter;
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
