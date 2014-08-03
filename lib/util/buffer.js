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

var exporter = {
    concat: concat,
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
