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
            root.util.type(params.length).isNumber() &&
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
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
})();
