/*
 * a blocking random bytes generator
 */
(function(root){
//////////////////////////////////////////////////////////////////////////////

/* use Salsa20 core to mix our random seeds */
function R(a, b){return (((a) << (b)) | ((a) >>> (32 - (b))));};
function salsa20Core(ina, ret){
    // Salsa20 Core Word Specification
    var i; //ret = new Uint32Array(16);
    var x = new Uint32Array(16);
    for (i=0; i<16; i++) x[i] = ina[i];
    for (i=0; i<20; i++){
        x[ 4] ^= R(x[ 0]+x[12], 7);  x[ 8] ^= R(x[ 4]+x[ 0], 9);
        x[12] ^= R(x[ 8]+x[ 4],13);  x[ 0] ^= R(x[12]+x[ 8],18);
        x[ 9] ^= R(x[ 5]+x[ 1], 7);  x[13] ^= R(x[ 9]+x[ 5], 9);
        x[ 1] ^= R(x[13]+x[ 9],13);  x[ 5] ^= R(x[ 1]+x[13],18);
        x[14] ^= R(x[10]+x[ 6], 7);  x[ 2] ^= R(x[14]+x[10], 9);
        x[ 6] ^= R(x[ 2]+x[14],13);  x[10] ^= R(x[ 6]+x[ 2],18);
        x[ 3] ^= R(x[15]+x[11], 7);  x[ 7] ^= R(x[ 3]+x[15], 9);
        x[11] ^= R(x[ 7]+x[ 3],13);  x[15] ^= R(x[11]+x[ 7],18);
        x[ 1] ^= R(x[ 0]+x[ 3], 7);  x[ 2] ^= R(x[ 1]+x[ 0], 9);
        x[ 3] ^= R(x[ 2]+x[ 1],13);  x[ 0] ^= R(x[ 3]+x[ 2],18);
        x[ 6] ^= R(x[ 5]+x[ 4], 7);  x[ 7] ^= R(x[ 6]+x[ 5], 9);
        x[ 4] ^= R(x[ 7]+x[ 6],13);  x[ 5] ^= R(x[ 4]+x[ 7],18);
        x[11] ^= R(x[10]+x[ 9], 7);  x[ 8] ^= R(x[11]+x[10], 9);
        x[ 9] ^= R(x[ 8]+x[11],13);  x[10] ^= R(x[ 9]+x[ 8],18);
        x[12] ^= R(x[15]+x[14], 7);  x[13] ^= R(x[12]+x[15], 9);
        x[14] ^= R(x[13]+x[12],13);  x[15] ^= R(x[14]+x[13],18);
    };

    for(i=0; i<16; i++) ret[i] = x[i] + ina[i];
};

/* nonce, identifies the use */
var nonce = new Uint8Array(16);
function nonceNew(){
    for(var i=0; i<16; i++) nonce[i] = Math.floor(256 * Math.random());
};
nonceNew();


/* usage counter */
var counter = new Uint32Array([0, 0]);
function counterReset(){counter[0] = 0; counter[1] = 0;};
function counterInc(){
    counter[0] += 1;
    if(0 == counter[0]) counter[1] += 1;
    if(0 == counter[1]) nonceNew(); // not very likely to happen.
};


/* general random pool */
var randomPool = new Uint8Array(32), randomPoolCursor = 0;
function randomPoolUpdate(newByte){
    randomPool[randomPoolCursor] = newByte;
    randomPoolCursor += 1;
    if(randomPoolCursor >= 32){
        counterReset();
        randomPoolCursor = 0;
    };
};
for(var i=0; i<32; i++) randomPoolUpdate(Math.floor(256 * Math.random()));


/* random pool filler by touch */
function feedRandomPoolByTouch(){
    randomPoolUpdate(new Date().getTime() % 256);
};
setInterval(feedRandomPoolByTouch, 100);


/* random mixer */
var sigma = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
function getRandomBlock(ret){
    var input = new Uint32Array(16),
        nonce2 = new Uint32Array(nonce.buffer),
        key8 = new Uint32Array(randomPool.buffer);

    input[0]  = sigma[0];
    input[1]  = key8[0];
    input[2]  = key8[1];
    input[3]  = key8[2];
    input[4]  = key8[3];
    input[5]  = sigma[1];

    input[6]  = nonce2[0];
    input[7]  = nonce2[1];
    input[8]  = counter[0];
    input[9]  = counter[1];

    input[10] = sigma[2];
    input[11] = key8[4];
    input[12] = key8[5];
    input[13] = key8[6];
    input[14] = key8[7];
    input[15] = sigma[3];

    counterInc();
    return salsa20Core(input, ret);
};


/* secure random interface */
function srand(){
    var self = this;

    var pool = new Uint32Array(16);

    this.touch = function(){
        feedRandomPoolByTouch();
    };

    this.bytes = function(count){
        var max = Math.ceil(count / 64);
        var output = new Uint8Array(count), j=0, k=0, transArray;
        for(var i=0; i<max; i++){
            getRandomBlock(pool);
            transArray = new Uint8Array(pool.buffer);
            for(j=0; j<64; j++){
                if(k >= count) break;
                output[k] = transArray[j];
                k += 1;
            };
        };
        return output;
    };

    this.array = function(count){
        return self.bytes(count);
    };

    return this;
};



if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = srand;
} else {
    define([], function(){
        return srand;
    });
};
root.util.srand = srand;
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
