/* chacha20 - 256 bits */

// Written in 2014 by Devi Mandiri. Public domain.
// Modified by NeoAtlantis, 2015. Licensed under GPLv3.
//
// Implementation derived from chacha-ref.c version 20080118
// See for details: http://cr.yp.to/chacha/chacha-20080128.pdf
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function U8TO32_LE(x, i) {
    return x[i] | (x[i+1]<<8) | (x[i+2]<<16) | (x[i+3]<<24);
};

function U32TO8_LE(x, i, u) {
    x[i]   = u; u >>>= 8;
    x[i+1] = u; u >>>= 8;
    x[i+2] = u; u >>>= 8;
    x[i+3] = u;
};

function ROTATE(v, c) { return (v << c) | (v >>> (32 - c));};

var Chacha20 = function(rounds, key, nonce, counter) {
    this.input = new Uint32Array(16);
    this._rounds = rounds;

    // https://tools.ietf.org/html/draft-irtf-cfrg-chacha20-poly1305-01#section-2.3

    this.input[0] = 1634760805;
    this.input[1] =  857760878;
    this.input[2] = 2036477234;
    this.input[3] = 1797285236;
    this.input[4] = U8TO32_LE(key, 0);
    this.input[5] = U8TO32_LE(key, 4);
    this.input[6] = U8TO32_LE(key, 8);
    this.input[7] = U8TO32_LE(key, 12);
    this.input[8] = U8TO32_LE(key, 16);
    this.input[9] = U8TO32_LE(key, 20);
    this.input[10] = U8TO32_LE(key, 24);
    this.input[11] = U8TO32_LE(key, 28);

  // be compatible with the reference ChaCha depending on the nonce size
    if(12 == nonce.length){
        this.input[12] = counter;
        this.input[13] = U8TO32_LE(nonce, 0);
        this.input[14] = U8TO32_LE(nonce, 4);
        this.input[15] = U8TO32_LE(nonce, 8);
    } else {
        this.input[12] = counter;
        this.input[13] = 0;
        this.input[14] = U8TO32_LE(nonce, 0);
        this.input[15] = U8TO32_LE(nonce, 4);
    };
};

Chacha20.prototype.quarterRound = function(x, a, b, c, d){
    x[a] += x[b]; x[d] = ROTATE(x[d] ^ x[a], 16);
    x[c] += x[d]; x[b] = ROTATE(x[b] ^ x[c], 12);
    x[a] += x[b]; x[d] = ROTATE(x[d] ^ x[a],  8);
    x[c] += x[d]; x[b] = ROTATE(x[b] ^ x[c],  7);
};

Chacha20.prototype.encrypt = function(dst, src, len) {
    var x = new Uint32Array(16);
    var output = new Uint8Array(64);
    var i, dpos = 0, spos = 0;

    while (len > 0 ){
        for (i = 16; i--;) x[i] = this.input[i];
        for (i = this._rounds; i > 0; i -= 2){
            this.quarterRound(x, 0, 4, 8,12);
            this.quarterRound(x, 1, 5, 9,13);
            this.quarterRound(x, 2, 6,10,14);
            this.quarterRound(x, 3, 7,11,15);
            this.quarterRound(x, 0, 5,10,15);
            this.quarterRound(x, 1, 6,11,12);
            this.quarterRound(x, 2, 7, 8,13);
            this.quarterRound(x, 3, 4, 9,14);
        };
        for (i = 16; i--;) x[i] += this.input[i];
        for (i = 16; i--;) U32TO8_LE(output, 4*i, x[i]);

        this.input[12] += 1;
        if (!this.input[12]) this.input[13] += 1;

        if (len <= 64) {
            for (i = len; i--;) dst[i+dpos] = src[i+spos] ^ output[i];
            return;
        };
        for (i = 64; i--;) dst[i+dpos] = src[i+spos] ^ output[i];

        len -= 64;
        spos += 64;
        dpos += 64;
    };
};

Chacha20.prototype.keystream = function(dst, len){
    for (var i = 0; i < len; ++i) dst[i] = 0;
    this.encrypt(dst, dst, len);
};

Chacha20.prototype.seek = function(u32_0, u32_1){
    this.input[12] = u32_0;
    this.input[13] = u32_1;
};

//--------------------------------------------------------------------------//

function ChaCha20Interface(rounds, testing){
    var self = this;
    var cipher = null;

    function _xorBuf(dataBuf){
        if(!tool.get('util.type')(dataBuf).isArrayBuffer())
            throw new Error('invalid-input');
        var data = new Uint8Array(dataBuf),
            ret = new Uint8Array(data.length);
        cipher.encrypt(ret, data, data.length);
        return ret.buffer;
    };

    this.key = function(bufKey){
        if(!tool.get('util.type')(bufKey).isArrayBuffer())
            throw new Error('invalid-key');

        var keylen = bufKey.byteLength;

        // buffer typed bufKey, first 24 or 40 bytes will be used. among them,
        // the first 8 bytes will be taken as nonce. the rest will be the key.
        if(keylen < 24) throw new Error('invalid-key');
        var nonceAry = new Uint8Array(bufKey.slice(0, 8));
        var keyAry = null;
        if(keylen < 40)
            keyAry = new Uint8Array(bufKey.slice(8, 24));
        else
            keyAry = new Uint8Array(bufKey.slice(8, 40));
        cipher = new Chacha20(rounds, keyAry, nonceAry);

        self.encrypt = _xorBuf;
        self.decrypt = _xorBuf;
        self.seek = cipher.seek;
        delete self.key;
        return self;
    };

    return this;
};



var exporter = {
    name: 'ChaCha20/20',
    constructor: function(){
        return new ChaCha20Interface(20);
    },
    raw: ChaCha20Interface,
};

tool.set('cipher.symmetric.chacha20', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
