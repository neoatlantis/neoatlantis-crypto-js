/*
 * A Camellia implementation in pure Javascript for NodeJS
 * =======================================================
 *
 * This file contains a slightly modified version of Hiroyuki OYAMA's pure
 * javascript implementation of Camellia, and a port of such script into
 * Node.JS with a CBC mode of operation.
 *
 * Using this portation should be cautious. It expects a PADDED input. And,
 * the IV used is taken from the key, but in Enigma, the key being fed to
 * this class is derived from a main key and a salt, the latter chosen each
 * time randomly. If you cannot ensure the key fed into this class is used
 * only once, BE CAUTIOUS.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

/* CryptoCipherCamellia.js:
 *    100% Pure JavaScript Camellia 128-bit block cipher library.
 * This library is public domain.
 *
 * Hiroyuki OYAMA, oyama@module.jp, http://module.jp/
 */

var _CAMELLIA = function() {
    this.key_length = 128/8;
    this.blocksize = 128/8;
    this.kw = new Array(8*4);
    this.k = new Array(24*8);
    this.kl = new Array(8*6);
    this.S1 = new Uint8Array([
        112,130, 44,236,179, 39,192,229,228,133, 87, 53,234, 12,174, 65,
         35,239,107,147, 69, 25,165, 33,237, 14, 79, 78, 29,101,146,189,
        134,184,175,143,124,235, 31,206, 62, 48,220, 95, 94,197, 11, 26,
        166,225, 57,202,213, 71, 93, 61,217,  1, 90,214, 81, 86,108, 77,
        139, 13,154,102,251,204,176, 45,116, 18, 43, 32,240,177,132,153,
        223, 76,203,194, 52,126,118,  5,109,183,169, 49,209, 23,  4,215,
         20, 88, 58, 97,222, 27, 17, 28, 50, 15,156, 22, 83, 24,242, 34,
        254, 68,207,178,195,181,122,145, 36,  8,232,168, 96,252,105, 80,
        170,208,160,125,161,137, 98,151, 84, 91, 30,149,224,255,100,210,
         16,196,  0, 72,163,247,117,219,138,  3,230,218,  9, 63,221,148,
        135, 92,131,  2,205, 74,144, 51,115,103,246,243,157,127,191,226,
         82,155,216, 38,200, 55,198, 59,129,150,111, 75, 19,190, 99, 46,
        233,121,167,140,159,110,188,142, 41,245,249,182, 47,253,180, 89,
        120,152,  6,106,231, 70,113,186,212, 37,171, 66,136,162,141,250,
        114,  7,185, 85,248,238,172, 10, 54, 73, 42,104, 60, 56,241,164,
         64, 40,211,123,187,201, 67,193, 21,227,173,244,119,199,128,158
    ]);
    this.S2 = new Uint8Array([
        224,  5, 88,217,103, 78,129,203,201, 11,174,106,213, 24, 93,130,
         70,223,214, 39,138, 50, 75, 66,219, 28,158,156, 58,202, 37,123,
         13,113, 95, 31,248,215, 62,157,124, 96,185,190,188,139, 22, 52,
         77,195,114,149,171,142,186,122,179,  2,180,173,162,172,216,154,
         23, 26, 53,204,247,153, 97, 90,232, 36, 86, 64,225, 99,  9, 51,
        191,152,151,133,104,252,236, 10,218,111, 83, 98,163, 46,  8,175,
         40,176,116,194,189, 54, 34, 56,100, 30, 57, 44,166, 48,229, 68,
        253,136,159,101,135,107,244, 35, 72, 16,209, 81,192,249,210,160,
         85,161, 65,250, 67, 19,196, 47,168,182, 60, 43,193,255,200,165,
         32,137,  0,144, 71,239,234,183, 21,  6,205,181, 18,126,187, 41,
         15,184,  7,  4,155,148, 33,102,230,206,237,231, 59,254,127,197,
        164, 55,177, 76,145,110,141,118,  3, 45,222,150, 38,125,198, 92,
        211,242, 79, 25, 63,220,121, 29, 82,235,243,109, 94,251,105,178,
        240, 49, 12,212,207,140,226,117,169, 74, 87,132, 17, 69, 27,245,
        228, 14,115,170,241,221, 89, 20,108,146, 84,208,120,112,227, 73,
        128, 80,167,246,119,147,134,131, 42,199, 91,233,238,143,  1, 61
    ]);
    this.S3 = new Uint8Array([
         56, 65, 22,118,217,147, 96,242,114,194,171,154,117,6, 87,160,
        145,247,181,201,162,140,210,144,246,7,167,39,142,178,73,222,
         67, 92,215,199,62,245,143,103,31,24,110,175,47,226,133,13,
         83,240,156,101,234,163,174,158,236,128,45,107,168,43,54,166,
        197,134,77,51,253,102,88,150,58,9,149,16,120,216,66,204,
        239, 38,229,97,26,63,59,130,182,219,212,152,232,139,2,235,
         10, 44,29,176,111,141,136,14,25,135,78,11,169,12,121,17,
        127, 34,231,89,225,218,61,200,18,4,116,84,48,126,180,40,
         85,104,80,190,208,196,49,203,42,173,15,202,112,255,50,105,
          8, 98,0,36,209,251,186,237,69,129,115,109,132,159,238,74,
        195, 46,193,1,230,37,72,153,185,179,123,249,206,191,223,113,
         41,205,108,19,100,155,99,157,192,75,183,165,137,95,177,23,
        244,188,211,70,207,55,94,71,148,250,252,91,151,254,90,172,
         60, 76,3,53,243,35,184,93,106,146,213,33,68,81,198,125,
         57,131,220,170,124,119,86,5,27,164,21,52,30,28,248,82,
         32, 20,233,189,221,228,161,224,138,241,214,122,187,227, 64, 79
    ]);
    this.S4 = new Uint8Array([
        112, 44,179,192,228, 87,234,174, 35,107, 69,165,237, 79, 29,146,
        134,175,124, 31, 62,220, 94, 11,166, 57,213, 93,217, 90, 81,108,
        139,154,251,176,116, 43,240,132,223,203, 52,118,109,169,209,  4,
         20, 58,222, 17, 50,156, 83,242,254,207,195,122, 36,232, 96,105,
        170,160,161, 98, 84, 30,224,100, 16,  0,163,117,138,230,  9,221,
        135,131,205,144,115,246,157,191, 82,216,200,198,129,111, 19, 99,
        233,167,159,188, 41,249, 47,180,120,  6,231,113,212,171,136,141,
        114,185,248,172, 54, 42, 60,241, 64,211,187, 67, 21,173,119,128,
        130,236, 39,229,133, 53, 12, 65,239,147, 25, 33, 14, 78,101,189,
        184,143,235,206, 48, 95,197, 26,225,202, 71, 61,  1,214, 86, 77,
         13,102,204, 45, 18, 32,177,153, 76,194,126,  5,183, 49, 23,215,
         88, 97, 27, 28, 15, 22, 24, 34, 68,178,181,145,  8,168,252, 80,
        208,125,137,151, 91,149,255,210,196, 72,247,219,  3,218, 63,148,
         92,  2, 74, 51,103,243,127,226,155, 38, 55, 59,150, 75,190, 46,
        121,140,110,142,245,182,253, 89,152,106, 70,186, 37, 66,162,250,
          7, 85,238, 10, 73,104, 56,164, 40,123,201,193,227,244,199,158
    ]);
    this.SIGMA1 = [ 0xA0, 0x9E, 0x66, 0x7F, 0x3B, 0xCC, 0x90, 0x8B ];
    this.SIGMA2 = [ 0xB6, 0x7A, 0xE8, 0x58, 0x4C, 0xAA, 0x73, 0xB2 ];
    this.SIGMA3 = [ 0xC6, 0xEF, 0x37, 0x2F, 0xE9, 0x4F, 0x82, 0xBE ];
    this.SIGMA4 = [ 0x54, 0xFF, 0x53, 0xA5, 0xF1, 0xD3, 0x6F, 0x1C ];
    this.SIGMA5 = [ 0x10, 0xE5, 0x27, 0xFA, 0xDE, 0x68, 0x2D, 0x1D ];
    this.SIGMA6 = [ 0xB0, 0x56, 0x88, 0xC2, 0xB3, 0xE6, 0xC1, 0xFD ];
    return this;
};



_CAMELLIA.prototype._xor_block = function (x, y, l) {
    var r = new Array(l);
    for (var i = 0; i < l; i++) {
        r[i] = x[i] ^ y[i];
    }
    return r;
};


_CAMELLIA.prototype._feistel = function (dist, off, x, k) {
    var ws = new Array(8);
    var w = this._xor_block(x, k, 8);
    ws[0] = this.S1[w[0]];
    ws[1] = this.S2[w[1]];
    ws[2] = this.S3[w[2]];
    ws[3] = this.S4[w[3]];
    ws[4] = this.S2[w[4]];
    ws[5] = this.S3[w[5]];
    ws[6] = this.S4[w[6]];
    ws[7] = this.S1[w[7]];
    dist[0+off] ^= ws[0] ^ ws[2] ^ ws[3] ^ ws[5] ^ ws[6] ^ ws[7];
    dist[1+off] ^= ws[0] ^ ws[1] ^ ws[3] ^ ws[4] ^ ws[6] ^ ws[7];
    dist[2+off] ^= ws[0] ^ ws[1] ^ ws[2] ^ ws[4] ^ ws[5] ^ ws[7];
    dist[3+off] ^= ws[1] ^ ws[2] ^ ws[3] ^ ws[4] ^ ws[5] ^ ws[6];
    dist[4+off] ^= ws[0] ^ ws[1] ^ ws[5] ^ ws[6] ^ ws[7];
    dist[5+off] ^= ws[1] ^ ws[2] ^ ws[4] ^ ws[6] ^ ws[7];
    dist[6+off] ^= ws[2] ^ ws[3] ^ ws[4] ^ ws[5] ^ ws[7];
    dist[7+off] ^= ws[0] ^ ws[3] ^ ws[4] ^ ws[5] ^ ws[6];
};


_CAMELLIA.prototype._rot_shift = function (dist, off, src, bit, len) {
    if (bit == 0) {
        this._move(dist, 0, src, 0, len);
        return;
    }
    var o = Math.floor(bit / 8) + 1;
    var so = o * 8 - bit;
    o = o % len;
    for (var i = 0; i < len; i++) {
        dist[i+off] = ((src[(i+o)%len] >> so) & 0xff)
                    | ((src[(i+o-1)%len] << (8-so)) & 0xff);
    }
};


_CAMELLIA.prototype.setup = function (key) {
    var kl = new Array();
    var kr = new Array();
    var ka = new Array();

    this.key_length = key.byteLength;
    if(16 == key.byteLength){
        kl = new Uint8Array(key.slice(0, 16));
        kr = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    } else if (24 == key.byteLength){
        kl = new Uint8Array(key.slice(0, 16));
        for (var i = 0; i < 8; i++) {
            kr[i] = key[i+16];
            kr[i+8] = key[i+16] ^ 0xff;
        };
    } else if (32 == key.byteLength) {
        kl = new Uint8Array(key.slice(0, 16));
        kr = new Uint8Array(key.slice(16, 32));
    } else {
        throw "wrong key length: key must be 128, 192 or 256 bit";
    };

    ka = this._xor_block(kl, kr, 16);
    this._feistel(ka, 8, ka, this.SIGMA1);
    this._feistel(ka, 0, ka.slice(8, 16), this.SIGMA2);
    ka = this._xor_block(kl, ka, 16); 

    this._feistel(ka, 8, ka.slice(0, 8), this.SIGMA3);
    this._feistel(ka, 0, ka.slice(8, 16), this.SIGMA4);

    if (key.length == 16) {
        this._rot_shift(this.kw, 0, kl, 0, 16);
    
        this._rot_shift(this.k, 0, ka, 0, 16);
        this._rot_shift(this.k, 8*2, kl, 15, 16);
        this._rot_shift(this.k, 8*4, ka, 15, 16);
    
        this._rot_shift(this.kl, 0, ka, 30, 16);
    
        this._rot_shift(this.k, 8*6, kl, 45, 16);
        this._rot_shift(this.k, 8*8, ka, 45, 16);
        this._rot_shift(this.k, 8*9, kl, 60, 16);
        this._move(this.k, 8*9, this.k.slice(8*10, 8*10+8), 0, 8);
        this._rot_shift(this.k, 8*10, ka, 60, 16);
    
        this._rot_shift(this.kl, 8*2, kl, 77, 16);
    
        this._rot_shift(this.k, 8*12, kl, 94, 16);
        this._rot_shift(this.k, 8*14, ka, 94, 16);
        this._rot_shift(this.k, 8*16, kl, 111, 16);
    
        this._rot_shift(this.kw, 8*2, ka, 111, 16);
    }
    else {
        var kb = this._xor_block(kr, ka, 16);
        this._feistel(kb, 8, kb.slice(0, 8), this.SIGMA5);
        this._feistel(kb, 0, kb.slice(8, 16), this.SIGMA6);

        this._rot_shift(this.kw, 0, kl, 0, 16);

        this._rot_shift(this.k, 0, kb, 0, 16);
        this._rot_shift(this.k, 8*2, kr, 15, 16);
        this._rot_shift(this.k, 8*4, ka, 15, 16);

        this._rot_shift(this.kl, 0, kr, 30, 16);

        this._rot_shift(this.k, 8*6, kb, 30, 16);
        this._rot_shift(this.k, 8*8, kl, 45, 16);
        this._rot_shift(this.k, 8*10, ka, 45, 16);

        this._rot_shift(this.kl, 8*2, kl, 60, 16);

        this._rot_shift(this.k, 8*12, kr, 60, 16);
        this._rot_shift(this.k, 8*14, kb, 60, 16);
        this._rot_shift(this.k, 8*16, kl, 77, 16);

        this._rot_shift(this.kl, 8*4, ka, 77, 16);

        this._rot_shift(this.k, 8*18, kr, 94, 16);
        this._rot_shift(this.k, 8*20, ka, 94, 16);
        this._rot_shift(this.k, 8*22, kl, 111, 16);

        this._rot_shift(this.kw, 8*2, kb, 111, 16);
    }
};


_CAMELLIA.prototype._flayer = function (dist, x, k) {
    this._move(dist, 0, x, 0, 8);
    dist[4+0] ^= (((x[0] & k[0]) << 1) & 0xff) ^ (x[1] & k[1]) >> 7;
    dist[4+1] ^= (((x[1] & k[1]) << 1) & 0xff) ^ (x[2] & k[2]) >> 7;
    dist[4+2] ^= (((x[2] & k[2]) << 1) & 0xff) ^ (x[3] & k[3]) >> 7;
    dist[4+3] ^= (((x[3] & k[3]) << 1) & 0xff) ^ (x[0] & k[0]) >> 7;
    dist[0] ^= dist[4+0] | k[4+0];
    dist[1] ^= dist[4+1] | k[4+1];
    dist[2] ^= dist[4+2] | k[4+2];
    dist[3] ^= dist[4+3] | k[4+3];
};


_CAMELLIA.prototype._flayer_1 = function (dist, x, k) {
    this._move(dist, 0, x, 0, 8);
    dist[0] ^= x[4+0] | k[4+0];
    dist[1] ^= x[4+1] | k[4+1];
    dist[2] ^= x[4+2] | k[4+2];
    dist[3] ^= x[4+3] | k[4+3];
    dist[4+0] ^= (((dist[0] & k[0]) << 1) & 0xff) ^ (dist[1] & k[1]) >> 7;
    dist[4+1] ^= (((dist[1] & k[1]) << 1) & 0xff) ^ (dist[2] & k[2]) >> 7;
    dist[4+2] ^= (((dist[2] & k[2]) << 1) & 0xff) ^ (dist[3] & k[3]) >> 7;
    dist[4+3] ^= (((dist[3] & k[3]) << 1) & 0xff) ^ (dist[0] & k[0]) >> 7;

};


_CAMELLIA.prototype.encrypt = function (src) {
    var l = new Uint8Array(src.slice(0, 8));
    var r = new Uint8Array(src.slice(8, 16));

    l = this._xor_block(l, this.kw.slice(0, 8), 8);
    r = this._xor_block(r, this.kw.slice(8, 16), 8);
    if (this.key_length == 16) {
        for (var i = 0; i < 18; i += 2) {
            this._feistel(r, 0, l, this.k.slice(8*i, (8*i)+8));
            this._feistel(l, 0, r, this.k.slice(8*(i+1), 8*(i+1)+8));
            if (i == 4) {
                this._flayer(l, l, this.kl, 0);
                this._flayer_1(r, r, this.kl.slice(8, 16), 0);
            }
            else if (i == 10) {
                this._flayer(l, l, this.kl.slice(16, 24), 0);
                this._flayer_1(r, r, this.kl.slice(24, 32), 0);
            }
        }
    }
    else {
        for (var i = 0; i < 24; i += 2) {
            this._feistel(r, 0, l, this.k.slice(8*i, (8*i)+8));
            this._feistel(l, 0, r, this.k.slice(8*(i+1), 8*(i+1)+8));
            if (i == 4) {
                this._flayer(l, l, this.kl, 0);
                this._flayer_1(r, r, this.kl.slice(8, 16), 0);
            }
            else if (i == 10) {
                this._flayer(l, l, this.kl.slice(16, 24), 0);
                this._flayer_1(r, r, this.kl.slice(24, 32), 0);
            }
            else if (i == 16) {
                this._flayer(l, l, this.kl.slice(32, 40), 0);
                this._flayer_1(r, r, this.kl.slice(40, 48), 0);
            }
        }
    }
    r = this._xor_block(r, this.kw.slice(16, 24), 8);
    l = this._xor_block(l, this.kw.slice(24, 32), 8);

    return r.concat(l);
};


_CAMELLIA.prototype.decrypt = function (src){
    var r = new Uint8Array(src.slice(0, 8));
    var l = new Uint8Array(src.slice(8, 16));

    r = this._xor_block(r, this.kw.slice(8*2, 8*2+8), 8);
    l = this._xor_block(l, this.kw.slice(8*3, 8*3+8), 8);
    if (this.key_length == 16) {
        for (var i = 16; i >= 0; i -= 2) {
            this._feistel(l, 0, r, this.k.slice(8*(i+1), 8*(i+1)+8));
            this._feistel(r, 0, l, this.k.slice(8*i, (8*i)+8));
            if (i == 12) {
                this._flayer(r, r, this.kl.slice(8*3, 8*3+8), 0);
                this._flayer_1(l, l, this.kl.slice(8*2, 8*2+8), 0);
            }
            else if (i == 6) {
                this._flayer(r, r, this.kl.slice(8*1, 8*1+8), 0);
                this._flayer_1(l, l, this.kl.slice(8*0, 8*0+8), 0);
            }
        }
    }
    else {
        for (var i = 22; i >= 0; i -= 2) {
            this._feistel(l, 0, r, this.k.slice(8*(i+1), 8*(i+1)+8));
            this._feistel(r, 0, l, this.k.slice(8*i, (8*i)+8));
            if (i == 18) {
                this._flayer(r, r, this.kl.slice(8*5, 8*5+8), 0);
                this._flayer_1(l, l, this.kl.slice(8*4, 8*4+8), 0);
            }
            else if (i == 12) {
                this._flayer(r, r, this.kl.slice(8*3, 8*3+8), 0);
                this._flayer_1(l, l, this.kl.slice(8*2, 8*2+8), 0);
            }
            else if (i == 6) {
                this._flayer(r, r, this.kl.slice(8*1, 8*1+8), 0);
                this._flayer_1(l, l, this.kl.slice(8*0, 8*0+8), 0);
            }
        }
    }
    l = this._xor_block(l, this.kw.slice(8*0, 8*0+8), 8);
    r = this._xor_block(r, this.kw.slice(8*1, 8*1+8), 8);

    return l.concat(r);
};


_CAMELLIA.prototype._move = function (dist, offd, src, offs, len) {
    for (var i = 0; i < len; i++) {
        dist[i+offd] = src[i+offs];
    }
};




//////////////////////////////////////////////////////////////////////////////
// return an adaptive port of Camellia library
// this also applies the CBC mode.
function cipherInterface(){
    var self = this;

    var core = new _CAMELLIA(), iv, key

    this.key = function(_key){
        if(!root.util.type(_key).isArrayBuffer())
            throw new Error('invalid-key-input');

        iv = new Uint8Array(_key.slice(0, 16));
        if(_key.byteLength >= 32)
            key = new Uint8Array(_key.slice(0, 32));
        else if(_key.byteLength >= 24)
            key = new Uint8Array(_key.slice(0, 24));
        else if(_key.byteLength >= 16)
            key = new Uint8Array(_key.slice(0, 16));
        else
            throw new Error('key-too-short');
        
        core.setup(key.buffer);
        self.encrypt = encrypt;
        self.decrypt = decrypt;
        delete self.key;
        return self;
    };

    function encrypt(buf){
        if(!root.util.type(buf).isArrayBuffer())
            throw new Error('invalid-buffer-input');
        if(buf.byteLength % 16 != 0) throw new Error('invalid-plaintext');

        var pBlock,
            ret = new Uint8Array(buf.byteLength),
            cBlockLast = iv,
            cBlock;
        var i, j;

        for(i=0; i<buf.byteLength; i+=16){
            pBlock = new Uint8Array(buf.slice(i, i+16));
            cBlock = core.encrypt(
                core._xor_block(cBlockLast, pBlock, 16)
            );
            for(j=0; j<16; j++) ret[i+j] = cBlock[j];
            cBlockLast = cBlock;
        };

        return ret.buffer;
    };

    function decrypt(buf){
        if(!root.util.type(buf).isArrayBuffer())
            throw new Error('invalid-buffer-input');
        if(buf.byteLength % 16 != 0) throw new Error('invalid-ciphertext');

        var ret = new Uint8Array(buf.byteLength),
            cBlock, 
            cBlockLast = iv,
            i, j;

        for(i=0; i<buf.byteLength; i+=16){
            cBlock = buf.slice(i, i+16);
            pBlock = core._xor_block(
                core.decrypt(cBlock), 
                cBlockLast, 
                16
            );
            for(j=0; j<16; j++) ret[i+j] = pBlock[j];
            cBlockLast = cBlock;
        };
        return ret.buffer;
    };

    return this;
};




var exporter = {
    name: 'CAMELLIA',
    constructor: function(){
        return new cipherInterface();
    },
};

tool.set('cipher.symmetric.algorithms.camellia', exporter);

//////////////////////////////////////////////////////////////////////////////
})(tool);
