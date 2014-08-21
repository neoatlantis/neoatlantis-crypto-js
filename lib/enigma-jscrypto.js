(function(){
var funcTree = {}, exportTree = {};
var tool = {
    'get': function(name){
        return funcTree[name];
    },
    'set': function(name, x){
        funcTree[name] = x;
    },
    'exp': function(path, x){
        var paths = path.split('.');
        var cursor = exportTree;
        for(var i in paths){
            if('undefined' == typeof cursor[paths[i]]){
                if(i == paths.length - 1){
                    cursor[paths[i]] = x;
                    break;
                };
                cursor[paths[i]] = {};
            };
            cursor = cursor[paths[i]];
        };
    },
};
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
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function encoding(src, format){
    var self = this;

    var buffer = null;

    var tableB64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        tableHEX = "0123456789abcdef";

    var type = tool.get('util.type')(src);
    
    if(type.isArrayBuffer())
        buffer = src;
    else if(type.isArray()){
        var copy = new Uint8Array(src.length);
        for(var i=0; i<copy.length; i++) copy[i] = src[i] & 0xFF;
        buffer = copy.buffer;
    } else if(type.isString()){
        if(!format) format = '';
        switch(format.toLowerCase()){
            case 'hex': 
                if(!/^[0-9a-f]+$/i.test(src) || 0 != src.length % 2)
                    throw Error('invalid-encoding-choosen');
                src = src.toLowerCase();

                var cbuf = new Uint8Array(src.length / 2);
                for(var i=0; i<cbuf.length; i++)
                    cbuf[i] = tableHEX.indexOf(src[2*i]) * 16
                        + tableHEX.indexOf(src[2*i+1]);

                buffer = cbuf.buffer;
                break;
            case 'base64':
                if (/(=[^=]+|={3,})$/.test(src))
                    throw Error('invalid-encoding-choosen');
                src = src.replace(/=/g, "");
                var n = src.length & 3;
                if(1 == n) throw Error('invalid-encoding-choosen');

                var i=0, j=0, len=Math.ceil(src.length / 4);
                var cbuf = new Uint8Array(len * 3);
                var a, b, c, d;
                for (i=0; i<len; i++) {
                    a = tableB64.indexOf(src[j++] || "A");
                    b = tableB64.indexOf(src[j++] || "A");
                    c = tableB64.indexOf(src[j++] || "A");
                    d = tableB64.indexOf(src[j++] || "A");
                    if ((a | b | c | d) < 0)
                        throw Error('invalid-encoding-choosen');
                    cbuf[i*3] = ((a << 2) | (b >> 4)) & 255;
                    cbuf[i*3+1] = ((b << 4) | (c >> 2)) & 255;
                    cbuf[i*3+2] = ((c << 6) | d) & 255;
                };
                buffer = cbuf.buffer.slice(0, cbuf.length + n - 4);
                break;
            default:
                var cbuf = new Uint16Array(src.length);
                for(var i=0; i<src.length; i++) cbuf[i] = src.charCodeAt(i);
                buffer = cbuf.buffer;
                break;
        };
    } else
        throw Error('unknown-encoding');

    this.toArrayBuffer = function(){
        return buffer;
    };

    this.toUTF16 = function(){
        var view = new Uint16Array(buffer), s = '';
        for(var i=0; i<view.length; i++) s += String.fromCharCode(view[i]);
        return s;
    };

    this.toBase64 = function(){
        var view = new Uint8Array(buffer);
        var i=0, j=0, k=0, len=view.length / 3;
        var b64 = '';

        var a, b, c;
        for(i=0; i<len; ++i) {
            a = view[j++];
            b = view[j++];
            c = view[j++];
            b64 += tableB64[a >> 2] + tableB64[((a << 4) & 63) | (b >> 4)]
                 + (isNaN(b) ? "=" : tableB64[((b << 2) & 63) | (c >> 6)])
                 + (isNaN(b + c) ? "=" : tableB64[c & 63]);
        };
        console.log(view.length);
        return b64;
    };

    this.toHEX = function(){
        var view = new Uint8Array(buffer), s = '';
        for(var i=0; i<view.length; i++){
            if(view[i] < 16)
                s += '0' + view[i].toString(16);
            else
                s += view[i].toString(16);
        };
        return s;

    };

    this.toArray = function(){
        var view = new Uint8Array(buffer), ret = new Array(view.length);
        for(var i=0; i<ret.length; i++) ret[i] = view[i];
        return ret;
    };

    return this;
};



var exporter = function(a,b){
    return new encoding(a,b);
};

tool.set('util.encoding', exporter);
tool.exp('util.encoding', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){

var exporter = {
    notice: function(x){console.log(x);},
    error: function(x){console.error(x);},
};


if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = exporter;
} else {
    define([], function(){
        return exporter;
    });
};

tool.set('util.log', exporter);
tool.exp('util.log', exporter);
})(tool);
/*
 * LZW Compression and Decompression
 */

(function(){
//////////////////////////////////////////////////////////////////////////////
function compress(uncompressedBuf){
    if(!root.util.type(uncompressedBuf).isArrayBuffer())
        throw Error('invalid-input');

    var src = new Uint8Array(uncompressedBuf);

    var i,
        dictionary = {},
        c,
        wc,
        w = "",
        result = [],
        dictSize = 256;

    for (i = 0; i < 256; i += 1) dictionary[String.fromCharCode(i)] = i;

    for (i = 0; i < src.length; i += 1) {
        c = String.fromCharCode(src[i]);
        wc = w + c;
        //Do not use dictionary[wc] because javascript arrays 
        //will return values for array['pop'], array['push'] etc
       // if (dictionary[wc]) {
        if (dictionary.hasOwnProperty(wc)){
            w = wc;
        } else {
            result.push(dictionary[w]);
            // Add wc to the dictionary.
            dictionary[wc] = dictSize++;
            w = String(c);
        };
    };

    // Output the code for w.
    if('' !== w) result.push(dictionary[w]);
    return result;
};


//LZW Compression/Decompression for Strings
function decompress(compressedBuf) {
    // Build the dictionary.
    var i,
        dictionary = [],
        w,
        result,
        k,
        entry = "",
        dictSize = 256;
    for (i = 0; i < 256; i += 1) {
        dictionary[i] = String.fromCharCode(i);
    }

    w = String.fromCharCode(compressed[0]);
    result = w;
    for (i = 1; i < compressed.length; i += 1) {
        k = compressed[i];
        if (dictionary[k]) {
            entry = dictionary[k];
        } else {
            if (k === dictSize) {
                entry = w + w.charAt(0);
            } else {
                return null;
            }
        }

        result += entry;

        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);

        w = entry;
    }
    return result;
}

/*
// For Test Purposes
comp = LZW.compress("TOBEORNOTTOBEORTOBEORNOT"),
decomp = LZW.decompress(comp);
document.write(comp + '<br>' + decomp);
*/

//////////////////////////////////////////////////////////////////////////////
})();
/*
 * a blocking random bytes generator
 */
(function(tool){
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
        return output.buffer;
    };

    this.array = function(count){
        return new Uint8Array(self.bytes(count));
    };

    return this;
};



tool.set('util.srand', srand);
tool.exp('util.srand', srand);
//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function type(v){
    return {
        isError: function(){
            return toString.apply(v) === '[object Error]';
        },

        isArray: function(){
            return toString.apply(v) === '[object Array]';
        },
    
        isDate: function(){
            return toString.apply(v) === '[object Date]';
        },
        
        isObject: function(){
            return !!v && Object.prototype.toString.call(v) === '[object Object]';
        },
        
        isPrimitive: function(){
            return self.isString(v) || self.isNumber(v) || self.isBoolean(v);
        },
        
        isFunction: function(){
            return toString.apply(v) === '[object Function]';
        },

        isDate: function(){
            return toString.apply(v) === '[object Date]';
        },
        
        isNumber: function(){
            return typeof v === 'number' && isFinite(v);
        },
        
        isString: function(){
            return typeof v === 'string';
        },
        
        isBoolean: function(){
            return typeof v === 'boolean';
        },

        isArrayBuffer: function(){
            return toString.apply(v) === '[object ArrayBuffer]';
        },
    };
};

tool.set('util.type', type);
tool.exp('util.type', type);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
BLAKE2s implementation in TypeScript / JavaScript.

https://blake2.net

Currently doesn't support tree mode.

USAGE

  var h = new BLAKE2s(32); // constructor accepts digest length in bytes
  h.update("string or array of bytes");
  h.hexDigest(); // returns string with hex digest
  h.digest(); // returns array of bytes

  // Keyed:
  var h = new BLAKE2s(32, "some key");
  ...


DEMO

  http://www.dchest.org/blake2s-js/


PUBLIC DOMAIN DEDICATION

Written in 2012 by Dmitry Chestnykh.

To the extent possible under law, the author have dedicated all copyright
and related and neighboring rights to this software to the public domain
worldwide. This software is distributed without any warranty.
http://creativecommons.org/publicdomain/zero/1.0/
*/

(function(tool){
    function BLAKE2s(digestLength, key) {
        if (typeof digestLength === "undefined") { digestLength = 32; }
        this.isFinished = false;
        this.digestLength = 32;
        this.blockLength = 64;
        this.iv = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ];
        //TODO tree mode.
        if (digestLength <= 0) {
            digestLength = this.digestLength;
        } else if (digestLength > 32) {
            throw 'digestLength is too large';
        }
        var keyLength = 0;
        if (typeof key == 'string') {
            key = this.stringToUtf8Array(key);
            keyLength = key.length;
        } else if (typeof key == 'object') {
            keyLength = key.length;
        }
        if (keyLength > 32) {
            throw 'key too long';
        }

        var param = [digestLength & 0xff, keyLength, 1, 1];
        this.h = this.iv.slice(0);

        // XOR part of parameter block.
        this.h[0] ^= this.load32(param, 0);

        this.x = new Array(64);
        this.t0 = 0;
        this.t1 = 0;
        this.f0 = 0;
        this.f1 = 0;
        this.nx = 0;
        this.digestLength = digestLength;

        if (keyLength > 0) {
            for (var i = 0; i < keyLength; i++) {
                this.x[i] = key[i];
            }
            for (var i = keyLength; i < 64; i++) {
                this.x[i] = 0;
            }
            this.nx = 64;
        }
    }
    BLAKE2s.prototype.load32 = function (p, pos) {
        return ((p[pos] & 0xff) | ((p[pos + 1] & 0xff) << 8) | ((p[pos + 2] & 0xff) << 16) | ((p[pos + 3] & 0xff) << 24)) >>> 0;
    };

    BLAKE2s.prototype.store32 = function (p, pos, v) {
        p[pos] = (v >>> 0) & 0xff;
        p[pos + 1] = (v >>> 8) & 0xff;
        p[pos + 2] = (v >>> 16) & 0xff;
        p[pos + 3] = (v >>> 24) & 0xff;
    };

    BLAKE2s.prototype.processBlock = function (length) {
        this.t0 += length;
        if (this.t0 != this.t0 >>> 0) {
            this.t0 = 0;
            this.t1++;
        }

        var v0 = this.h[0], v1 = this.h[1], v2 = this.h[2], v3 = this.h[3], v4 = this.h[4], v5 = this.h[5], v6 = this.h[6], v7 = this.h[7], v8 = this.iv[0], v9 = this.iv[1], v10 = this.iv[2], v11 = this.iv[3], v12 = this.iv[4] ^ this.t0, v13 = this.iv[5] ^ this.t1, v14 = this.iv[6] ^ this.f0, v15 = this.iv[7] ^ this.f1;

        var m0 = this.load32(this.x, 0), m1 = this.load32(this.x, 4), m2 = this.load32(this.x, 8), m3 = this.load32(this.x, 12), m4 = this.load32(this.x, 16), m5 = this.load32(this.x, 20), m6 = this.load32(this.x, 24), m7 = this.load32(this.x, 28), m8 = this.load32(this.x, 32), m9 = this.load32(this.x, 36), m10 = this.load32(this.x, 40), m11 = this.load32(this.x, 44), m12 = this.load32(this.x, 48), m13 = this.load32(this.x, 52), m14 = this.load32(this.x, 56), m15 = this.load32(this.x, 60);

        // Round 1.
        v0 += m0;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m2;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m4;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m6;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m5;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m7;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m3;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m1;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m8;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m10;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m12;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m14;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m13;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m15;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m11;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m9;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 2.
        v0 += m14;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m4;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m9;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m13;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m15;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m6;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m8;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m10;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m1;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m0;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m11;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m5;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m7;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m3;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m2;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m12;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 3.
        v0 += m11;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m12;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m5;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m15;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m2;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m13;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m0;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m8;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m10;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m3;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m7;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m9;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m1;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m4;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m6;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m14;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 4.
        v0 += m7;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m3;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m13;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m11;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m12;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m14;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m1;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m9;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m2;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m5;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m4;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m15;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m0;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m8;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m10;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m6;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 5.
        v0 += m9;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m5;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m2;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m10;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m4;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m15;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m7;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m0;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m14;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m11;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m6;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m3;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m8;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m13;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m12;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m1;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 6.
        v0 += m2;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m6;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m0;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m8;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m11;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m3;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m10;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m12;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m4;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m7;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m15;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m1;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m14;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m9;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m5;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m13;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 7.
        v0 += m12;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m1;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m14;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m4;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m13;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m10;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m15;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m5;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m0;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m6;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m9;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m8;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m2;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m11;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m3;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m7;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 8.
        v0 += m13;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m7;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m12;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m3;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m1;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m9;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m14;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m11;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m5;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m15;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m8;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m2;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m6;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m10;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m4;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m0;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 9.
        v0 += m6;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m14;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m11;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m0;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m3;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m8;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m9;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m15;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m12;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m13;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m1;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m10;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m4;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m5;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m7;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v0 += m2;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 7) | v5 >>> 7;

        // Round 10.
        v0 += m10;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v1 += m8;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v2 += m7;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v3 += m1;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v2 += m6;
        v2 += v6;
        v14 ^= v2;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v10 += v14;
        v6 ^= v10;
        v6 = v6 << (32 - 7) | v6 >>> 7;
        v3 += m5;
        v3 += v7;
        v15 ^= v3;
        v15 = v15 << (32 - 8) | v15 >>> 8;
        v11 += v15;
        v7 ^= v11;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v1 += m4;
        v1 += v5;
        v13 ^= v1;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v9 += v13;
        v5 ^= v9;
        v5 = v5 << (32 - 7) | v5 >>> 7;
        v0 += m2;
        v0 += v4;
        v12 ^= v0;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v8 += v12;
        v4 ^= v8;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v0 += m15;
        v0 += v5;
        v15 ^= v0;
        v15 = v15 << (32 - 16) | v15 >>> 16;
        v10 += v15;
        v5 ^= v10;
        v5 = v5 << (32 - 12) | v5 >>> 12;
        v1 += m9;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 16) | v12 >>> 16;
        v11 += v12;
        v6 ^= v11;
        v6 = v6 << (32 - 12) | v6 >>> 12;
        v2 += m3;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 16) | v13 >>> 16;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 12) | v7 >>> 12;
        v3 += m13;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 16) | v14 >>> 16;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 12) | v4 >>> 12;
        v2 += m12;
        v2 += v7;
        v13 ^= v2;
        v13 = v13 << (32 - 8) | v13 >>> 8;
        v8 += v13;
        v7 ^= v8;
        v7 = v7 << (32 - 7) | v7 >>> 7;
        v3 += m0;
        v3 += v4;
        v14 ^= v3;
        v14 = v14 << (32 - 8) | v14 >>> 8;
        v9 += v14;
        v4 ^= v9;
        v4 = v4 << (32 - 7) | v4 >>> 7;
        v1 += m14;
        v1 += v6;
        v12 ^= v1;
        v12 = v12 << (32 - 8) | v12 >>> 8;
        v11 += v12;
        v6 ^= v11;
        v6 = (v6 << (32 - 7)) | (v6 >>> 7);
        v0 += m11;
        v0 += v5;
        v15 ^= v0;
        v15 = (v15 << (32 - 8)) | (v15 >>> 8);
        v10 += v15;
        v5 ^= v10;
        v5 = (v5 << (32 - 7)) | (v5 >>> 7);

        this.h[0] ^= v0 ^ v8;
        this.h[1] ^= v1 ^ v9;
        this.h[2] ^= v2 ^ v10;
        this.h[3] ^= v3 ^ v11;
        this.h[4] ^= v4 ^ v12;
        this.h[5] ^= v5 ^ v13;
        this.h[6] ^= v6 ^ v14;
        this.h[7] ^= v7 ^ v15;
    };

    BLAKE2s.prototype.stringToUtf8Array = function (s) {
        var arr = [];
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c < 128) {
                arr.push(c);
            } else if (c > 127 && c < 2048) {
                arr.push((c >> 6) | 192);
                arr.push((c & 63) | 128);
            } else {
                arr.push((c >> 12) | 224);
                arr.push(((c >> 6) & 63) | 128);
                arr.push((c & 64) | 128);
            }
        }
        return arr;
    };

    BLAKE2s.prototype.update = function (p, offset, length) {
        if (typeof offset === "undefined") { offset = 0; }
        if (typeof length === "undefined") { length = p.length; }
        if (this.isFinished) {
            throw 'update() after calling digest()';
        }
        if (typeof p == 'string') {
            if (offset != 0) {
                throw 'offset not supported for strings';
            }
            p = this.stringToUtf8Array(p);
            length = p.length;
            offset = 0;
        } else if (typeof p != 'object') {
            throw 'unsupported object: string or array required';
        }
        if (length == 0) {
            return;
        }
        var left = 64 - this.nx;
        if (length > left) {
            for (var i = 0; i < left; i++) {
                this.x[this.nx + i] = p[offset + i];
            }
            this.processBlock(64);
            offset += left;
            length -= left;
            this.nx = 0;
        }
        while (length > 64) {
            for (var i = 0; i < 64; i++) {
                this.x[i] = p[offset + i];
            }
            this.processBlock(64);
            offset += 64;
            length -= 64;
            this.nx = 0;
        }
        for (var i = 0; i < length; i++) {
            this.x[this.nx + i] = p[offset + i];
        }
        this.nx += length;
    };

    BLAKE2s.prototype.digest = function () {
        if (this.isFinished) {
            return this.result;
        }

        for (var i = this.nx; i < 64; i++) {
            this.x[i] = 0;
        }

        // Set last block flag.
        this.f0 = 0xffffffff;

        //TODO in tree mode, set f1 to 0xffffffff.
        this.processBlock(this.nx);

        var out = new Array(32);
        for (var i = 0; i < 8; i++) {
            var h = this.h[i];
            out[i * 4 + 0] = (h >>> 0) & 0xff;
            out[i * 4 + 1] = (h >>> 8) & 0xff;
            out[i * 4 + 2] = (h >>> 16) & 0xff;
            out[i * 4 + 3] = (h >>> 24) & 0xff;
        }
        this.result = out.slice(0, this.digestLength);
        this.isFinished = true;
        return this.result;
    };

    /////////////////// BEGIN HASH FUNCTION INTERFACE ////////////////////

    function hashFunctionInterface(params){
        var self = this;

        this.name = 'BLAKE2s';
        this.blockSize = 32;
        if(
            params &&
            tool.get('util.type')(params.length).isNumber() &&
            params.length <= 32 &&
            params.length >= 1
        )
            this.digestSize = Math.floor(params.length);
        else
            this.digestSize = 32;

        function dohash(dataBuf, keyBuf){
            if(keyBuf)
                var h = new BLAKE2s(self.digestSize, new Uint8Array(keyBuf));
            else
                var h = new BLAKE2s(self.digestSize);
            h.update(new Uint8Array(dataBuf));
            return new Uint8Array(h.digest()).buffer;
        };            

        this.mac = function(dataBuf, keyBuf){
            if(keyBuf.byteLength > 32) keyBuf = keyBuf.slice(0, 32);
            return dohash(dataBuf, keyBuf);
        };

        this.hash = function(dataBuf){
            return dohash(dataBuf);
        };

        return this;
    };

    

    ////////////////////// EXPORT THE HASH FUNCTION //////////////////////

    tool.set('hash.algorithms.blake2s', hashFunctionInterface);

})(tool);
/*
 * Hash Function Caller
 * ====================
 *
 * `__enigma_jscrypto__.hash`  is a function, usage like:
 *
 *      __enigma_jscrypto__.hash(ALGORITHM).hash(STRING).digest()
 *                                                      .hexdigest()
 *                                         .mac(STRING, KEY)
 *                                                      .digest()
 *                                                      .hexdigest()
 *                                         .pbkdf2(key, salt, iteration, len)
 *
 * The MAC procedure will be mostly done using HMAC. But since BLAKE2s
 * provides an internal mechanism, it will then be used.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// TODO FIXME remove hashFuncRegTable and use tool.get to load module!!! XXX

// holds the registered algorithms
var hashFuncRegTable = {};


function hash(algorithmName, algorithmParams){
    var self = this;
    
    this.algorithms = ['ripemd160', 'blake2s', 'whirlpool'];

    algorithmName = algorithmName.toLowerCase();
    if(this.algorithms.indexOf(algorithmName) < 0)
        throw new Error('hash-algorithm-unknown');
    var choosenAlgorithm = tool.get('hash.algorithms.' + algorithmName);

    function _genReturn(retArrayBuffer){
        return {
            hex: tool.get('util.encoding')(retArrayBuffer).toHEX(),
            buffer: retArrayBuffer,
        };
    };

    this.hash = function(dataBuffer){
        if(!tool.get('util.type')(dataBuffer).isArrayBuffer()) 
            throw Error('invalid-parameter');

        var doer = new choosenAlgorithm(algorithmParams);
        return _genReturn(doer.hash(dataBuffer));
    };

    this.mac = function(dataBuffer, keyBuffer){
        if(!(
            tool.get('util.type')(keyBuffer).isArrayBuffer() &&
            tool.get('util.type')(dataBuffer).isArrayBuffer()
        ))
            throw Error('invalid-parameter');

        var ret;

        var doer = new choosenAlgorithm(algorithmParams);
        if(tool.get('util.type')(doer.mac).isFunction())
            // when there is a built-in MAC function
            ret = doer.mac(dataBuffer, keyBuffer);
        else
            // use HMAC method to calculate that
            ret = _HMAC(
                doer.hash,
                keyBuffer,
                dataBuffer,
                doer.blockSize
            );

        return _genReturn(ret);
    };

    this.pbkdf2 = function(keyBuf, saltBuf, iterations, length){ 
        if(!(
            tool.get('util.type')(keyBuf).isArrayBuffer() &&
            tool.get('util.type')(saltBuf).isArrayBuffer() &&
            iterations > 0 &&
            length > 0
        ))
            throw Error('invalid-parameter');

        return _PBKDF2(
            self.mac,
            new choosenAlgorithm().digestSize,
            keyBuf,
            saltBuf,
            iterations,
            length
        );
    };

    return this;
};

///////////////////////////// HMAC ALGORITHM /////////////////////////////////

function _HMAC(hasher, keyBuffer, dataBuffer, blockSizeBytes){
    if(keyBuffer.byteLength > blockSizeBytes){
        // keys longer than blocksize are shortened
        keyBuffer = new Uint8Array(hasher(keyBuffer));
    } else if(keyBuffer.byteLength < blockSizeBytes){
        // keys shorter than blocksize are zero-padded
        var padBuf = new Uint8Array(blockSizeBytes),
            viewBuf = new Uint8Array(keyBuffer);
        for(var i=0; i<padBuf.length; i++){
            if(i < keyBuffer.byteLength)
                padBuf[i] = viewBuf[i];
            else
                padBuf[i] = 0;
        };
        keyBuffer = padBuf;
    };
    // now is keyBuffer of type Uint8Array.
  
    var o_key_pad = new Uint8Array(blockSizeBytes);
    var i_key_pad = new Uint8Array(blockSizeBytes);
    for(var i=0; i<blockSizeBytes; i++){
        o_key_pad[i] = 0x5c ^ keyBuffer[i];
        i_key_pad[i] = 0x36 ^ keyBuffer[i];
    };

    var innen = tool.get('util.buffer').concat([i_key_pad.buffer, dataBuffer]),
        hashInnen = hasher(innen);

    var outer = tool.get('util.buffer').concat([o_key_pad.buffer, hashInnen]),
        hashOuter = hasher(outer);
    return hashOuter;
};

///////////////////////////// PBKDF2 IMPLEMENTATION //////////////////////////

function _PBKDF2(
    macFunc,
    hashLength,
    passwordBuffer,
    saltBuffer,
    iterations,
    keylen
){
    var blockCount = Math.ceil(keylen / hashLength);
    var DKs = new Array(blockCount);

    for(var i=0; i<blockCount; i++){
        // in each loop, calculate 
        // T_i = F(pwd, salt, c, i) = U1^U2^U3...^Uc, c = iterations

        var Tret = false;

        var appendix = new Uint32Array([i]);
        var prevU = tool.get('util.buffer')
            .concat([saltBuffer, appendix.buffer]);

        for(var j=0; j<iterations; j++){
            // use MAC
            var U = macFunc(passwordBuffer, prevU).buffer;

            if(false === Tret)
                // save this first U into result.
                Tret = U;
            else
                // perform XOR
                Tret = tool.get('util.buffer').xor(U, Tret);

            // save this U for next round
            prevU = U;
        };

        DKs[i] = Tret;
    };

    return tool.get('util.buffer').concat(DKs).slice(0, keylen);
};





tool.exp('hash', hash);
tool.set('hash', hash);
//////////////////////////////////////////////////////////////////////////////
})(tool);
//module.exports = ripemd160
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/** @preserve
(c) 2012 by Cédric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// Constants table
var zl = [
    0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
    7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
    3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
    1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
    4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13];
var zr = [
    5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
    6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
    15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
    8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
    12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11];
var sl = [
     11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
    7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
    11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
      11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
    9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ];
var sr = [
    8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
    9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
    9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
    15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
    8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ];

var hl =  [ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
var hr =  [ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

var bytesToWords = function (bytes) {
  var words = [];
  for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
    words[b >>> 5] |= bytes[i] << (24 - b % 32);
  }
  return words;
};

var wordsToBytes = function (words) {
  var bytes = [];
  for (var b = 0; b < words.length * 32; b += 8) {
    bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
  }
  return bytes;
};

var processBlock = function (H, M, offset) {

  // Swap endian
  for (var i = 0; i < 16; i++) {
    var offset_i = offset + i;
    var M_offset_i = M[offset_i];

    // Swap
    M[offset_i] = (
        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
    );
  }

  // Working variables
  var al, bl, cl, dl, el;
  var ar, br, cr, dr, er;

  ar = al = H[0];
  br = bl = H[1];
  cr = cl = H[2];
  dr = dl = H[3];
  er = el = H[4];
  // Computation
  var t;
  for (var i = 0; i < 80; i += 1) {
    t = (al +  M[offset+zl[i]])|0;
    if (i<16){
        t +=  f1(bl,cl,dl) + hl[0];
    } else if (i<32) {
        t +=  f2(bl,cl,dl) + hl[1];
    } else if (i<48) {
        t +=  f3(bl,cl,dl) + hl[2];
    } else if (i<64) {
        t +=  f4(bl,cl,dl) + hl[3];
    } else {// if (i<80) {
        t +=  f5(bl,cl,dl) + hl[4];
    }
    t = t|0;
    t =  rotl(t,sl[i]);
    t = (t+el)|0;
    al = el;
    el = dl;
    dl = rotl(cl, 10);
    cl = bl;
    bl = t;

    t = (ar + M[offset+zr[i]])|0;
    if (i<16){
        t +=  f5(br,cr,dr) + hr[0];
    } else if (i<32) {
        t +=  f4(br,cr,dr) + hr[1];
    } else if (i<48) {
        t +=  f3(br,cr,dr) + hr[2];
    } else if (i<64) {
        t +=  f2(br,cr,dr) + hr[3];
    } else {// if (i<80) {
        t +=  f1(br,cr,dr) + hr[4];
    }
    t = t|0;
    t =  rotl(t,sr[i]) ;
    t = (t+er)|0;
    ar = er;
    er = dr;
    dr = rotl(cr, 10);
    cr = br;
    br = t;
  }
  // Intermediate hash value
  t    = (H[1] + cl + dr)|0;
  H[1] = (H[2] + dl + er)|0;
  H[2] = (H[3] + el + ar)|0;
  H[3] = (H[4] + al + br)|0;
  H[4] = (H[0] + bl + cr)|0;
  H[0] =  t;
};

function f1(x, y, z) {
  return ((x) ^ (y) ^ (z));
}

function f2(x, y, z) {
  return (((x)&(y)) | ((~x)&(z)));
}

function f3(x, y, z) {
  return (((x) | (~(y))) ^ (z));
}

function f4(x, y, z) {
  return (((x) & (z)) | ((y)&(~(z))));
}

function f5(x, y, z) {
  return ((x) ^ ((y) |(~(z))));
}

function rotl(x,n) {
  return (x<<n) | (x>>>(32-n));
}

function ripemd160(messageBuf){
    var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],
        message = new Uint8Array(messageBuf);


    var m = bytesToWords(message);

    var nBitsLeft = message.length * 8;
    var nBitsTotal = message.length * 8;

    // Add padding
    m[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
    m[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
        (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
        (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
    );

    for (var i=0 ; i<m.length; i += 16)
        processBlock(H, m, i);

    // Swap endian
    var H_i;
    for (var i = 0; i < 5; i++) {
        // Shortcut
        H_i = H[i];
        // Swap
        H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
          (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
    };

    var digestbytes = wordsToBytes(H);
    return new Uint8Array(digestbytes).buffer;
};


    /////////////////// BEGIN HASH FUNCTION INTERFACE ////////////////////

    function hashFunctionInterface(){
        var self = this;

        this.name = 'RIPEMD160';
        this.blockSize = 64;
        this.digestSize = 20;

        this.hash = function(dataBuf){
            return ripemd160(dataBuf);
        };

        return this;
    };

    ////////////////////// EXPORT THE HASH FUNCTION //////////////////////
    
    tool.set('hash.algorithms.ripemd160', hashFunctionInterface);

//////////////////////////////////////////////////////////////////////////////
})(tool);
/* Whirlpool Hashing Function v3.0
 * ~ Sean Catchpole - Copyright 2009 Public Domain 
 *
 * http://www.sunsean.com/Whirlpool.html
 *
 * Any modifications released under BSD 2-Clause License:
 * http://opensource.org/licenses/BSD-2-Clause
 *
 * Copyright (c) 2013, Jeff Steinport (https://js.gg)
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 * 
 * Simple usage: Whirlpool(var);
*/

(function(tool){
  var WP, R=10, C=[], rc=[], t, x, c, r, i,
      v1, v2, v4, v5, v8, v9, sbox=
  "\u1823\uc6E8\u87B8\u014F\u36A6\ud2F5\u796F\u9152"+
  "\u60Bc\u9B8E\uA30c\u7B35\u1dE0\ud7c2\u2E4B\uFE57"+
  "\u1577\u37E5\u9FF0\u4AdA\u58c9\u290A\uB1A0\u6B85"+
  "\uBd5d\u10F4\ucB3E\u0567\uE427\u418B\uA77d\u95d8"+
  "\uFBEE\u7c66\udd17\u479E\ucA2d\uBF07\uAd5A\u8333"+
  "\u6302\uAA71\uc819\u49d9\uF2E3\u5B88\u9A26\u32B0"+
  "\uE90F\ud580\uBEcd\u3448\uFF7A\u905F\u2068\u1AAE"+
  "\uB454\u9322\u64F1\u7312\u4008\uc3Ec\udBA1\u8d3d"+
  "\u9700\ucF2B\u7682\ud61B\uB5AF\u6A50\u45F3\u30EF"+
  "\u3F55\uA2EA\u65BA\u2Fc0\udE1c\uFd4d\u9275\u068A"+
  "\uB2E6\u0E1F\u62d4\uA896\uF9c5\u2559\u8472\u394c"+
  "\u5E78\u388c\ud1A5\uE261\uB321\u9c1E\u43c7\uFc04"+
  "\u5199\u6d0d\uFAdF\u7E24\u3BAB\ucE11\u8F4E\uB7EB"+
  "\u3c81\u94F7\uB913\u2cd3\uE76E\uc403\u5644\u7FA9"+
  "\u2ABB\uc153\udc0B\u9d6c\u3174\uF646\uAc89\u14E1"+
  "\u163A\u6909\u70B6\ud0Ed\ucc42\u98A4\u285c\uF886";

  for(t=8; t-->0;) C[t]=[];
  for(x=0; x<256; x++) {
      c = sbox.charCodeAt(x/2);
      v1 = ((x & 1) == 0) ? c >>> 8 : c & 0xff;
      v2 = v1 << 1;
      if (v2 >= 0x100)
          v2 ^= 0x11d;
      v4 = v2 << 1;
      if (v4 >= 0x100)
          v4 ^= 0x11d;
      v5 = v4 ^ v1;
      v8 = v4 << 1;
      if (v8 >= 0x100)
          v8 ^= 0x11d;
      v9 = v8 ^ v1;

      // Build the circulant table C[0][x] = S[x].[1, 1, 4, 1, 8, 5, 2, 9]:
      C[0][x]=[0,0];
      C[0][x][0] = (v1 << 24) | (v1 << 16) | (v4 <<  8) | (v1);
      C[0][x][1] = (v8 << 24) | (v5 << 16) | (v2 <<  8) | (v9);

      // Build the remaining circulant tables C[t][x] = C[0][x] rotr t
      for (var t=1; t<8; t++) {
        C[t][x]=[0,0];
        C[t][x][0] = (C[t - 1][x][0] >>> 8) | ((C[t - 1][x][1] << 24));
        C[t][x][1] = (C[t - 1][x][1] >>> 8) | ((C[t - 1][x][0] << 24));
      }
  }

  // Build the round constants:
  rc[0] = [0,0];
  for (r=1; r<=R; r++) {
    i = 8*(r - 1);
    rc[r]=[0,0];
    rc[r][0] = (C[0][i    ][0] & 0xff000000)^
               (C[1][i + 1][0] & 0x00ff0000)^
               (C[2][i + 2][0] & 0x0000ff00)^
               (C[3][i + 3][0] & 0x000000ff);
    rc[r][1] = (C[4][i + 4][1] & 0xff000000)^
               (C[5][i + 5][1] & 0x00ff0000)^
               (C[6][i + 6][1] & 0x0000ff00)^
               (C[7][i + 7][1] & 0x000000ff);
  }

  var bitLength=[], // [32] Global number of hashed bits (256-bit counter).
      buffer=[],    // [64] Buffer of data to hash.
      bufferBits=0, // Current number of bits on the buffer.
      bufferPos=0,  // Current (possibly incomplete) byte slot on the buffer.
      // The following longs are split into [int,int]
      hash=[],      // [8] the hashing state
      K=[],         // [8] the round key
      L=[],         // [8] temp key?
      block=[],     // [8] mu(buffer)
      state=[];     // [8] the chipher state

  // The core Whirlpool transform.
  var processBuffer = function(){
    var i,j,r,s,t;
    // map the buffer to a block:
    for(i=0,j=0; i<8; i++,j+=8) {
      block[i]=[0,0];
      block[i][0] = ((buffer[j    ] & 0xff) << 24)^
                    ((buffer[j + 1] & 0xff) << 16)^
                    ((buffer[j + 2] & 0xff) <<  8)^
                    ((buffer[j + 3] & 0xff)      );
      block[i][1] = ((buffer[j + 4] & 0xff) << 24)^
                    ((buffer[j + 5] & 0xff) << 16)^
                    ((buffer[j + 6] & 0xff) <<  8)^
                    ((buffer[j + 7] & 0xff)      );
    }
    // compute and apply K^0 to the cipher state:
    for (i=0; i<8; i++) {
      state[i]=[0,0]; K[i]=[0,0];
      state[i][0] = block[i][0] ^ (K[i][0] = hash[i][0]);
      state[i][1] = block[i][1] ^ (K[i][1] = hash[i][1]);
    }
    // iterate over all rounds:
    for (r=1; r<=R; r++) {
      // compute K^r from K^{r-1}:
      for (i=0; i<8; i++) {
        L[i]=[0,0];
        for (t=0,s=56,j=0; t<8; t++,s-=8,j=s<32?1:0) {
          L[i][0] ^= C[t][(K[(i - t) & 7][j] >>> (s%32)) & 0xff][0];
          L[i][1] ^= C[t][(K[(i - t) & 7][j] >>> (s%32)) & 0xff][1];
        }
      }
      for (i=0; i<8; i++) {
        K[i][0] = L[i][0];
        K[i][1] = L[i][1];
      }
      K[0][0] ^= rc[r][0];
      K[0][1] ^= rc[r][1];
      // apply the r-th round transformation:
      for (i=0; i<8; i++) {
        L[i][0] = K[i][0];
        L[i][1] = K[i][1];
        for (t=0,s=56,j=0; t<8; t++,s-=8,j=s<32?1:0) {
          L[i][0] ^= C[t][(state[(i - t) & 7][j] >>> (s%32)) & 0xff][0];
          L[i][1] ^= C[t][(state[(i - t) & 7][j] >>> (s%32)) & 0xff][1];
        }
      }
      for (i=0; i<8; i++) {
        state[i][0] = L[i][0];
        state[i][1] = L[i][1];
      }
    }
    // apply the Miyaguchi-Preneel compression function:
    for (i=0; i<8; i++) {
      hash[i][0] ^= state[i][0] ^ block[i][0];
      hash[i][1] ^= state[i][1] ^ block[i][1];
    }
  };

  WP = Whirlpool = function(str){ return WP.init().add(str).finalize(); };
  WP.version = "3.0";

  // Initialize the hashing state.
  WP.init = function(){
    for(var i=32; i-->0;) bitLength[i]=0;
    bufferBits = bufferPos = 0;
    buffer = [0]; // it's only necessary to cleanup buffer[bufferPos].
    for(i=8; i-->0;) hash[i]=[0,0];
    return WP;
  };

  // Delivers input data to the hashing algorithm. Assumes bufferBits < 512
  WP.add = function(sourceBuf){
    /*
                       sourcePos
                       |
                       +-------+-------+-------
                          ||||||||||||||||||||| source
                       +-------+-------+-------
    +-------+-------+-------+-------+-------+-------
    ||||||||||||||||||||||                           buffer
    +-------+-------+-------+-------+-------+-------
                    |
                    bufferPos
    */
    if(!sourceBuf) return WP;

    var source = new Uint8Array(sourceBuf);
    var sourceBits = source.length * 8;
    
    var sourcePos = 0, // index of leftmost source byte containing data (1 to 8 bits).
        sourceGap = (8 - (sourceBits & 7)) & 7, // space on source[sourcePos].
        bufferRem = bufferBits & 7, // occupied bits on buffer[bufferPos].
        i, b, carry, value = sourceBits;
    for (i=31, carry=0; i>=0; i--) { // tally the length of the added data
      carry += (bitLength[i] & 0xff) + (value % 256);
      bitLength[i] = carry & 0xff;
      carry >>>= 8;
      value = Math.floor(value/256);
    }
    // process data in chunks of 8 bits:
    while (sourceBits > 8) { // at least source[sourcePos] and source[sourcePos+1] contain data.
      // take a byte from the source:
      b = ((source[sourcePos] << sourceGap) & 0xff) |
        ((source[sourcePos + 1] & 0xff) >>> (8 - sourceGap));
      if (b < 0 || b >= 256) return "Whirlpool requires a byte array";
      // process this byte:
      buffer[bufferPos++] |= b >>> bufferRem;
      bufferBits += 8 - bufferRem; // bufferBits = 8*bufferPos;
      if (bufferBits == 512) {
        processBuffer(); // process data block
        bufferBits = bufferPos = 0; buffer=[]; // reset buffer
      }
      buffer[bufferPos] = ((b << (8 - bufferRem)) & 0xff);
      bufferBits += bufferRem;
      // proceed to remaining data
      sourceBits -= 8;
      sourcePos++;
    }
    // now 0 <= sourceBits <= 8;
    // furthermore, all data (if any is left) is in source[sourcePos].
    if (sourceBits > 0) {
      b = (source[sourcePos] << sourceGap) & 0xff; // bits are left-justified on b.
      buffer[bufferPos] |= b >>> bufferRem; // process the remaining bits
    } else { b = 0; }
    if (bufferRem + sourceBits < 8) {
      // all remaining data fits on buffer[bufferPos], and there still remains some space.
      bufferBits += sourceBits;
    } else {
      bufferPos++; // buffer[bufferPos] is full
      bufferBits += 8 - bufferRem; // bufferBits = 8*bufferPos;
      sourceBits -= 8 - bufferRem;
      // now 0 <= sourceBits < 8; furthermore, all data is in source[sourcePos].
      if (bufferBits == 512) {
        processBuffer(); // process data block
        bufferBits = bufferPos = 0; buffer=[]; // reset buffer
      }
      buffer[bufferPos] = ((b << (8 - bufferRem)) & 0xff);
      bufferBits += sourceBits;
    }
    return WP;
  };

  // Get the hash value from the hashing state. Assumes bufferBits < 512
  WP.finalize = function(){
    var i,j,h, str="", digest=[];
    buffer[bufferPos] |= 0x80 >>> (bufferBits & 7); // append a '1'-bit:
    bufferPos++; // all remaining bits on the current byte are set to zero.
    if(bufferPos > 32) { // pad with zero bits to complete 512N + 256 bits:
      while (bufferPos < 64) buffer[bufferPos++] = 0;
      processBuffer(); // process data block
      bufferPos = 0; buffer=[]; // reset buffer
    }
    while(bufferPos < 32) buffer[bufferPos++] = 0;
    buffer.push.apply(buffer,bitLength); // append bit length of hashed data
    processBuffer(); // process data block
    for(i=0,j=0; i<8; i++,j+=8) { // return the completed message digest
      h = hash[i][0];
      digest[j    ] = h >>> 24 & 0xFF;
      digest[j + 1] = h >>> 16 & 0xFF;
      digest[j + 2] = h >>>  8 & 0xFF;
      digest[j + 3] = h        & 0xFF;
      h = hash[i][1];
      digest[j + 4] = h >>> 24 & 0xFF;
      digest[j + 5] = h >>> 16 & 0xFF;
      digest[j + 6] = h >>>  8 & 0xFF;
      digest[j + 7] = h        & 0xFF;
    };

    return new Uint8Array(digest).buffer;
  };





    /////////////////// BEGIN HASH FUNCTION INTERFACE ////////////////////

    function hashFunctionInterface(){
        var self = this;

        this.name = 'WHIRLPOOL';
        this.blockSize = 64;
        this.digestSize = 64;

        this.hash = function(dataBuf){
            return Whirlpool(dataBuf);
        };

        return this;
    };

    

    ////////////////////// EXPORT THE HASH FUNCTION //////////////////////

    tool.set('hash.algorithms.whirlpool', hashFunctionInterface);

})(tool);
//////////////////////////////////////////////////////////////////////////////
// JavaScript AES implementation using ArrayBuffer
// Copyright (c) 2013 <mattias.wadman@gmail.com>
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
(function(tool){
//////////////////////////////////////////////////////////////////////////////
function _AES() {
  // spec from http://csrc.nist.gov/publications/fips/fips197/fips-197.pdf

  // for performance cipher and inv_cipher do not create new objects
  // instead they take a input buffer and pass it around to keep state
  // and it is also used as output.

  var block_size_bytes = 16;
  var block_size_words = 4;
  var nb = 4;
  var sbox = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ];

  var inv_sbox = [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
  ];

  var rcon = [
    0x00000000,
    0x01000000,
    0x02000000,
    0x04000000,
    0x08000000,
    0x10000000,
    0x20000000,
    0x40000000,
    0x80000000,
    0x1b000000,
    0x36000000
  ];

  // from http://www.cs.utsa.edu/~wagner/laws/FFM.html
  function ffmul(a, b) {
    var r = 0;
    var t;

    while (a) {
      if ((a & 1)) {
        r = r ^ b;
      }

      t = b & 0x80;
      b <<= 1;
      if (t) {
        b ^= 0x1b;
      }

      a >>= 1;
    }

    return r;
  }

  function ffmul_table(n) {
    var table = new Array(256);

    for (var i = 0; i < 256; i++) {
      table[i] = ffmul(n, i) & 0xff;
    }

    return table;
  }

  // precompute for factors used in (inv)mix_columns
  var ffmul_t_2 = ffmul_table(2);
  var ffmul_t_3 = ffmul_table(3);
  var ffmul_t_9 = ffmul_table(9);
  var ffmul_t_b = ffmul_table(0xb);
  var ffmul_t_d = ffmul_table(0xd);
  var ffmul_t_e = ffmul_table(0xe);

  function sub_word(w) {
    return (
      sbox[w >>> 24] << 24 |
      sbox[(w >>> 16) & 0xff] << 16 |
      sbox[(w >>> 8) & 0xff] << 8 |
      sbox[w & 0xff]
    );
  }

  function rot_word(w) {
    return w >>> 24 | w << 8;
  }

  function endian_swap32(n) {
    return n >>> 24 | (n & 0xff0000) >>> 8 | (n & 0xff00) << 8 | (n & 0xff) << 24;
  }

  // little endian if first byte in 32 bit uint 1 is 1
  var is_little_endian = ((new Uint8Array((new Uint32Array([1])).buffer))[0] == 1);

  // key is 16, 24 or 32 byte ArrayBuffer
  function key_expansion(key) {
    var key_u8 = new Uint8Array(key);
    var nk = key_u8.length / 4;
    var nr = nk + 6;

    var w = new Uint32Array(nb * (nr+1));
    for (var i = 0; i < nk; i++) {
      w[i] = (
        key_u8[i*4] << 24 |
        key_u8[i*4+1] << 16 |
        key_u8[i*4+2] << 8 |
        key_u8[i*4+3]
      );
    }

    for (var i = nk; i < nb*(nr+1); i++) {
      var temp = w[i - 1];
      if (i % nk == 0) {
        temp = sub_word(rot_word(temp)) ^ rcon[i/nk];
      } else if (nk > 6 && i % nk == 4) {
        temp = sub_word(temp);
      }

      w[i] = w[i - nk] ^ temp;
    }

    // make sure key schedule byte order matches state byte order
    // this is so that correct bytes are xored for add_round_key
    if (is_little_endian) {
      for (var i = 0; i < w.length; i++) {
        w[i] = endian_swap32(w[i]);
      }
    }

    return w;
  }

  // state_u8 is 16 byte Uint8Array (also used as output)
  // w is value from key_expansion
  function cipher(state_u32, w) {
    var nr = (w.length / nb - 1)*4;
    var s0, s1, s2, s3;
    var t0, t1, t2, t3;
    var m0, m1, m2, m3;

    // add_round_key
    s0 = (state_u32[0] ^ w[0]) >>> 0;
    s1 = (state_u32[1] ^ w[1]) >>> 0;
    s2 = (state_u32[2] ^ w[2]) >>> 0;
    s3 = (state_u32[3] ^ w[3]) >>> 0;

    for (var round = 4; round < nr; round += 4) {
      // sub_byte, shift_rows, mix_columns, add_round_key

      t0 = s0;
      t1 = s1;
      t2 = s2;
      t3 = s3;

      m0 = sbox[t0 & 0xff] >>> 0;
      m1 = sbox[(t1 >>> 8) & 0xff] >>> 0;
      m2 = sbox[(t2 >>> 16) & 0xff] >>> 0;
      m3 = sbox[t3 >>> 24] >>> 0;
      s0 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round]) >>> 0;
      m0 = sbox[t1 & 0xff] >>> 0;
      m1 = sbox[(t2 >>> 8) & 0xff] >>> 0;
      m2 = sbox[(t3 >>> 16) & 0xff] >>> 0;
      m3 = sbox[t0 >>> 24] >>> 0;
      s1 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+1]) >>> 0;
      m0 = sbox[t2 & 0xff] >>> 0;
      m1 = sbox[(t3 >>> 8) & 0xff] >>> 0;
      m2 = sbox[(t0 >>> 16) & 0xff] >>> 0;
      m3 = sbox[t1 >>> 24] >>> 0;
      s2 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+2]) >>> 0;
      m0 = sbox[t3 & 0xff] >>> 0;
      m1 = sbox[(t0 >>> 8) & 0xff] >>> 0;
      m2 = sbox[(t1 >>> 16) & 0xff] >>> 0;
      m3 = sbox[t2 >>> 24] >>> 0;
      s3 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+3]) >>> 0;
    }

    // sub_byte, shift_rows, add_round_key
    state_u32[0] = w[nr] ^ (sbox[s0 & 0xff] | sbox[(s1 >>> 8) & 0xff] << 8 | sbox[(s2 >>> 16) & 0xff] << 16 | sbox[s3 >>> 24] << 24);
    state_u32[1] = w[nr+1] ^ (sbox[s1 & 0xff] | sbox[(s2 >>> 8) & 0xff] << 8 | sbox[(s3 >>> 16) & 0xff] << 16 | sbox[s0 >>> 24] << 24);
    state_u32[2] = w[nr+2] ^ (sbox[s2 & 0xff] | sbox[(s3 >>> 8) & 0xff] << 8 | sbox[(s0 >>> 16) & 0xff] << 16 | sbox[s1 >>> 24] << 24);
    state_u32[3] = w[nr+3] ^ (sbox[s3 & 0xff] | sbox[(s0 >>> 8) & 0xff] << 8 | sbox[(s1 >>> 16) & 0xff] << 16 | sbox[s2 >>> 24] << 24);
  }

  // state_u8 is 16 byte Uint8Array (also used as output)
  // w is value from key_expansion
  function inv_cipher(state_u32, w) {
    var nr = (w.length / nb - 1) * 4;
    var s0, s1, s2, s3;
    var t0, t1, t2, t3;

    // add_round_key
    s0 = (state_u32[0] ^ w[nr]) >>> 0;
    s1 = (state_u32[1] ^ w[nr+1]) >>> 0;
    s2 = (state_u32[2] ^ w[nr+2]) >>> 0;
    s3 = (state_u32[3] ^ w[nr+3]) >>> 0;

    for (var round = nr-4; round > 0; round -= 4) {
      // inv_shift_rows, inv_sub_byte, add_round_key

      t0 = s0;
      t1 = s1;
      t2 = s2;
      t3 = s3;
      s0 = ((
          inv_sbox[t0 & 0xff] | inv_sbox[(t3 >>> 8) & 0xff] << 8 | inv_sbox[(t2 >>> 16) & 0xff] << 16 | inv_sbox[t1 >>> 24] << 24
          ) ^ w[round]) >>> 0;
      s1 = ((
          inv_sbox[t1 & 0xff] | inv_sbox[(t0 >>> 8) & 0xff] << 8 | inv_sbox[(t3 >>> 16) & 0xff] << 16 | inv_sbox[t2 >>> 24] << 24
          ) ^ w[round+1]) >>> 0;
      s2 = ((
        inv_sbox[t2 & 0xff] | inv_sbox[(t1 >>> 8) & 0xff] << 8 | inv_sbox[(t0 >>> 16) & 0xff] << 16 | inv_sbox[t3 >>> 24] << 24
        ) ^ w[round+2]) >>> 0;
      s3 = ((
        inv_sbox[t3 & 0xff] | inv_sbox[(t2 >>> 8) & 0xff] << 8 | inv_sbox[(t1 >>> 16) & 0xff] << 16 | inv_sbox[t0 >>> 24] << 24
        ) ^ w[round+3]) >>> 0;

      // inv_mix_columns
      t0 = s0 & 0xff >>> 0;
      t1 = ((s0 >>> 8) & 0xff) >>>0;
      t2 = ((s0 >>> 16) & 0xff) >>> 0;
      t3 = s0 >>> 24;
      s0 = (
        (ffmul_t_e[t0] ^ ffmul_t_b[t1] ^ ffmul_t_d[t2] ^ ffmul_t_9[t3]) |
        (ffmul_t_9[t0] ^ ffmul_t_e[t1] ^ ffmul_t_b[t2] ^ ffmul_t_d[t3]) << 8 |
        (ffmul_t_d[t0] ^ ffmul_t_9[t1] ^ ffmul_t_e[t2] ^ ffmul_t_b[t3]) << 16 |
        (ffmul_t_b[t0] ^ ffmul_t_d[t1] ^ ffmul_t_9[t2] ^ ffmul_t_e[t3]) << 24
      ) >>> 0;
      t0 = (s1 & 0xff) >>> 0;
      t1 = ((s1 >>> 8) & 0xff) >>> 0;
      t2 = ((s1 >>> 16) & 0xff) >>> 0;
      t3 = s1 >>> 24;
      s1 = (
        (ffmul_t_e[t0] ^ ffmul_t_b[t1] ^ ffmul_t_d[t2] ^ ffmul_t_9[t3]) |
        (ffmul_t_9[t0] ^ ffmul_t_e[t1] ^ ffmul_t_b[t2] ^ ffmul_t_d[t3]) << 8 |
        (ffmul_t_d[t0] ^ ffmul_t_9[t1] ^ ffmul_t_e[t2] ^ ffmul_t_b[t3]) << 16 |
        (ffmul_t_b[t0] ^ ffmul_t_d[t1] ^ ffmul_t_9[t2] ^ ffmul_t_e[t3]) << 24
      ) >>> 0;
      t0 = (s2 & 0xff) >>> 0;
      t1 = ((s2 >>> 8) & 0xff) >>> 0;
      t2 = ((s2 >>> 16) & 0xff) >>> 0;
      t3 = s2 >>> 24;
      s2 = (
        (ffmul_t_e[t0] ^ ffmul_t_b[t1] ^ ffmul_t_d[t2] ^ ffmul_t_9[t3]) |
        (ffmul_t_9[t0] ^ ffmul_t_e[t1] ^ ffmul_t_b[t2] ^ ffmul_t_d[t3]) << 8 |
        (ffmul_t_d[t0] ^ ffmul_t_9[t1] ^ ffmul_t_e[t2] ^ ffmul_t_b[t3]) << 16 |
        (ffmul_t_b[t0] ^ ffmul_t_d[t1] ^ ffmul_t_9[t2] ^ ffmul_t_e[t3]) << 24
      ) >>> 0;
      t0 = (s3 & 0xff) >>> 0;
      t1 = ((s3 >>> 8) & 0xff) >>> 0;
      t2 = ((s3 >>> 16) & 0xff) >>> 0;
      t3 = s3 >>> 24;
      s3 = (
        (ffmul_t_e[t0] ^ ffmul_t_b[t1] ^ ffmul_t_d[t2] ^ ffmul_t_9[t3]) |
        (ffmul_t_9[t0] ^ ffmul_t_e[t1] ^ ffmul_t_b[t2] ^ ffmul_t_d[t3]) << 8 |
        (ffmul_t_d[t0] ^ ffmul_t_9[t1] ^ ffmul_t_e[t2] ^ ffmul_t_b[t3]) << 16 |
        (ffmul_t_b[t0] ^ ffmul_t_d[t1] ^ ffmul_t_9[t2] ^ ffmul_t_e[t3]) << 24
      ) >>> 0;
    }

    // inv_shift_rows, inv_sub_byte, add_round_key
    state_u32[0] = w[0] ^ (inv_sbox[s0 & 0xff] | inv_sbox[(s3 >>> 8) & 0xff] << 8 | inv_sbox[(s2 >>> 16) & 0xff] << 16 | inv_sbox[s1 >>> 24] << 24);
    state_u32[1] = w[1] ^ (inv_sbox[s1 & 0xff] | inv_sbox[(s0 >>> 8) & 0xff] << 8 | inv_sbox[(s3 >>> 16) & 0xff] << 16 | inv_sbox[s2 >>> 24] << 24);
    state_u32[2] = w[2] ^ (inv_sbox[s2 & 0xff] | inv_sbox[(s1 >>> 8) & 0xff] << 8 | inv_sbox[(s0 >>> 16) & 0xff] << 16 | inv_sbox[s3 >>> 24] << 24);
    state_u32[3] = w[3] ^ (inv_sbox[s3 & 0xff] | inv_sbox[(s2 >>> 8) & 0xff] << 8 | inv_sbox[(s1 >>> 16) & 0xff] << 16 | inv_sbox[s0 >>> 24] << 24);
  }

  return {
    block_size_bytes: block_size_bytes,
    block_size_words: block_size_words,
    endian_swap32: endian_swap32,
    is_little_endian: is_little_endian,
    key_expansion: key_expansion,
    cipher: cipher,
    inv_cipher: inv_cipher
  };
};
//////////////////////////////////////////////////////////////////////////////
/*
 * A ECB mode encryption using AES
 * ===============================
 * Warning:
 *  ECB operation of mode is considered not secure when used alone.
 *  This implementation is done, however, to cooperate with other cascaded
 *  ciiphers, in which CBC will be used. ECB is choosen because of its
 *  simplicity and the freed requirement of an IV.
 *
 *  Note that before you put anything in this class, you have to pad the
 *  plaintext or input with 16-bytes.
 */
function _AESECB(){
    var self = this;

    var AES = new _AES(), key;

    function encryptECB(input){
        if(!(
            tool.get('util.type')(input).isArrayBuffer() &&
            0 == input.byteLength % AES.block_size_bytes
        ))
            throw new Error('invalid-input');

        var input_u32 = new Uint32Array(input);
        var output_u32 = new Uint32Array(input_u32.length);
        var state_block_u32 = new Uint32Array(AES.block_size_words);
        var w = AES.key_expansion(key);
        var i, j;

        for(i=0; i<input_u32.length; i+=AES.block_size_words) {
            for(j=0; j<AES.block_size_words; j++)
                state_block_u32[j] = input_u32[i+j];

            AES.cipher(state_block_u32, w);
            output_u32.set(state_block_u32, i);
        };

        return output_u32.buffer;
    };

    function decryptECB(input){
        if(!(
            tool.get('util.type')(input).isArrayBuffer() &&
            0 == input.byteLength % AES.block_size_bytes
        ))
            throw new Error('invalid-input');

        var input_u32 = new Uint32Array(input);
        var output_u32 = new Uint32Array(input_u32.length);
        var state_block_u32 = new Uint32Array(AES.block_size_words);
        var input_block_u32 = new Uint32Array(AES.block_size_words);
        var w = AES.key_expansion(key), i, j;

        for(i=0; i<input_u32.length; i+=AES.block_size_words){
            for(j=0; j<AES.block_size_words; j++)
                input_block_u32[j] = input_u32[i+j];
          state_block_u32.set(input_block_u32);
          AES.inv_cipher(state_block_u32, w);
          output_u32.set(state_block_u32, i);
        };
        
        return output_u32.buffer;
    };

    this.key = function(keyBuffer){
        if(!tool.get('util.type')(keyBuffer).isArrayBuffer())
            throw new Error('invalid-key');

        var keylen = keyBuffer.byteLength;

        if(keylen > 32)
            keyBuffer = keyBuffer.slice(0, 32);
        else if(keylen > 24)
            keyBuffer = keyBuffer.slice(0, 24);
        else if(keylen > 16)
            keyBuffer = keyBuffer.slice(0, 16);
        else
            throw new Error('invalid-key-length');

        key = new Uint32Array(keyBuffer);

        self.encrypt = encryptECB;
        self.decrypt = decryptECB;
        delete self.key;
        return self;
    };

    return this;
};





var exporter = {
    name: 'AESECB',
    constructor: function(){
        return new _AESECB();
    },
};


tool.set('cipher.symmetric.aes', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
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
        if(!tool.get('util.type')(_key).isArrayBuffer())
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
        if(!tool.get('util.type')(buf).isArrayBuffer())
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
        if(!tool.get('util.type')(buf).isArrayBuffer())
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

tool.set('cipher.symmetric.camellia', exporter);

//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * A Salsa20 implementation in pure JavaScript for NodeJS
 * ======================================================
 *
 * Designed by Daniel J. Bernstein, The Salsa20 is a stream cipher constructed
 * with a hashing function. This file provides a pure JavaScript implemented
 * Salsa20 encrypt/decryptor.
 *
 * Although Salsa20 is designed as a stream cipher, the streaming function is
 * NOT included in this implementation. The output ciphertext is the same
 * length as the input, but the counter will be reset to zero each time the
 * encryption/decryption begins.
 *
 * WARNING: This module is wrtten by someone who have no rich experiences in
 * programming with JavaScript. The algorithm is partially verified against the
 * specification, but other security vulnurabilities possible exists. The code
 * is NOT reviewed by any cryptographer!  Use this at your own risk, you have
 * been warned!
 *
 * Usage
 * -----
 * The `salsa20` is initialized with parameter of rounds(in the specification,
 * this is 10. You can make it larger, e.g. 14, or 20, this may enhance the
 * security, but will slow the speed).
 *
 * The first 8 bytes of the key is taken as nonce, the rest following 16 or 32
 * bytes are taken as real encryption key. Depending on whether it's 16 or
 * 32 bytes, according to the specification, there will be slightly internal
 * differences in processing. But you can ignore this.
 *
 *      var salsa20 = require('/PATH/TO/THIS/MODULE.js');
 *
 *      // encrypt:
 *      var encryptor = salsa20(12).key(KEY); // 12 is the round number
 *      var CIPHERTEXT = encryptor.encrypt(PLAINTEXT);
 *
 *      // decrypt:
 *      var decryptor = salsa20(12).key(KEY); // 12 is the round number
 *      var DECRYPTED = decryptor.decrypt(CIPHERTEXT);
 *
 * References
 * ----------
 * [1] Another implementation in Javascript at:
 *      https://gist.github.com/dchest/4582374
 * [2] Daniel. J. Bernstein, Salsa20 specification, retrived 2014/05/18 from:
 *      http://cr.yp.to/snuffle/spec.pdf
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function _Salsa20(rounds){    
    var self = this;
    if(!rounds || rounds < 10) rounds = 10;

    function R(a, b){return (((a) << (b)) | ((a) >>> (32 - (b))));};
    function coreFunc(ina, ret){
        // Salsa20 Core Word Specification
        var i; //ret = new Uint32Array(16);
        var x = new Uint32Array(16);
        for (i=0; i<16; i++) x[i] = ina[i];
        for (i=0; i<rounds; i++){
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

    /* key expansion for 8 words(32 bytes) key */
    function _salsa20ExpansionKey8(key8, nonce2, counter2, ret){
        var sigma = new Uint32Array(
            [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
        );
        var input = new Uint32Array(16);

        input[0]  = sigma[0];
        input[1]  = key8[0];
        input[2]  = key8[1];
        input[3]  = key8[2];
        input[4]  = key8[3];
        input[5]  = sigma[1];

        input[6]  = nonce2[0];
        input[7]  = nonce2[1];
        input[8]  = counter2[0];
        input[9]  = counter2[1];

        input[10] = sigma[2];
        input[11] = key8[4];
        input[12] = key8[5];
        input[13] = key8[6];
        input[14] = key8[7];
        input[15] = sigma[3];

        return coreFunc(input, ret);
    };

    /* key expansion for 4 words key(16 bytes) */
    function _salsa20ExpansionKey4(key4, nonce2, counter2, ret){
        var tau = new Uint32Array(
            [0x61707865, 0x3120646e, 0x79622d36, 0x6b206574]
        );
        var input = new Uint32Array(16);

        input[0]  = tau[0];
        input[1]  = key4[0];
        input[2]  = key4[1];
        input[3]  = key4[2];
        input[4]  = key4[3];
        input[5]  = tau[1];

        input[6]  = nonce2[0];
        input[7]  = nonce2[1];
        input[8]  = counter2[0];
        input[9]  = counter2[1];

        input[10] = tau[2];
        input[11] = key4[0];
        input[12] = key4[1];
        input[13] = key4[2];
        input[14] = key4[3];
        input[15] = tau[3];

        return coreFunc(input, ret);
    };

    //////////////////////////////////////////////////////////////////////
    var counter = new Uint32Array(2);
    var blockGenerator;

    function _counterReset(){counter[0] = 0; counter[1] = 0;};
    function _counterInc(){
        counter[0] += 1;
        if(0 == counter[0]) counter[1] += 1;
    };

    function _initialize(nonceBuf, keyBuf){
        var nonce = new Uint32Array(nonceBuf);
        if(32 == keyBuf.byteLength){
            var key = new Uint32Array(keyBuf);
            blockGenerator = (function(n, k){
                return function(ret){
                    _salsa20ExpansionKey8(k, n, counter, ret);
                    _counterInc();
                };
            })(nonce, key);
        } else if(16 == keyBuf.byteLength){
            var key = new Uint32Array(keyBuf);
            blockGenerator = (function(n, k){
                return function(ret){
                    _salsa20ExpansionKey4(k, n, counter, ret);
                    _counterInc();
                };
            })(nonce, key);
        } else
            throw new Error('invalid-key-length');
    };

    //////////////////////////////////////////////////////////////////////

    function _xorBuf(dataBuf){
        if(!tool.get('util.type')(dataBuf).isArrayBuffer())
            throw new Error('invalid-input');

        var origLength = dataBuf.byteLength,
            blocksCount = Math.ceil(origLength / 64),
            block = new Uint32Array(16);    // holder of new generated block
        var stream = new Uint8Array(dataBuf);
        var b=0, i, j;

        _counterReset();
        for(i=0; i<blocksCount; i++){
            blockGenerator(block);
            for(j=0; j<64; j++) stream[b+j] ^= block[j];
            b += 64;
        };

        return stream.buffer.slice(0, origLength);
    };

    this.key = function(bufKey){
        if(!tool.get('util.type')(bufKey).isArrayBuffer())
            throw new Error('invalid-key');
        var keylen = bufKey.byteLength;

        // buffer typed bufKey, first 24 or 40 bytes will be used. among them,
        // the first 8 bytes will be taken as nonce. the rest will be the key.
        if(keylen < 24) throw new Error('invalid-key');

        var nonceBuf = bufKey.slice(0, 8);
        if(keylen < 40)
            _initialize(nonceBuf, bufKey.slice(8, 24));
        else
            _initialize(nonceBuf, bufKey.slice(8, 40));

        self.encrypt = _xorBuf;
        self.decrypt = _xorBuf;
        delete self.key;
        return self;
    };


    return this;
};




/* Now Export the Module */

var exporter = {
    name: 'Salsa20/20',
    constructor: function(){
        return new _Salsa20(20);
    },
};

tool.set('cipher.symmetric.salsa20', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * NeoAtlantis Cascade Symmetric Cipher (with 512-bit key)
 * =======================================================
 *
 * This aims at doing a cascaded symmetric cipher for NeoAtlantis. It is a
 * block cipher with a 512-bit key. 
 *
 * The result is designed to fill a requirement, that a single
 * bit's failure in ciphertext will destroy the possibility of decrypting any
 * part of the ciphertext -- before and after: we do this by applying CBC mode
 * 2 times in encryption, and between them a reversal of intermediate result.
 * A failure will lead to destroying the remaining part's decryption in the
 * first round, whose result is the leading part in the second round and render
 * it into impossible.
 */

(function(tool){
///////////////////////////// IMPLEMENTATION /////////////////////////////////

function NCSC512(){
    var self = this;

    function padding(srcBuffer, blockSize){
        // RFC 5652 Padding, blockSize should be (0, 256).
        var oldlen = srcBuffer.byteLength,
            padlen = blockSize - (oldlen % blockSize),
            sumlen = oldlen + padlen,
            oldView = new Uint8Array(srcBuffer),
            newBuffer = new Uint8Array(sumlen);
        for(var i=0; i<sumlen; i++)
            if(i<oldlen)
                newBuffer[i] = oldView[i];
            else
                newBuffer[i] = padlen;
        return newBuffer.buffer;
    };

    function unpadding(buffer){
        var view = new Uint8Array(buffer);
        var padlen = view[view.length - 1];
        
        if(view.length < padlen) return null;
        return buffer.slice(0, buffer.byteLength - padlen);
    };


    function compress(buffer){
        return buffer; // TODO
    };

    function uncompress(buffer){
        return buffer; // TODO
    };

    //////////////////////////////////////////////////////////////////////

    var keyBuffer = null;

    /* derivation of `round` keys */
    function deriveKey(keyBuf, saltBuf, keyCount){
        var eachKeyLen = 64;
        
        var stream = new tool.get('hash')('BLAKE2s').pbkdf2(
            keyBuf,
            saltBuf,
            4,   // This is to randomize the result, but not to slow down
                 // a rainbow table search. You still need to pass a 512-bit
                 // key into `keyBuf`, which may be done by a slowing-down
                 // process.
            keyCount * eachKeyLen
        );

        var result = new Array(keyCount);
        for(var i=0; i<keyCount; i++)
            result[i] = new tool.get('hash')('WHIRLPOOL').hash(
                stream.slice(i * eachKeyLen, (i+1) * eachKeyLen)
            ).buffer;
        return result;
    };

    var encrypt = function(dataBuffer){
        if(!tool.get('util.type')(dataBuffer).isArrayBuffer())
            throw new Error('invalid-parameter');

        // get random bytes
        var saltBuf = new tool.get('util.srand')().bytes(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, saltBuf, 5);

        // generate MAC for plaintext and attach to plaintext
        var MAC = new tool.get('hash')('BLAKE2s', {length: 6})
            .mac(dataBuffer, keys[0])
            .buffer
        ;
        dataBuffer = tool.get('util.buffer').concat([MAC, dataBuffer]);

        // cascade encryption
        var result = dataBuffer;
        result = compress(result);
        result = padding(result, 16);
        result = Salsa20Encrypt(keys[1], result);
        result = AESECBEncrypt(keys[2], result);
//        result = CamelliaCBCEncrypt(keys[3], result); // FIXME Camellia Cipher is not good with Browser 
        result = tool.get('util.buffer').reverse(result);
//        result = CamelliaCBCEncrypt(keys[4], result);

        return tool.get('util.buffer').concat([saltBuf, result]);
    };

    var decrypt = function(dataBuffer){
        if(!(
            tool.get('util.type')(dataBuffer).isArrayBuffer() &&
            dataBuffer.byteLength >= 26 
        ))
            throw new Error('invalid-parameter');

        // get salt 
        var salt = dataBuffer.slice(0, 10);
        dataBuffer = dataBuffer.slice(10);

        // derive keys for cascade algorithms
        var keys = deriveKey(keyBuffer, salt, 5);

        // cascade decryption
        var result = dataBuffer;
//        result = CamelliaCBCDecrypt(keys[4], result);
        result = tool.get('util.buffer').reverse(result);
//        result = CamelliaCBCDecrypt(keys[3], result);
        result = AESECBDecrypt(keys[2], result);
        result = Salsa20Decrypt(keys[1], result);
        result = unpadding(result, 16);
        if(!tool.get('util.type')(result).isArrayBuffer()) return null;
        result = uncompress(result);
        if(!tool.get('util.type')(result).isArrayBuffer()) return null;
        
        // verify the first 6 byte MAC string
        var gotMAC = result.slice(0, 6);
        result = result.slice(6);
        var foundMAC =  new tool.get('hash')('BLAKE2s', {length: 6})
            .mac(result, keys[0])
            .buffer
        ;

        if(tool.get('util.buffer').equal(gotMAC, foundMAC)) return result;
        return null;
    };

    /* initially exposed functions */

    this.key = function(keyBuf){
        if(!tool.get('util.type')(keyBuf).isArrayBuffer())
            throw new Error('invalid-key');
        keyBuffer = keyBuf;
        
        delete self.key;
        self.encrypt = encrypt;
        self.decrypt = decrypt;
        
        return self;
    };

    return this;
};

//////////////////// ENCRYPTION CALLS AND IMPLEMENTATIONS ////////////////////

/* AES Encrypt & Decrypt in ECB mode */
var AESECBEncrypt = function(key, plaintext){
    try{
        var aes = tool.get('cipher.symmetric.aes').constructor;
        return aes().key(key).encrypt(plaintext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-encrypt', e);
    };
};

var AESECBDecrypt = function(key, ciphertext){
    try{
        var aes = tool.get('cipher.symmetric.aes').constructor;
        return aes().key(key).decrypt(ciphertext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-decrypt', e);
    };
};

/* Salsa20 Encrypt & Decrypt */
var Salsa20Encrypt = function(key, plaintext){
    try{
        var salsa20 = tool.get('cipher.symmetric.salsa20').constructor;
        return salsa20().key(key).encrypt(plaintext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-encrypt');
    };
};

var Salsa20Decrypt = function(key, ciphertext){
    try{
        var salsa20 = tool.get('cipher.symmetric.salsa20').constructor;
        return salsa20().key(key).decrypt(ciphertext) ;
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-decrypt', e);
    };
};

/* Camellia Encrypt & Decrypt 

var CamelliaCBCEncrypt = function(key, plaintext){
    var CamelliaCBC = cipherToolkit["CAMELLIA"];
    try{
        return CamelliaCBC().key(key).encrypt(plaintext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-encrypt', e);
    };
};

var CamelliaCBCDecrypt = function(key, ciphertext){
    var CamelliaCBC = cipherToolkit["CAMELLIA"];
    try{
        return CamelliaCBC().key(key).decrypt(ciphertext);
    } catch(e){
        tool.get('util.log').error(e);
        return new Error('unable-to-decrypt', e);
    };
};
*/

function exporter(){ return new NCSC512(); };
tool.set('cipher.symmetric', exporter);
tool.exp('cipher.symmetric', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
})();
