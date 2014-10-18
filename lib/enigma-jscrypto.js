(function(){
var funcTree = {}, accTree = {}, exportTree = {};
var tool = {
    'get': function(name){
        // accelerator: if accelerated version exists in accTree, then
        // return accelerated version.
        if(true){ // TODO if acceleration
            if(accTree[name]) return accTree[name];
        };
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
    'acc': function(name, x){
        accTree[name] = x;
    },
};




/* Define Environmental Variables */

tool.set('env.isNode', (
    'undefined' != typeof module &&
    'undefined' != typeof process &&
    'undefined' != typeof process.title &&
    'node' === process.title
));
/*
 * Base32 implementation
 * from `https://github.com/agnoster/base32-js/blob/master/lib/base32.js`
 *
 * Modified from NeoAtlantis @ 2014-09-03:
 *  o removed SHA function
 *  o adapted to the framework of `enigma-jscrypto`
 */

;(function(tool){

// This would be the place to edit if you want a different
// Base32 implementation

var alphabet = '0123456789abcdefghjkmnpqrtuvwxyz'
var alias = { o:0, i:1, l:1, s:5 }

/**
 * Build a lookup table and memoize it
 *
 * Return an object that maps a character to its
 * byte value.
 */

var lookup = function() {
    var table = {}
    // Invert 'alphabet'
    for (var i = 0; i < alphabet.length; i++) {
        table[alphabet[i]] = i
    }
    // Splice in 'alias'
    for (var key in alias) {
        if (!alias.hasOwnProperty(key)) continue
        table[key] = table['' + alias[key]]
    }
    lookup = function() { return table }
    return table
}

/**
 * A streaming encoder
 *
 *     var encoder = new base32.Encoder()
 *     var output1 = encoder.update(input1)
 *     var output2 = encoder.update(input2)
 *     var lastoutput = encode.update(lastinput, true)
 */

function Encoder() {
    var skip = 0 // how many bits we will skip from the first byte
    var bits = 0 // 5 high bits, carry from one byte to the next

    this.output = ''

    // Read one byte of input
    // Should not really be used except by "update"
    this.readByte = function(_byte) {
        if (skip < 0) { // we have a carry from the previous byte
            bits |= (_byte >> (-skip))
        } else { // no carry
            bits = (_byte << skip) & 248
        }

        if (skip > 3) {
            // not enough data to produce a character, get us another one
            skip -= 8
            return 1
        }

        if (skip < 4) {
            // produce a character
            this.output += alphabet[bits >> 3]
            skip += 5
        }

        return 0
    }

    // Flush any remaining bits left in the stream
    this.finish = function() {
        var output = this.output + (skip < 0 ? alphabet[bits >> 3] : '');
        this.output = ''
        return output
    }
}

/**
 * Process additional input
 *
 * input: string of bytes to convert
 * flush: boolean, should we flush any trailing bits left
 *        in the stream
 * returns: a string of characters representing 'input' in base32
 */

Encoder.prototype.update = function(input, flush) {
    for (var i = 0; i < input.length; ) {
        i += this.readByte(input[i])
    }
    // consume all output
    var output = this.output
    this.output = ''
    if (flush) {
      output += this.finish()
    }
    return output
}

// Functions analogously to Encoder

function Decoder() {
    var skip = 0 // how many bits we have from the previous character
    var _byte = 0 // current byte we're producing

    this.output = []; 

    // Consume a character from the stream, store
    // the output in this.output. As before, better
    // to use update().
    this.readChar = function(_char) {
        var val = lookup()[_char]
        if (typeof val == 'undefined') {
            // character does not exist in our lookup table
            throw Error('Could not find character "' + _char + '" in lookup table.')
        }
        val <<= 3 // move to the high bits
        _byte |= val >>> skip
        skip += 5
        if (skip >= 8) {
            // we have enough to preduce output
            this.output.push(_byte)
            skip -= 8
            if (skip > 0) _byte = (val << (5 - skip)) & 255
            else _byte = 0
        }

    }

    this.finish = function() {
        if(skip < 0) this.output.push(alphabet[bits >> 3]);
        return this.output;
    };
}

Decoder.prototype.update = function(input, flush) {
    for (var i = 0; i < input.length; i++) {
        this.readChar(input[i])
    }
    var output = this.output
    this.output = ''
    if (flush) {
      output.concat(this.finish())
    }
    return output
}

/** Convenience functions
 *
 * These are the ones to use if you just have a string and
 * want to convert it without dealing with streams and whatnot.
 */

// String of data goes in, Base32-encoded string comes out.
function encode(input) {
  var encoder = new Encoder()
  var output = encoder.update(input, true)
  return output
}

// Base32-encoded string goes in, decoded data comes out.
function decode(input) {
    var decoder = new Decoder()
    input = input.toLowerCase()
    var output = decoder.update(input, true)
    return output
}

var base32 = {
    encode: encode,
    decode: decode,
};

tool.set('util.encoding.base32', base32);
})(tool);
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
/*
 * LZW Compression and Decompression
 */

(function(tool){
//////////////////////////////////////////////////////////////////////////////


function enpack(array){
    var pad = 4 - array.length % 4;
    if(4 == pad) pad = 0;
    for(var i=0; i<pad; i++) array.push(0);

    var result = [pad,], a1, a2, a3, a4, sigbyte;
    function bytec(i){
        if(i<=0xFF) return 0;
        else if(i<=0xFFFF) return 1;
        else if(i<=0xFFFFFF) return 2;
        else if(i<=0xFFFFFFFF) return 3;
        else
            throw Error('uncompressible: ' + i);
    };
    function bytex(toArray, i){
        if(i<=0xFF) toArray.push(i);
        else if(i<=0xFFFF) toArray.push(
            (i & 0xFF00) >> 8,
            i & 0x00FF
        );
        else if(i<=0xFFFFFF)
            toArray.push(
                (i & 0xFF0000) >> 16,
                (i & 0x00FF00) >> 8,
                i & 0x0000FF
            );
        else if(i<=0xFFFFFFFF)
            toArray.push(
                (i & 0xFF000000) >> 24
                (i & 0x00FF0000) >> 16,
                (i & 0x0000FF00) >> 8,
                (i & 0x000000FF)
            );
    };

    for(var i=0; i<array.length; i+=4){
        a1 = array[i]; a2 = array[i+1]; a3 = array[i+2]; a4 = array[i+3];
        sigbyte
            = (bytec(a1) << 6)
            + (bytec(a2) << 4)
            + (bytec(a3) << 2)
            + (bytec(a4))
        ;
        result.push(sigbyte);
        bytex(result, a1);
        bytex(result, a2);
        bytex(result, a3);
        bytex(result, a4);
    };

    return result;
};

function depack(array){
    var pad = array[0];
    if(pad >= 4) throw new Error('invalid-input');

    var i=1, j;
    var sigbyte, b1, b2, b3, b4;
    function bytec(sigbyte, x){ return ((sigbyte >> (x * 2)) & 3) + 1; };
    function bytex(ary, i, j){
        var ret = 0;
        for(var k=i; k<i+j; k++){
            ret = (ret << 8);
            ret |= (ary[k] & 0xFF);
        };
        return ret;
    };

    var ret = [];
    while(i < array.length){
        sigbyte = array[i];
        i++;

        j = bytec(sigbyte, 3); b1 = bytex(array, i, j); i+=j;
        j = bytec(sigbyte, 2); b2 = bytex(array, i, j); i+=j;
        j = bytec(sigbyte, 1); b3 = bytex(array, i, j); i+=j;
        j = bytec(sigbyte, 0); b4 = bytex(array, i, j); i+=j;
        ret.push(b1, b2, b3, b4);
    };

    return ret.slice(0, ret.length - pad);
};

/****************************************************************************/


function compress(uncompressedBuf){
    if(!tool.get('util.type')(uncompressedBuf).isArrayBuffer())
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
//    console.log(result, '*********');
    return new Uint8Array(enpack(result)).buffer;
};


//LZW Compression/Decompression for Strings
function decompress(compressedBuf){
    if(!tool.get('util.type')(compressedBuf).isArrayBuffer())
        throw Error('invalid-input');
    var src = new Uint8Array(compressedBuf);
    src = depack(src);
//    console.log(src, '****');

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

    w = String.fromCharCode(src[0]);
    result = w;
    for (i = 1; i < src.length; i += 1) {
        k = src[i];
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
    };

    var ret = new Uint8Array(result.length);
    for(var i=0; i<ret.length; i++) ret[i] = result.charCodeAt(i);

    return ret.buffer;
}



tool.exp('util.compress', compress);
tool.exp('util.decompress', decompress);
tool.set('util.compress', compress);
tool.set('util.decompress', decompress);

//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////
// TODO add base32 encoding interface
// TODO encoding/decoding UTF-16 with consideration of endian.

/* // seems JavaScript have done that for us.
function UTF16ToArrayBuffer(src){
    var code, result = new Array(src.length * 4), resultPointer = 0,
        sub, lead, trail;
    for(var i=0; i<src.length; i++){
        code = src.charCodeAt(i);
        console.log(code.toString(16), '*');
        if(
            (code >= 0x0000 && code <= 0xD7FF) ||
            (code >= 0xE000 && code <= 0xFFFF)
        ){
            result[resultPointer++] = (code & 0xFF00) >> 8;
            result[resultPointer++] = (code & 0x00FF);
        } else if(code >= 0x10000 && code <= 0x10FFFF){
            sub = code - 0x10000;
            high = ((sub >> 10) & 0x3FF) + 0xD800;
            low = (sub & 0x3FF) + 0xDC00;
            result[resultPointer++] = (high & 0xFF00) >> 8;
            result[resultPointer++] = high & 0x00FF;
            result[resultPointer++] = (low & 0xFF00) >> 8;
            result[resultPointer++] = low & 0x00FF;
        } else { // invalid coding
//            throw new Error('encoding-error: 0x' + code.toString(16));
        };
    };

    var ret = new Uint8Array(result.slice(0, resultPointer));
    return ret.buffer;
};
*/

function ArrayBufferToUTF16(src){
    if(!0 == src.byteLength % 2) throw new Error('decoding-error');

    var src = new Uint16Array(src), i = 0, code, low, high,
        s = '';
    while(i < src.length){
        code = src[i];
        if(
            (code >= 0x0000 && code <= 0xD7FF) ||
            (code >= 0xE000 && code <= 0xFFFF)
        ){
            s += String.fromCharCode(code);
            i += 1;
        } else if(code >= 0xD800 && code <= 0xDBFF){
            high = code;
            low = src[i+1];
            i += 2;
            if(low >= 0xDC00 && low <= 0xDFFF){
                s += String.fromCharCode(high) + String.fromCharCode(low);
            } else
                throw new Error('decoding-error');
        } else
            throw new Error('decoding-error');
    };

    return s;
};

//////////////////////////////////////////////////////////////////////////////

function encoding(src, format){
    var self = this;

    var buffer = null;

    var tableB64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        tableHEX = "0123456789abcdef";

    var type = tool.get('util.type')(src),
        base32mod = tool.get('util.encoding.base32');
    
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
            case 'base32':
                if(!/^[0-9a-z=]+$/.test(src))
                    throw Error('invalid-encoding-choosen');
                var ary = base32mod.decode(src);
                buffer = new Uint8Array(ary).buffer;
                break;
            case 'ascii':
                // each unit in the string is treated as a one-byte char
                var cbuf = new Uint8Array(src.length);
                for(var i=0; i<cbuf.length; i++)
                    cbuf[i] = src.charCodeAt(i) & 0xFF;
                buffer = cbuf.buffer;
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
        return ArrayBufferToUTF16(buffer);
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
        return b64;
    };

    this.toBase32 = function(){
        var view = new Uint8Array(buffer),
            ret = base32mod.encode(view);
        return ret;
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

    this.toASCII = function(){
        var view = new Uint8Array(buffer), s = '';
        for(var i=0; i<view.length; i++)
            s += String.fromCharCode(view[i]);
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

tool.set('util.log', exporter);
tool.exp('util.log', exporter);
})(tool);
/*
 * a blocking random bytes generator
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// A randomBytes function based on `Math.random`. This separation is intended
// to make it possible, to be replaced with external plugins.
tool.set('util.srand.getRandomBytes', function(n){
    var ret = new Uint8Array(n);
    for(var i=0; i<n; i++) ret[n] = Math.floor(256 * Math.random());
    return ret;
});

/****************************************************************************/

/* use Salsa20 core to mix our random seeds */
var salsa20CoreX = new Uint32Array(16);
function salsa20Core(ina, ret){
    function R(a, b){return (((a) << (b)) | ((a) >>> (32 - (b))));};
    // Salsa20 Core Word Specification
    var i; //ret = new Uint32Array(16);
    var x = salsa20CoreX;
    for (i=0; i<16; i++) x[i] = ina[i];
    for (i=0; i<32; i++){
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
var _initRandomBytes = tool.get('util.srand.getRandomBytes')(32);
for(var i=0; i<32; i++) randomPoolUpdate(_initRandomBytes[i]);


/* random pool filler by touch */
function feedRandomPoolByTouch(){
    randomPoolUpdate(new Date().getTime() % 256);
};
setInterval(feedRandomPoolByTouch, 100);


/* random mixer */
function getRandomBlock(ret){
    var sigma = new Uint32Array([
        0x61707865,
        0x3320646e,
        0x79622d32,
        0x6b206574,
    ]);
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
        var mask = tool.get('util.srand.getRandomBytes')(count);
        for(var i=0; i<max; i++){
            getRandomBlock(pool);
            transArray = new Uint8Array(pool.buffer);
            for(j=0; j<64; j++){
                if(k >= count) break;
                output[k] = transArray[j] ^ mask[k];
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
(function(tool){
tool.exp('util.uuid', function(){
    var bytes = new tool.get('util.srand')().bytes(16);
    var hex = tool.get('util.encoding')(bytes).toHEX();

    return String(
        hex.slice(0,8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) +
        '-' + hex.slice(16, 20) + '-' + hex.slice(20, 32)
    );
});
})(tool);
(function(tool){

function _array(length){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(arrayOfBuffer){
        if(!Boolean(arrayOfBuffer))
            arrayOfBuffer = [];
        else {
            if(arrayOfBuffer.length > 255)
                throw new Error('invalid-parameter');
            for(var i=0; i<arrayOfBuffer.length; i++)
                if(!testType(arrayOfBuffer[i]).isArrayBuffer())
                    throw new Error('invalid-parameter');
        };

        var data = [];
        for(var i in arrayOfBuffer){
            var len = arrayOfBuffer[i].byteLength;

            if(1 == length){
                if(len > 0xff) throw new Error('invalid-parameter');
                var lenBuf = new Uint8Array([len]).buffer;
            } else if(2 == length){
                if(len > 0xffff) throw new Error('invalid-parameter');
                var lenBuf = new Uint16Array([len]).buffer;
            };

            data.push(
                tool.get('util.buffer').concat([lenBuf, arrayOfBuffer[i]])
            );
        };

        lenBuf = new Uint8Array([arrayOfBuffer.length]).buffer;
        data.unshift(lenBuf);

        return tool.get('util.buffer').concat(data);
    };

    this.unpack = function(buf){
        var totalCount = 0, cutLen = 0, cut;
        
        var tempBuf = buf.slice(0, 1);
        buf = buf.slice(1);
        totalCount = new Uint8Array(tempBuf)[0];

        var ret = [];
        for(var i=0; i<totalCount; i++){
            tempBuf = buf.slice(0, length);
            buf = buf.slice(length);
            if(1 == length)
                cutLen = new Uint8Array(tempBuf)[0];
            else if(2 == length)
                cutLen = new Uint16Array(tempBuf)[0];
            cut = buf.slice(0, cutLen);
            buf = buf.slice(cutLen);
            ret.push(cut);
        };
        
        return [ret, buf];
    };

    return this;
};

tool.set('util.serialize.array', function(regtree){
    regtree["array"] = function(){return new _array(2);};
    regtree["shortArray"] = function(){return new _array(1);};
});
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////
function _binary(length){
    var self = this;

    this.unpack = function(buf){
        var unpackLength;

        var headbuf = buf.slice(0,4);
        if(4 == length){
            unpackLength = new Uint32Array(headbuf)[0];
            buf = buf.slice(4);
        } else if(2 == length){
            unpackLength = new Uint16Array(headbuf)[0];
            buf = buf.slice(2);
        } else if(1 == length){
            unpackLength = new Uint8Array(headbuf)[0];
            buf = buf.slice(1);
        };
        if(0 == unpackLength) return [null, buf];

        unpackResult = buf.slice(0, unpackLength);
        buf = buf.slice(unpackLength);
        return [unpackResult, buf]; 
    };

    this.pack = function(buffer){
        if(!Boolean(buffer)) buffer = new Uint8Array(0).buffer;

        if(!tool.get('util.type')(buffer).isArrayBuffer())
            throw new Error('invalid-parameter');

        packLength = buffer.byteLength;
        if(
            (4 == length && packLength > 0xffffffff) ||
            (2 == length && packLength > 0xffff) ||
            (1 == length && packLength > 0xff)
        )
            throw new Error('invalid-parameter');

        if(4 == length){
            var head = new Uint32Array(1);
        } else if(2 == length){
            var head = new Uint16Array(1);
        } else if(1 == length){
            var head = new Uint8Array(1);
        };
        head[0] = packLength;
        head = head.buffer;

        return tool.get('util.buffer').concat([head, buffer]);
    };

    return this;
};
//////////////////////////////////////////////////////////////////////////////
tool.set('util.serialize.binary', function(regtree){
    regtree.shortBinary = function(){return new _binary(1);};
    regtree.binary = function(){return new _binary(2);};
    regtree.longBinary = function(){return new _binary(4);};
});

})(tool);
(function(tool){

function _boolean(){
    var self = this;

    this.pack = function(bool){
        if(!tool.get('util.type')(bool).isBoolean())
            throw new Error('invalid-parameter');
        var ret = new Uint8Array([(bool?255:0),]).buffer;
        return ret;
    };

    this.unpack = function(buf){
        var value = new Uint8Array(buf.slice(0, 1))[0];
        buf = buf.slice(1);
        return [Boolean(255 == value), buf];
    };

    return this;
};

tool.set('util.serialize.boolean', function(regtree){
    regtree["boolean"] = function(){return new _boolean();};
});

})(tool);
/*
 * Constant Type
 * =============
 *
 * This type is used to write a constant string in the packed string, and to
 * verify that the same value will be unpacked. This is useful for identifying
 * the type of a piece of message.
 *
 * At the time of packing, no actual value will be considered. At unpacking,
 * a `assume` process is done, that being said, if we could not get the
 * expected value from unpacked string, errors will be thrown.
 */
(function(tool){

function _constant(p){
    var self = this;
    var testType = tool.get('util.type');

    if(!testType(p).isArray())
        throw new Error('invalid-parameter');

    var convertString = false;
    p = p[0];
    if(testType(p).isString()){
        p = tool.get('util.encoding')(p).toArrayBuffer();
        convertString = true;
    };
    if(!testType(p).isArrayBuffer()) throw new Error('invalid-parameter');

    this.pack = function(){
        return p;
    };

    this.unpack = function(buf){
        var value = buf.slice(0, p.byteLength);
        buf = buf.slice(p.byteLength);
        if(!tool.get('util.buffer').equal(value, p))
            throw new Error('unexpected-constant');
        if(convertString) value = tool.get('util.encoding')(value).toUTF16();
        return [value, buf];
    };

    return this;
};

tool.set('util.serialize.constant', function(regtree){
    regtree["constant"] = function(p){return new _constant(p);};
});

})(tool);
/*
 * Serialize and Deserialize Date and Time.
 *
 * Available Date and Time Range: 1. Jan. 0001(AC) - 31. Dec. 65535(AC).
 */


(function(tool){
//////////////////////////////////////////////////////////////////////////////

function _datetime(){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(date){
        if(!Boolean(date)) return new Uint16Array([0]).buffer;

        if(!testType(date).isDate())
            if(testType(date).isString()){
                try{
                    date = new Date(date);
                } catch(e){
                    throw new Error('invalid-parameter');
                };
            } else
                throw new Error('invalid-parameter');

        var dYear = date.getUTCFullYear() & 0xFFFF,
            dMonth = (date.getUTCMonth() + 1) & 0xFF,
            dDate = date.getUTCDate() & 0xFF,
            dHour = date.getUTCHours() & 0xFF,
            dMinute = date.getUTCMinutes() & 0xFF,
            dSecond = date.getUTCSeconds() & 0xFF;

        // the 0 year is reserved for displaying 'no date specified'.
        if(0 == dYear) throw new Error('invalid-parameter');

        var buf = tool.get('util.buffer').concat([
            new Uint16Array([dYear]).buffer,
            new Uint8Array([dMonth, dDate, dHour, dMinute, dSecond]).buffer,
        ]);

        return buf;
    };

    this.unpack = function(buf){
        var dYear = new Uint16Array(buf.slice(0, 2))[0];
        if(0 == dYear){
            buf = buf.slice(2);
            return [null, buf];
        };

        var dMonth = new Uint8Array(buf.slice(2, 3))[0],
            dDate = new Uint8Array(buf.slice(3, 4))[0],
            dHour = new Uint8Array(buf.slice(4, 5))[0],
            dMinute = new Uint8Array(buf.slice(5, 6))[0],
            dSecond = new Uint8Array(buf.slice(6, 7))[0];
        buf = buf.slice(7);

        var ret = new Date();

        ret.setUTCMilliseconds(0);
        ret.setUTCSeconds(dSecond);
        ret.setUTCMinutes(dMinute);
        ret.setUTCHours(dHour);
        ret.setUTCDate(dDate);
        ret.setUTCMonth(dMonth);
        ret.setUTCFullYear(dYear);

        return [ret, buf];
    };

    return this;
};


tool.set('util.serialize.datetime', function(regtree){
    regtree["datetime"] = function(){return new _datetime();};
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){

function _enum(p){
    var self = this;

    if(!tool.get('util.type')(p).isArray() || p.length > 255)
        throw new Error('invalid-parameter');

    this.pack = function(str){
        var value = p.indexOf(str);
        if(value < 0) throw new Error('not-enum-item');
        var ret = new Uint8Array([value,]);
        return ret.buffer;
    };

    this.unpack = function(buf){
        var value = new Uint8Array(buf.slice(0, 1))[0];
        buf = buf.slice(1);
        if(value >= p.length) throw new Error('invalid-enum-value');
        return [p[value], buf];
    };

    return this;
};

tool.set('util.serialize.enum', function(regtree){
    regtree["enum"] = function(p){return new _enum(p);};
});

})(tool);
/*
 * Enigma Defined Serialization
 * ============================
 *
 * This is to reinvent the wheel, in order to do a serializing worker as
 * compact as possible. The result should also be deterministic, so that even
 * a calculation of hash is also possible.
 *
 * This should be done in such a way. The declaration of data structure should
 * be done at beginning. The serializing process deals with all parameters
 * in an array in order. Although the data structure is a key-valued model,
 * the result contains only the data. When it hopefully successfully
 * deserialized, the keys will be reassigned.
 *
 * Read the `README.md` for more specification.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

var _def = false;

function _SERIALIZATION(definition){
    var self = this;
    var testType = tool.get('util.type');

    if(!testType(definition).isObject())
        throw new Error('invalid-data-structure');

    var order = Object.keys(definition).sort(),
        workers = [];
    for(var i in order){
        var key = order[i];
        var typeName, typeParam;
        if(testType(definition[key]).isString()){
            typeName = definition[key];
            typeParam = [];
        } else {
            typeName = definition[key][0];
            typeParam = definition[key].slice(1);
        };
        if(!_def[typeName])
            throw new Error('invalid-data-structure');
        workers.push(_def[typeName](typeParam));
    };

    this.serialize = function(obj){
        if(!testType(obj).isObject()) throw new Error('invalid-parameter');

        var result = [];

        for(var i in workers){
            var key = order[i];
            result.push(workers[i].pack(obj[key]));
        };

        return tool.get('util.buffer').concat(result);
    };

    this.deserialize = function(buffer){
        if(!testType(buffer).isArrayBuffer())
            throw new Error('invalid-parameter');

        var resultObj = {};

        for(var i in order){
            var key = order[i];
            var result = workers[i].unpack(buffer);
            resultObj[key] = result[0];
            buffer = result[1];
        };

        return resultObj;
    };
    
    return this;
};


/****************************************************************************/

var exporter = function(definition){
    if(false === _def){
        // first use. load modules
        _def = {};
        tool.get('util.serialize.enum')(_def);
        tool.get('util.serialize.binary')(_def);
        tool.get('util.serialize.boolean')(_def);
        tool.get('util.serialize.constant')(_def);
        tool.get('util.serialize.array')(_def);
        tool.get('util.serialize.datetime')(_def);
    };
    return new _SERIALIZATION(definition);
};
tool.set('util.serialize', exporter);
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
(function(tool){
'use strict'

/***
  scroll to the bottom for the UMDjs declarations
***/

// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if (!(this instanceof BigInteger)) {
    return new BigInteger(a, b, c);
  }

  if(a != null) {
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
  }
}

var proto = BigInteger.prototype;

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}

// wtf?
BigInteger.prototype.am = am1;
dbits = 26;

/*
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}
*/

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
var DV = BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var self = this;

  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { self.fromRadix(s,b); return; }
  self.t = 0;
  self.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      self[self.t++] = x;
    else if(sh+k > self.DB) {
      self[self.t-1] |= (x&((1<<(self.DB-sh))-1))<<sh;
      self[self.t++] = (x>>(self.DB-sh));
    }
    else
      self[self.t-1] |= x<<sh;
    sh += k;
    if(sh >= self.DB) sh -= self.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    self.s = -1;
    if(sh > 0) self[self.t-1] |= ((1<<(self.DB-sh))-1)<<sh;
  }
  self.clamp();
  if(mi) BigInteger.ZERO.subTo(self,self);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  var self = this;
  if(self.s < 0) return "-"+self.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return self.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = self.t;
  var p = self.DB-(i*self.DB)%k;
  if(i-- > 0) {
    if(p < self.DB && (d = self[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (self[i]&((1<<p)-1))<<(k-p);
        d |= self[--i]>>(p+=self.DB-k);
      }
      else {
        d = (self[i]>>(p-=k))&km;
        if(p <= 0) { p += self.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var self = this;
  var bs = n%self.DB;
  var cbs = self.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/self.DB), c = (self.s<<bs)&self.DM, i;
  for(i = self.t-1; i >= 0; --i) {
    r[i+ds+1] = (self[i]>>cbs)|c;
    c = (self[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = self.t+ds+1;
  r.s = self.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  var self = this;
  r.s = self.s;
  var ds = Math.floor(n/self.DB);
  if(ds >= self.t) { r.t = 0; return; }
  var bs = n%self.DB;
  var cbs = self.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = self[ds]>>bs;
  for(var i = ds+1; i < self.t; ++i) {
    r[i-ds-1] |= (self[i]&bm)<<cbs;
    r[i-ds] = self[i]>>bs;
  }
  if(bs > 0) r[self.t-ds-1] |= (self.s&bm)<<cbs;
  r.t = self.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var self = this;
  var i = 0, c = 0, m = Math.min(a.t,self.t);
  while(i < m) {
    c += self[i]-a[i];
    r[i++] = c&self.DM;
    c >>= self.DB;
  }
  if(a.t < self.t) {
    c -= a.s;
    while(i < self.t) {
      c += self[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += self.s;
  }
  else {
    c += self.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = self.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var self = this;
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = self.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) self.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = self.s, ms = m.s;
  var nsh = self.DB-nbits(pm[pm.t-1]);  // normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<self.F1)+((ys>1)?y[ys-2]>>self.F2:0);
  var d1 = self.FV/yt, d2 = (1<<self.F1)/yt, e = 1<<self.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y); // "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?self.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {  // Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);    // Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;      // y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;    // y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;  // y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;   // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;      // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)    // pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
proto.copyTo = bnpCopyTo;
proto.fromInt = bnpFromInt;
proto.fromString = bnpFromString;
proto.clamp = bnpClamp;
proto.dlShiftTo = bnpDLShiftTo;
proto.drShiftTo = bnpDRShiftTo;
proto.lShiftTo = bnpLShiftTo;
proto.rShiftTo = bnpRShiftTo;
proto.subTo = bnpSubTo;
proto.multiplyTo = bnpMultiplyTo;
proto.squareTo = bnpSquareTo;
proto.divRemTo = bnpDivRemTo;
proto.invDigit = bnpInvDigit;
proto.isEven = bnpIsEven;
proto.exp = bnpExp;

// public
proto.toString = bnToString;
proto.negate = bnNegate;
proto.abs = bnAbs;
proto.compareTo = bnCompareTo;
proto.bitLength = bnBitLength;
proto.mod = bnMod;
proto.modPowInt = bnModPowInt;

//// jsbn2

function nbi() { return new BigInteger(null); }

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  var self = this;
  self.fromInt(0);
  if(b == null) b = 10;
  var cs = self.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && self.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      self.dMultiply(d);
      self.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    self.dMultiply(Math.pow(b,j));
    self.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(self,self);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  var self = this;
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) self.fromInt(1);
    else {
      self.fromNumber(a,c);
      if(!self.testBit(a-1))    // force MSB set
        self.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,self);
      if(self.isEven()) self.dAddOffset(1,0); // force odd
      while(!self.isProbablePrime(b)) {
        self.dAddOffset(2,0);
        if(self.bitLength() > a) self.subTo(BigInteger.ONE.shiftLeft(a-1),self);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = new Array(), t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    self.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var self = this;
  var i = self.t, r = new Array();
  r[0] = self.s;
  var p = self.DB-(i*self.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < self.DB && (d = self[i]>>p) != (self.s&self.DM)>>p)
      r[k++] = d|(self.s<<(self.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (self[i]&((1<<p)-1))<<(8-p);
        d |= self[--i]>>(p+=self.DB-8);
      }
      else {
        d = (self[i]>>(p-=8))&0xff;
        if(p <= 0) { p += self.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k === 0 && (self.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != self.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var self = this;
  var i, f, m = Math.min(a.t,self.t);
  for(i = 0; i < m; ++i) r[i] = op(self[i],a[i]);
  if(a.t < self.t) {
    f = a.s&self.DM;
    for(i = m; i < self.t; ++i) r[i] = op(self[i],f);
    r.t = self.t;
  }
  else {
    f = self.s&self.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(self.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var self = this;

  var i = 0, c = 0, m = Math.min(a.t,self.t);
  while(i < m) {
    c += self[i]+a[i];
    r[i++] = c&self.DM;
    c >>= self.DB;
  }
  if(a.t < self.t) {
    c += a.s;
    while(i < self.t) {
      c += self[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += self.s;
  }
  else {
    c += self.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&self.DM;
      c >>= self.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = self.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  var self = this;
  x.drShiftTo(self.m.t-1,self.r2);
  if(x.t > self.m.t+1) { x.t = self.m.t+1; x.clamp(); }
  self.mu.multiplyUpperTo(self.r2,self.m.t+1,self.q3);
  self.m.multiplyLowerTo(self.q3,self.m.t+1,self.r2);
  while(x.compareTo(self.r2) < 0) x.dAddOffset(1,self.m.t+1);
  x.subTo(self.r2,x);
  while(x.compareTo(self.m) >= 0) x.subTo(self.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e[j]>>(i-k1))&km;
    else {
      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += this.DB; --j; }
    if(is1) {   // ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = this.DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

// protected
proto.chunkSize = bnpChunkSize;
proto.toRadix = bnpToRadix;
proto.fromRadix = bnpFromRadix;
proto.fromNumber = bnpFromNumber;
proto.bitwiseTo = bnpBitwiseTo;
proto.changeBit = bnpChangeBit;
proto.addTo = bnpAddTo;
proto.dMultiply = bnpDMultiply;
proto.dAddOffset = bnpDAddOffset;
proto.multiplyLowerTo = bnpMultiplyLowerTo;
proto.multiplyUpperTo = bnpMultiplyUpperTo;
proto.modInt = bnpModInt;

// public
proto.clone = bnClone;
proto.intValue = bnIntValue;
proto.byteValue = bnByteValue;
proto.shortValue = bnShortValue;
proto.signum = bnSigNum;
proto.toByteArray = bnToByteArray;
proto.equals = bnEquals;
proto.min = bnMin;
proto.max = bnMax;
proto.and = bnAnd;
proto.or = bnOr;
proto.xor = bnXor;
proto.andNot = bnAndNot;
proto.not = bnNot;
proto.shiftLeft = bnShiftLeft;
proto.shiftRight = bnShiftRight;
proto.getLowestSetBit = bnGetLowestSetBit;
proto.bitCount = bnBitCount;
proto.testBit = bnTestBit;
proto.setBit = bnSetBit;
proto.clearBit = bnClearBit;
proto.flipBit = bnFlipBit;
proto.add = bnAdd;
proto.subtract = bnSubtract;
proto.multiply = bnMultiply;
proto.divide = bnDivide;
proto.remainder = bnRemainder;
proto.divideAndRemainder = bnDivideAndRemainder;
proto.modPow = bnModPow;
proto.modInverse = bnModInverse;
proto.pow = bnPow;
proto.gcd = bnGCD;

// JSBN-specific extension
proto.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
BigInteger.valueOf = nbv;


/// bitcoinjs addons

/**
 * Turns a byte array into a big integer.
 *
 * This function will interpret a byte array as a big integer in big
 * endian notation and ignore leading zeros.
 */
BigInteger.fromByteArrayUnsigned = function(ba) {
  if (!ba.length) {
    return new BigInteger.valueOf(0);
  } else if (ba[0] & 0x80) {
    // Prepend a zero so the BigInteger class doesn't mistake this
    // for a negative integer.
    return new BigInteger([0].concat(ba));
  } else {
    return new BigInteger(ba);
  }
};

/**
 * Parse a signed big integer byte representation.
 *
 * For details on the format please see BigInteger.toByteArraySigned.
 */
BigInteger.fromByteArraySigned = function(ba) {
  // Check for negative value
  if (ba[0] & 0x80) {
    // Remove sign bit
    ba[0] &= 0x7f;

    return BigInteger.fromByteArrayUnsigned(ba).negate();
  } else {
    return BigInteger.fromByteArrayUnsigned(ba);
  }
};

/**
 * Returns a byte array representation of the big integer.
 *
 * This returns the absolute of the contained value in big endian
 * form. A value of zero results in an empty array.
 */
BigInteger.prototype.toByteArrayUnsigned = function() {
    var ba = this.abs().toByteArray();

    // Empty array, nothing to do
    if (!ba.length) {
        return ba;
    }

    // remove leading 0
    if (ba[0] === 0) {
        ba = ba.slice(1);
    }

    // all values must be positive
    for (var i=0 ; i<ba.length ; ++i) {
      ba[i] = (ba[i] < 0) ? ba[i] + 256 : ba[i];
    }

    return ba;
};

/*
 * Converts big integer to signed byte representation.
 *
 * The format for this value uses the most significant bit as a sign
 * bit. If the most significant bit is already occupied by the
 * absolute value, an extra byte is prepended and the sign bit is set
 * there.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0x81
 *    127 =>     0x7f
 *   -127 =>     0xff
 *    128 =>   0x0080
 *   -128 =>   0x8080
 *    255 =>   0x00ff
 *   -255 =>   0x80ff
 *  16300 =>   0x3fac
 * -16300 =>   0xbfac
 *  62300 => 0x00f35c
 * -62300 => 0x80f35c
*/
BigInteger.prototype.toByteArraySigned = function() {
  var val = this.toByteArrayUnsigned();
  var neg = this.s < 0;

  // if the first bit is set, we always unshift
  // either unshift 0x80 or 0x00
  if (val[0] & 0x80) {
    val.unshift((neg) ? 0x80 : 0x00);
  }
  // if the first bit isn't set, set it if negative
  else if (neg) {
    val[0] |= 0x80;
  }

  return val;
};


tool.set('cipher.asymmetric.ec.bigi', BigInteger);
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////
function invoker(ECCurveFp, BigInteger){





var ECPointFp = ECCurveFp.ECPointFp;

function implShamirsTrick(P, k, Q, l) {
  var m = Math.max(k.bitLength(), l.bitLength());
  var Z = P.add2D(Q);
  var R = P.curve.getInfinity();

  for (var i = m - 1; i >= 0; --i) {
    R = R.twice2D();

    R.z = BigInteger.ONE;

    if (k.testBit(i)) {
      if (l.testBit(i)) {
        R = R.add2D(Z);
      } else {
        R = R.add2D(P);
      }
    } else {
      if (l.testBit(i)) {
        R = R.add2D(Q);
      }
    }
  }

  return R;
};

function ECDSA(ecparams){
    var self = this;

    var P_OVER_FOUR = null;

    /* random source wrapper */
    var srand = new tool.get('util.srand')();
    var rng = {
        nextBytes: function(arr) {
            var byteArr = srand.bytes(arr.length);
            for (var i = 0; i < byteArr.length; ++i) arr[i] = byteArr[i];
        },
    };
    
    /* exposed functions */
    this.sign = function (hash, priv) {
        var d = priv;
        var n = ecparams.getN();
        var e = BigInteger.fromByteArrayUnsigned(hash);

        var k = getBigRandom(n); //Following: replaced with RFC6979
        var G = ecparams.getG();
        var Q = G.multiply(k);
        var r = Q.getX().toBigInteger().mod(n);

        var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n)

        if (s.compareTo(n.divide(BigInteger.valueOf(2))) > 0) {
            // Make 's' value 'low', as per https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#low-s-values-in-signatures
            s = n.subtract(s);
        };

        return serializeSig(r, s)
    };
    
    this.verify = function (hash, sig, pubkey){
        var r,s
        if (Array.isArray(sig)) {
            var obj = parseSig(sig);
            r = obj.r
            s = obj.s
        } else {
            throw new Error("Invalid value for signature")
        }

        var Q;
        if (pubkey instanceof ECPointFp) {
            Q = pubkey
        } else if (Array.isArray(pubkey)) {
            Q = ECPointFp.decodeFrom(ecparams.getCurve(), pubkey)
        } else {
            throw new Error("Invalid format for pubkey value, must be byte array or ECPointFp")
        }
        var e = BigInteger.fromByteArrayUnsigned(hash)

        return verifyRaw(e, r, s, Q)
    };



    /* implementations */
    function verifyRaw(e, r, s, Q) {
        var n = ecparams.getN();
        var G = ecparams.getG();

        if(r.compareTo(BigInteger.ONE) < 0 || r.compareTo(n) >= 0)
            return false;

        if(s.compareTo(BigInteger.ONE) < 0 || s.compareTo(n) >= 0)
            return false;

        var c = s.modInverse(n);

        var u1 = e.multiply(c).mod(n);
        var u2 = r.multiply(c).mod(n);

        // TODO(!!!): For some reason Shamir's trick isn't working with
        // signed message verification!? Probably an implementation
        // error!
        //var point = implShamirsTrick(G, u1, Q, u2);
        var point = G.multiply(u1).add(Q.multiply(u2));

        var v = point.getX().toBigInteger().mod(n);
        return v.equals(r);
    };

    function parseSigCompact(sig) {
        if(sig.length !== 65) 
            throw new Error("Signature has the wrong length");

        // Signature is prefixed with a type byte storing three bits of
        // information.
        var i = sig[0] - 27;
        if (i < 0 || i > 7)
            throw new Error("Invalid signature type");

        var n = ecparams.getN();
        var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
        var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

        return {r: r, s: s, i: i};
    };

    function getBigRandom(limit) {
        return new BigInteger(limit.bitLength(), rng)
            .mod(limit.subtract(BigInteger.ONE))
            .add(BigInteger.ONE)
        ;
    };


    /*
     * Serialize a signature into DER format.
     *
     * Takes two BigIntegers representing r and s and returns a byte array.
     */
    function serializeSig(r, s) {
        var rBa = r.toByteArraySigned();
        var sBa = s.toByteArraySigned();

        var sequence = [];
        sequence.push(0x02); // INTEGER
        sequence.push(rBa.length);
        sequence = sequence.concat(rBa);

        sequence.push(0x02); // INTEGER
        sequence.push(sBa.length);
        sequence = sequence.concat(sBa);

        sequence.unshift(sequence.length);
        sequence.unshift(0x30); // SEQUENCE

        return sequence;
    };

    /*
     * Parses a byte array containing a DER-encoded signature.
     *
     * This function will return an object of the form:
     *
     * {
     *   r: BigInteger,
     *   s: BigInteger
     * }
     */
    function parseSig(sig) {
      var cursor;
      if (sig[0] != 0x30)
        throw new Error("Signature not a valid DERSequence");

      cursor = 2;
      if (sig[cursor] != 0x02)
        throw new Error("First element in signature must be a DERInteger");;
      var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

      cursor += 2+sig[cursor+1];
      if (sig[cursor] != 0x02)
        throw new Error("Second element in signature must be a DERInteger");
      var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

      cursor += 2+sig[cursor+1];

      //if (cursor != sig.length)
      //  throw new Error("Extra bytes in signature");

      var r = BigInteger.fromByteArrayUnsigned(rBa);
      var s = BigInteger.fromByteArrayUnsigned(sBa);

      return {r: r, s: s};
    }

    return this;
};


return ECDSA;
}; // end of invoker


/* gather the dependencies and define the module */
tool.set('cipher.asymmetric.ec.ecdsa', function(p){
    var ret = invoker(
        tool.get('cipher.asymmetric.ec.ecurve'),
        tool.get('cipher.asymmetric.ec.bigi')
    );
    return new ret(p);
});
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * ECDSA and ECDH implementation utilizing JSBN library.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function EC(curveName){
    var self = this;

    var _ecparams = tool.get('cipher.asymmetric.ec.ecparams'),
        _ecdsa = tool.get('cipher.asymmetric.ec.ecdsa'),
        _ecurve = tool.get('cipher.asymmetric.ec.ecurve'),
        _bigi = tool.get('cipher.asymmetric.ec.bigi');

    var bigiPrivateKey = null, bigiPublicKey = null;
    var ecparams = _ecparams(curveName);

    if(!ecparams) throw Error('unknown-ec-curve-name');
    var ecdsa = _ecdsa(ecparams);

    function toArray(uarray){
        var r = new Array(uarray.length);
        for(var i=0; i<r.length; i++) r[i] = uarray[i];
        return r;
    };

    /* Interface for initializing */

    this.setPrivateKey = function(privateKeyBuf){
        initWithPrivateKey(tool.get('util.encoding')(privateKeyBuf).toArray());
    };

    this.setPublicKey = function(publicKeyBuf){
        initWithPublicKey(tool.get('util.encoding')(publicKeyBuf).toArray());
    };

    /* Internal Function for initializing */

    // remove or add functions to this instance.
    function init(prv){
        if(prv){
            self.sign = sign;
            self.decrypt = decrypt;
            self._computeSecret = _computeSecret;
        };

        self.verify = verify;
        self.encrypt = encrypt;
        self.getPublicKey = function(){
            return new Uint8Array(bigiPublicKey).buffer;
        };

        delete self.setPrivateKey;
        delete self.setPublicKey;
    };

    function initWithPublicKey(publicKeyArray){
        // convert publicKeyBuffer to array as library required.
        bigiPrivateKey = null;
//        bigiPublicKey = _bigi(publicKeyBuffer.toString('hex'), 16); 
        bigiPublicKey = publicKeyArray;
//        console.log(bigiPublicKey);

        init(false);
    };

    function initWithPrivateKey(privateKeyArray){
        // convert privateKeyBuffer to array as library required.
//        bigiPrivateKey = _bigi(privateKeyBuffer.toString('hex'), 16);
        bigiPrivateKey = _bigi.fromByteArrayUnsigned(privateKeyArray);
            
        // calculate public key.
        var pubPoint = ecparams.getG().multiply(bigiPrivateKey);
        bigiPublicKey = pubPoint.getEncoded(false);

        init(true);
    };


    /* Functions for normal working */

    function sign(digestBuffer){
        if(!tool.get('util.type')(digestBuffer).isArrayBuffer())
            throw new Error('invalid-parameter');
        
        var signature = ecdsa.sign(
            tool.get('util.encoding')(digestBuffer).toArray(),
            bigiPrivateKey
        );
        return tool.get('util.encoding')(signature).toArrayBuffer();
    };

    function verify(digestBuffer, signatureBuffer){
        if(!(
            tool.get('util.type')(digestBuffer).isArrayBuffer() &&
            tool.get('util.type')(signatureBuffer).isArrayBuffer()
        ))
            throw new Error('invalid-parameter');

        try{
            var signatureArray = tool.get('util.encoding')(signatureBuffer).toArray(),
                digestArray = tool.get('util.encoding')(digestBuffer).toArray();
            var ret = ecdsa.verify(
                digestArray,
                signatureArray, 
                bigiPublicKey
            );
        } catch(e){
            console.log(e);
            return false;
        };

        return ret;
    };

    function _computeSecret(anotherPublicKeyBuf){
        if(!tool.get('util.type')(anotherPublicKeyBuf).isArrayBuffer())
            throw Error('invalid-parameter');

        var anotherPublicKeyArray = 
            tool.get('util.encoding')(anotherPublicKeyBuf).toArray();

        var Q = _ecurve.ECPointFp.decodeFrom(
            ecparams.getCurve(), 
            anotherPublicKeyArray
        );

        var S = Q.multiply(bigiPrivateKey);

        var sharedsecretArray = S.getEncoded().slice(1);
        return tool.get('util.encoding')(sharedsecretArray).toArrayBuffer();
    };

    function encrypt(dataBuf){
        if(!tool.get('util.type')(dataBuf).isArrayBuffer())
            throw new Error('invalid-parameter');

        // create another EC instance with a new private key, then use the new
        // instance to calculate SharedSecret with the public key of this
        // instance. Encryption is done by using this SharedSecret as key.
        // As return value the public key of the created new EC instance is
        // attached.

        var tempEC = new EC(curveName); 
        tempEC.setPrivateKey(new tool.get('util.srand')().bytes(64));
        
        var sharedsecret = tempEC._computeSecret(self.getPublicKey()),
            tempPublicKey = tempEC.getPublicKey();

        var encryptor = new tool.get('cipher.symmetric')().key(sharedsecret),
            ciphertextBuf = encryptor.encrypt(dataBuf);

        // pack the result
        var lenBuf = new Uint16Array([tempPublicKey.byteLength]);
        return tool.get('util.buffer').concat([
            lenBuf.buffer,
            tempPublicKey,
            ciphertextBuf,
        ]);
    };

    function decrypt(dataBuf){
        if(!(
            tool.get('util.type')(dataBuf).isArrayBuffer() &&
            dataBuf.byteLength > 2
        ))
            throw new Error('invalid-parameter');

        // first extract the public key of the created instance from dataBuf.
        // then calculate SharedSecret using the extracted public key and
        // the private key of this instance.

        var lenBuf = dataBuf.slice(0, 2),
            dataBuf = dataBuf.slice(2);

        var splitLen = new Uint16Array(lenBuf)[0];
        if(dataBuf.length <= splitLen)
            throw new Error('invalid-ciphertext');

        var tempPublicKey = dataBuf.slice(0, splitLen),
            ciphertextBuf = dataBuf.slice(splitLen);

        var sharedsecret = _computeSecret(tempPublicKey);

        var decryptor = new tool.get('cipher.symmetric')().key(sharedsecret);
        var decryption = decryptor.decrypt(ciphertextBuf);
        return decryption;
    };


    return this;
};





/****************************************************************************/
var exporter = {
    name: 'EC',
    constructor: function(p){
        return new EC(p.curve);
    },
};
tool.set('cipher.asymmetric.ec', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////
var BigInteger, ECCurveFp;

'use strict'
// Named EC curves

// ----------------
// X9ECParameters

// constructor
function X9ECParameters(curve,g,n,h) {
  this.curve = curve;
  this.g = g;
  this.n = n;
  this.h = h;
}

X9ECParameters.prototype.getCurve = function x9getCurve() {
  return this.curve;
}

X9ECParameters.prototype.getG = function x9getG() {
  return this.g;
}

X9ECParameters.prototype.getN = function x9getN() {
  return this.n;
}

X9ECParameters.prototype.getH = function x9getH() {
  return this.h;
}

// ----------------
// SECNamedCurves

function fromHex(s) {
    s = s.replace(/[^0-9a-f]/ig, '').toUpperCase();
    return new BigInteger(s, 16); 
};

var namedCurves = {
  secp128r1: function() {
    // p = 2^128 - 2^97 - 1
    var p = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("E87579C11079F43DD824993C2CEE5ED3");
    //byte[] S = Hex.decode("000E0D4D696E6768756151750CC03A4473D03679");
    var n = fromHex("FFFFFFFE0000000075A30D1B9038A115");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "161FF7528B899B2D0C28607CA52C5B86"
      + "CF5AC8395BAFEB13C02DA292DDED7A83");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp160k1: function() {
    // p = 2^160 - 2^32 - 2^14 - 2^12 - 2^9 - 2^8 - 2^7 - 2^3 - 2^2 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("0100000000000000000001B8FA16DFAB9ACA16B6B3");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "3B4C382CE37AA192A4019E763036F4F5DD4D7EBB"
      + "938CF935318FDCED6BC28286531733C3F03C4FEE");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp160r1: function() {
    // p = 2^160 - 2^31 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC");
    var b = fromHex("1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45");
    //byte[] S = Hex.decode("1053CDE42C14D696E67687561517533BF3F83345");
    var n = fromHex("0100000000000000000001F4C8F927AED3CA752257");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "4A96B5688EF573284664698968C38BB913CBFC82"
      + "23A628553168947D59DCC912042351377AC5FB32");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp192k1: function() {
    // p = 2^192 - 2^32 - 2^12 - 2^8 - 2^7 - 2^6 - 2^3 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37");
    var a = BigInteger.ZERO;
    var b = fromHex("3");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D"
      + "9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp192r1: function() {
    // p = 2^192 - 2^64 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC");
    var b = fromHex("64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1");
    //byte[] S = Hex.decode("3045AE6FC8422F64ED579528D38120EAE12196D5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012"
      + "07192B95FFC8DA78631011ED6B24CDD573F977A11E794811");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp224r1: function() {
    // p = 2^224 - 2^96 + 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE");
    var b = fromHex("B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4");
    //byte[] S = Hex.decode("BD71344799D5C7FCDC45B59FA3B9AB8F6A948BC5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21"
      + "BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp256k1: function() {
    // p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
      + "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
    return new X9ECParameters(curve, G, n, h);
  },
  
  secp256r1: function() {
    // p = 2^224 (2^32 - 1) + 2^192 + 2^96 - 1
    var p = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B");
    //byte[] S = Hex.decode("C49D360886E704936A6678E1139D26B7819F7E90");
    var n = fromHex("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296"
      + "4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5");
    return new X9ECParameters(curve, G, n, h);
  },

  secp384r1: function() {
    // p = 2^384 - 2^128 - 2^96 + 2^32 - 1
    var p = fromHex("FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFe FFFFFFFF 00000000 00000000 FFFFFFFF");
    var a = fromHex("FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFe FFFFFFFF 00000000 00000000 FFFFFFFC");
    var b = fromHex("B3312FA7 E23EE7E4 988E056B E3F82D19 181D9C6E FE814112 0314088F 5013875A C656398D 8A2ED19D 2A85C8ED D3EC2AEF");
    var n = fromHex("FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF C7634D81 F4372DDF 581A0DB2 48B0A77A ECEC196A CCC52973");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
      + "AA87CA22 BE8B0537 8EB1C71E F320AD74 6E1D3B62 8BA79B98 59F741E0 82542A38 5502F25D BF55296C 3A545E38 72760AB7"
      + "3617DE4A 96262C6F 5D9E98BF 9292DC29 F8F41DBD 289A147C E9DA3113 B5F0B8C0 0A60B1CE 1D7E819D 7A431D7C 90EA0E5F");
    return new X9ECParameters(curve, G, n, h);
  },

  secp521r1: function() {
    // p = 2^521 - 1
    var p = fromHex("    01FF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF"+
                    "FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF"+
                    "FFFFFFFF FFFFFFFF FFFFFFFF");
    var a = fromHex("    01FF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF"+
                    "FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF"+
                    "FFFFFFFF FFFFFFFF FFFFFFFC");
    var b = fromHex("    0051 953EB961 8E1C9A1F 929A21A0 B68540EE A2DA725B 99B315F3"+
                    "B8B48991 8EF109E1 56193951 EC7E937B 1652C0BD 3BB1BF07 3573DF88"+
                    "3D2C34F1 EF451FD4 6B503F00");
    var n = fromHex("    01FF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF"+
                    "FFFFFFFF FFFFFFFA 51868783 BF2F966B 7FCC0148 F709A5D0 3BB5C9B8"+
                    "899C47AE BB6FB71E 91386409");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex(
        "      04 00C6858E 06B70404 E9CD9E3E CB662395 B4429C64 8139053F"
      + "B521F828 AF606B4D 3DBAA14B 5E77EFE7 5928FE1D C127A2FF A8DE3348"
      + "B3C1856A 429BF97E 7E31C2E5 BD660118 39296A78 9A3BC004 5C8A5FB4"
      + "2C7D1BD9 98F54449 579B4468 17AFBD17 273E662C 97EE7299 5EF42640"
      + "C550B901 3FAD0761 353C7086 A272C240 88BE9476 9FD16650");
    return new X9ECParameters(curve, G, n, h);
  },
}


tool.set('cipher.asymmetric.ec.ecparams', function getSECCurveByName(name){
  if(!BigInteger){
    BigInteger = tool.get('cipher.asymmetric.ec.bigi'),
    ECCurveFp = tool.get('cipher.asymmetric.ec.ecurve');
  };
  return (typeof namedCurves[name] == 'function')? namedCurves[name]() : null;
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
'use strict';
(function(tool){
//////////////////////////////////////////////////////////////////////////////
var BigInteger;



// Basic Javascript Elliptic Curve implementation
// Ported loosely from BouncyCastle's Java EC code
// Only Fp curves implemented for now

// prepends 0 if bytes < len
// cuts off start if bytes > len
function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
  bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
  bytes.unshift(0);
  }

  return bytes;
};

// ----------------
// ECFieldElementFp

// constructor
var ECFieldElementFp = function ECFieldElementFp(q,x) {
  this.x = x;
  // TODO if(x.compareTo(q) >= 0) error
  this.q = q;
};

ECFieldElementFp.prototype.equals = function(other) {
  if(other == this) return true;
  return (this.q.equals(other.q) && this.x.equals(other.x));
};

ECFieldElementFp.prototype.toBigInteger = function() {
  return this.x;
};

ECFieldElementFp.prototype.negate = function() {
  return new ECFieldElementFp(this.q, this.x.negate().mod(this.q));
};

ECFieldElementFp.prototype.add = function(b) {
  return new ECFieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.subtract = function(b) {
  return new ECFieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.multiply = function(b) {
  return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
};

ECFieldElementFp.prototype.square = function() {
  return new ECFieldElementFp(this.q, this.x.square().mod(this.q));
};

ECFieldElementFp.prototype.divide = function feFpDivide(b) {
  return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};

// ----------------
// ECPointFp

// constructor
var ECPointFp = function ECPointFp(curve,x,y,z) {
  if(!BigInteger) BigInteger = tool.get('cipher.asymmetric.ec.bigi');
  this.curve = curve;
  this.x = x;
  this.y = y;
  // Projective coordinates: either zinv == null or z * zinv == 1
  // z and zinv are just BigIntegers, not fieldElements
  if(z == null) {
    this.z = BigInteger.ONE;
  }
  else {
    this.z = z;
  }
  this.zinv = null;
  //TODO: compression flag
};

ECPointFp.prototype.getX = function() {
  if(this.zinv == null) {
    this.zinv = this.z.modInverse(this.curve.q);
  }
  return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q));
};

ECPointFp.prototype.getY = function() {
  if(this.zinv == null) {
    this.zinv = this.z.modInverse(this.curve.q);
  }
  return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q));
};

ECPointFp.prototype.equals = function(other) {
  if(other == this) return true;
  if(this.isInfinity()) return other.isInfinity();
  if(other.isInfinity()) return this.isInfinity();
  var u, v;
  // u = Y2 * Z1 - Y1 * Z2
  u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
  if(!u.equals(BigInteger.ZERO)) return false;
  // v = X2 * Z1 - X1 * Z2
  v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
  return v.equals(BigInteger.ZERO);
};

ECPointFp.prototype.isInfinity = function() {
  if((this.x == null) && (this.y == null)) return true;
  return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
};

ECPointFp.prototype.negate = function() {
  return new ECPointFp(this.curve, this.x, this.y.negate(), this.z);
};

ECPointFp.prototype.add = function(b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  // u = Y2 * Z1 - Y1 * Z2
  var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
  // v = X2 * Z1 - X1 * Z2
  var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);

  if(BigInteger.ZERO.equals(v)) {
    if(BigInteger.ZERO.equals(u)) {
      return this.twice(); // this == b, so double
    }
    return this.curve.getInfinity(); // this = -b, so infinity
  }

  var THREE = new BigInteger("3");
  var x1 = this.x.toBigInteger();
  var y1 = this.y.toBigInteger();
  var x2 = b.x.toBigInteger();
  var y2 = b.y.toBigInteger();

  var v2 = v.square();
  var v3 = v2.multiply(v);
  var x1v2 = x1.multiply(v2);
  var zu2 = u.square().multiply(this.z);

  // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
  var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
  // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
  var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
  // z3 = v^3 * z1 * z2
  var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

  return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
};

ECPointFp.prototype.twice = function() {
  if(this.isInfinity()) return this;
  if(this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

  // TODO: optimized handling of constants
  var THREE = new BigInteger("3");
  var x1 = this.x.toBigInteger();
  var y1 = this.y.toBigInteger();

  var y1z1 = y1.multiply(this.z);
  var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
  var a = this.curve.a.toBigInteger();

  // w = 3 * x1^2 + a * z1^2
  var w = x1.square().multiply(THREE);
  if(!BigInteger.ZERO.equals(a)) {
    w = w.add(this.z.square().multiply(a));
  }
  w = w.mod(this.curve.q);
  // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
  var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
  // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
  var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
  // z3 = 8 * (y1 * z1)^3
  var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

  return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
};

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
ECPointFp.prototype.multiply = function(k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for(i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add(hBit ? this : neg);
    }
  }

  return R;
};

// Compute this*j + x*k (simultaneous multiplication)
ECPointFp.prototype.multiplyTwo = function(j,x,k) {
  var i;
  if(j.bitLength() > k.bitLength()) {
    i = j.bitLength() - 1;
  } else {
    i = k.bitLength() - 1;
  }

  var R = this.curve.getInfinity();
  var both = this.add(x);
  while(i >= 0) {
    R = R.twice();
    if(j.testBit(i)) {
      if(k.testBit(i)) {
        R = R.add(both);
      } else {
        R = R.add(this);
      }
    } else {
      if(k.testBit(i)) {
        R = R.add(x);
      }
    }
    --i;
  }

  return R;
};

ECPointFp.prototype.getEncoded = function(compressed) {
  if (this.isInfinity()) return [0]; // Infinity point encoded is simply '00'
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  
  // Determine size of q in bytes
  var byteLength = Math.floor((this.curve.getQ().bitLength() + 7) / 8);

  // Get value as a 32-byte Buffer
  // Fixed length based on a patch by bitaddress.org and Casascius
  var enc = integerToBytes(x, byteLength);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc.unshift(0x02);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc.unshift(0x03);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc.unshift(0x04);
    enc = enc.concat(integerToBytes(y, byteLength));
  }
  return enc;
};

ECPointFp.decodeFrom = function(curve, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as byte arrays
  var xBa = enc.slice(1, 1 + dataLen/2);
  var yBa = enc.slice(1 + dataLen/2, 1 + dataLen);

  // Prepend zero byte to prevent interpretation as negative integer
  xBa.unshift(0);
  yBa.unshift(0);

  // Convert to BigIntegers
  var x = new BigInteger(xBa);
  var y = new BigInteger(yBa);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  if (this.isInfinity()) return true;
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = y.multiply(y).mod(n);
  var rhs = x.multiply(x).multiply(x)
  .add(a.multiply(x)).add(b).mod(n);
  return lhs.equals(rhs);
};

ECPointFp.prototype.toString = function () {
  if (this.isInfinity()) return '(INFINITY)';
  return '('+this.getX().toBigInteger().toString()+','+
  this.getY().toBigInteger().toString()+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
  throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
    x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
  throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
    y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
  throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
  throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
  // TODO: This check doesn't work - fix.
  throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};

// ----------------
// ECCurveFp

// constructor
var ECCurveFp = function ECCurveFp(q,a,b) {
  this.q = q;
  this.a = this.fromBigInteger(a);
  this.b = this.fromBigInteger(b);
  this.infinity = new ECPointFp(this, null, null);
};

ECCurveFp.prototype.getQ = function() {
  return this.q;
};

ECCurveFp.prototype.getA = function() {
  return this.a;
};

ECCurveFp.prototype.getB = function() {
  return this.b;
};

ECCurveFp.prototype.equals = function(other) {
  if(other == this) return true;
  return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
};

ECCurveFp.prototype.getInfinity = function() {
  return this.infinity;
};

ECCurveFp.prototype.fromBigInteger = function(x) {
  return new ECFieldElementFp(this.q, x);
};

// for now, work with hex strings because they're easier in JS
ECCurveFp.prototype.decodePointHex = function(s) {
  s = s.replace(/[^0-9a-f]/ig, '');
  switch(parseInt(s.substr(0,2), 16)) { // first byte
  case 0:
  return this.infinity;
  case 2:
  case 3:
  // point compression not supported yet
  return null;
  case 4:
  case 6:
  case 7:
  var len = (s.length - 2) / 2;
  var xHex = s.substr(2, len);
  var yHex = s.substr(len+2, len);

  return new ECPointFp(this,
       this.fromBigInteger(new BigInteger(xHex, 16)),
       this.fromBigInteger(new BigInteger(yHex, 16)));

  default: // unsupported
  return null;
  }
};


//for easy exporting
ECCurveFp.ECPointFp = ECPointFp;

tool.set('cipher.asymmetric.ec.ecurve', ECCurveFp);
//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////

var cipherToolkit = {};
var definition = {
    'NECRAC256': {
        name: 'NECRAC256',
        secretLength: 64, // bytes
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp521r1'},
            secretLength: 64, // bytes
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp521r1'},
            secretLength: 64, // bytes
        },
        hashAlgorithm: 'WHIRLPOOL',
    },

    'NECRAC192': {
        name: 'NECRAC192',
        secretLength: 48,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp384r1'},
            secretLength: 48,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp384r1'},
            secretLength: 48,
        },
        hashAlgorithm: 'BLAKE2s',
    },

    'NECRAC128': {
        name: 'NECRAC128',
        secretLength: 32,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp256r1'},
            secretLength: 32,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp256k1'},
            secretLength: 32,
        },
        hashAlgorithm: 'BLAKE2s',
    },

    'NECRAC112': {
        name: 'NECRAC112',
        secretLength: 28,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp224r1'},
            secretLength: 28,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp224r1'},
            secretLength: 28,
        },
        hashAlgorithm: 'RIPEMD160',
    },

    'NECRAC96': {
        name: 'NECRAC96',
        secretLength: 24,
        sign: {
            algorithm: 'ec',
            parameters: {curve: 'secp192k1'},
            secretLength: 24,
        },
        crypt: {
            algorithm: 'ec',
            parameters: {curve: 'secp192r1'},
            secretLength: 24,
        },
        hashAlgorithm: 'RIPEMD160',
    },
};


function AsymmetricCipher(algorithmName){
    var self = this;

    /* Initialize Algorithm Suite */
    var algorithmSuite = definition[algorithmName];
    var pkSigning, pkEncrypting;
    if(!algorithmSuite) throw new Error('invalid-algorithm-choice');
    
    function _digest(dataBuf){
        var hasher = new tool.get('hash')(algorithmSuite.hashAlgorithm);
        return hasher.hash(dataBuf).buffer;
    };

    function _loadAsymModule(conf){
        var constructor = tool
            .get('cipher.asymmetric.' + conf.algorithm)
            .constructor
        ;
        return constructor(conf.parameters);
    };
    pkSigning = _loadAsymModule(algorithmSuite.sign);
    pkEncrypting = _loadAsymModule(algorithmSuite.crypt);

    /* initializator */
    function init(prv){
        if(prv){
            self.sign = sign;
            self.decrypt = decrypt;
        };

        self.verify = verify;
        self.encrypt = encrypt;
        self.getPublicKey = getPublicKey;

        delete self.setPrivateKey;
        delete self.setPublicKey;
    };

    
    /* Implementations */

    function getPublicKey(){
        var dataVerifying = pkSigning.getPublicKey(),
            dataEncrypting = pkEncrypting.getPublicKey();

        return tool.get('util.buffer').concat([
            new Uint16Array([dataVerifying.byteLength]).buffer,
            dataVerifying,
            dataEncrypting,
        ]);
    };

    function sign(dataBuf){
        if(!tool.get('util.type')(dataBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.sign(digestBuf);
    };

    function verify(dataBuf, signatureBuf){
        if(!(
            tool.get('util.type')(dataBuf).isArrayBuffer() &&
            tool.get('util.type')(signatureBuf).isArrayBuffer()
        ))
            throw new Error('invalid-parameter');
        var digestBuf = _digest(dataBuf);
        return pkSigning.verify(digestBuf, signatureBuf);
    };

    function encrypt(plaintextBuf){
        if(!tool.get('util.type')(plaintextBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        return pkEncrypting.encrypt(plaintextBuf);
    };

    function decrypt(ciphertextBuf){
        if(!tool.get('util.type')(ciphertextBuf).isArrayBuffer())
            throw new Error('invalid-parameter');
        return pkEncrypting.decrypt(ciphertextBuf);
    };


    /* Exposed Functions for Initialization */
    this.setPrivateKey = function(credentialBuf){
        if(!tool.get('util.type')(credentialBuf).isArrayBuffer())
            throw new Error('invalid-parameter');

        /* 
         * Derive useful secrets for pkSigning and pkEncrypting.
         *
         * secrets for signing and encrypting algorithms are different, but
         * are from same source(using different derivations).
         *
         * the private key being imported and exported, are the source of
         * such derivations.
         */
        var pbkdf2 = new tool.get('hash')(algorithmSuite.hashAlgorithm).pbkdf2;

        var secretSigning = pbkdf2(
            credentialBuf,
            tool.get('util.encoding')('derivation-of-signing-key', 'ascii').toArrayBuffer(),
            4,
            algorithmSuite.sign.secretLength
        );

        var secretDecrypting = pbkdf2(
            credentialBuf,
            tool.get('util.encoding')('derivation-of-encrypting-key', 'ascii').toArrayBuffer(),
            4,
            algorithmSuite.crypt.secretLength
        );

        try{
            pkSigning.setPrivateKey(secretSigning);
            pkEncrypting.setPrivateKey(secretDecrypting);
        } catch(e){
            throw new Error('invalid-private-key');
        };

        init(true);
    };

    this.setPublicKey = function(publicKeyBuf){
        if(!(
            tool.get('util.type')(publicKeyBuf).isArrayBuffer() &&
            publicKeyBuf.byteLength > 2
        ))
            throw new Error('invalid-public-key');

        var splitLen = new Uint16Array(publicKeyBuf.slice(0, 2))[0];
        publicKeyBuf = publicKeyBuf.slice(2);

        if(publicKeyBuf.byteLength <= splitLen)
            throw new Error('invalid-public-key');

        var dataVerifying = publicKeyBuf.slice(0, splitLen),
            dataEncrypting = publicKeyBuf.slice(splitLen);

        try{
            pkSigning.setPublicKey(dataVerifying);
            pkEncrypting.setPublicKey(dataEncrypting);
        } catch(e){
            throw new Error('invalid-public-key');
        };
        
        init(false);
    };


    return this;
};

/****************************************************************************/

function cipherInitializer(cipherConf){
    if(cipherConf){
        tool.get('util.log').notice('Load asymmetric cipher component: [' + cipherConf.name + ']'); //    XXX
        cipherToolkit[cipherConf.name] = cipherConf.constructor;
        return;
    };

    if(
        'undefined' != typeof cipherToolkit['EC']
    ){
        tool.get('util.log').notice('Asymmetric ciphers ready.');
        return function(x){
            return new AsymmetricCipher(x);
        };
    };
    
    return null;
};

var exporter = function(x){ return new AsymmetricCipher(x); };
tool.set('cipher.asymmetric', exporter);
tool.set('cipher.asymmetric.definition', function(algoname){
    return definition[algoname] || null;
});
tool.exp('cipher.asymmetric', exporter);
//////////////////////////////////////////////////////////////////////////////
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
  var _sbox = [
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
  var _inv_sbox = [
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
  var _rcon = [
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
    var s = _sbox;
    return (
      s[w >>> 24] << 24 |
      s[(w >>> 16) & 0xff] << 16 |
      s[(w >>> 8) & 0xff] << 8 |
      s[w & 0xff]
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
  function key_expansion(key){
    var rcon = _rcon;
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
    var sb = _sbox;

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

      m0 = sb[t0 & 0xff] >>> 0;
      m1 = sb[(t1 >>> 8) & 0xff] >>> 0;
      m2 = sb[(t2 >>> 16) & 0xff] >>> 0;
      m3 = sb[t3 >>> 24] >>> 0;
      s0 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round]) >>> 0;
      m0 = sb[t1 & 0xff] >>> 0;
      m1 = sb[(t2 >>> 8) & 0xff] >>> 0;
      m2 = sb[(t3 >>> 16) & 0xff] >>> 0;
      m3 = sb[t0 >>> 24] >>> 0;
      s1 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+1]) >>> 0;
      m0 = sb[t2 & 0xff] >>> 0;
      m1 = sb[(t3 >>> 8) & 0xff] >>> 0;
      m2 = sb[(t0 >>> 16) & 0xff] >>> 0;
      m3 = sb[t1 >>> 24] >>> 0;
      s2 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+2]) >>> 0;
      m0 = sb[t3 & 0xff] >>> 0;
      m1 = sb[(t0 >>> 8) & 0xff] >>> 0;
      m2 = sb[(t1 >>> 16) & 0xff] >>> 0;
      m3 = sb[t2 >>> 24] >>> 0;
      s3 = ((
        (ffmul_t_2[m0] ^ ffmul_t_3[m1] ^ m2 ^ m3) |
        (m0 ^ ffmul_t_2[m1] ^ ffmul_t_3[m2] ^ m3) << 8 |
        (m0 ^ m1 ^ ffmul_t_2[m2] ^ ffmul_t_3[m3]) << 16 |
        (ffmul_t_3[m0] ^ m1 ^ m2 ^ ffmul_t_2[m3]) << 24
      ) ^ w[round+3]) >>> 0;
    }

    // sub_byte, shift_rows, add_round_key
    state_u32[0] = w[nr] ^ (sb[s0 & 0xff] | sb[(s1 >>> 8) & 0xff] << 8 | sb[(s2 >>> 16) & 0xff] << 16 | sb[s3 >>> 24] << 24);
    state_u32[1] = w[nr+1] ^ (sb[s1 & 0xff] | sb[(s2 >>> 8) & 0xff] << 8 | sb[(s3 >>> 16) & 0xff] << 16 | sb[s0 >>> 24] << 24);
    state_u32[2] = w[nr+2] ^ (sb[s2 & 0xff] | sb[(s3 >>> 8) & 0xff] << 8 | sb[(s0 >>> 16) & 0xff] << 16 | sb[s1 >>> 24] << 24);
    state_u32[3] = w[nr+3] ^ (sb[s3 & 0xff] | sb[(s0 >>> 8) & 0xff] << 8 | sb[(s1 >>> 16) & 0xff] << 16 | sb[s2 >>> 24] << 24);
  }

  // state_u8 is 16 byte Uint8Array (also used as output)
  // w is value from key_expansion
  function inv_cipher(state_u32, w) {
    var inv_sbox = _inv_sbox;
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

    var coreFuncX = new Uint32Array(16);
    function coreFunc(ina, ret){
        function R(a, b){return (((a) << (b)) | ((a) >>> (32 - (b))));};
        // Salsa20 Core Word Specification
        var i; //ret = new Uint32Array(16);
        var x = coreFuncX;
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

    /* key expansion */

    var _keyExpanBuffer = new Uint32Array(16);

    /* key expansion for 8 words(32 bytes) key */
    function _salsa20BufferFillKey8(nonce2, key8){
        var input = _keyExpanBuffer,
            sigma = new Uint32Array(
                [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
            );

        input[0]  = sigma[0];
        input[1]  = key8[0];
        input[2]  = key8[1];
        input[3]  = key8[2];
        input[4]  = key8[3];
        input[5]  = sigma[1];

        input[6]  = nonce2[0];
        input[7]  = nonce2[1];

        input[10] = sigma[2];
        input[11] = key8[4];
        input[12] = key8[5];
        input[13] = key8[6];
        input[14] = key8[7];
        input[15] = sigma[3];
    };

    function _salsa20ExpansionKey8(counter2, ret){
        var input = _keyExpanBuffer;

        input[8]  = counter2[0];
        input[9]  = counter2[1];

        return coreFunc(input, ret);
    };

    /* key expansion for 4 words key(16 bytes) */
    function _salsa20BufferFillKey8(nonce2, key4){
        var input = _keyExpanBuffer;
            tau = new Uint32Array(
                [0x61707865, 0x3120646e, 0x79622d36, 0x6b206574]
            );

        input[0]  = tau[0];
        input[1]  = key4[0];
        input[2]  = key4[1];
        input[3]  = key4[2];
        input[4]  = key4[3];
        input[5]  = tau[1];

        input[6]  = nonce2[0];
        input[7]  = nonce2[1];

        input[10] = tau[2];
        input[11] = key4[0];
        input[12] = key4[1];
        input[13] = key4[2];
        input[14] = key4[3];
        input[15] = tau[3];
    };
    
    function _salsa20ExpansionKey4(counter2, ret){
        var input = _keyExpanBuffer;

        input[8]  = counter2[0];
        input[9]  = counter2[1];

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
            _salsa20BufferFillKey8(nonce, key);
            blockGenerator = (function(){
                return function(ret){
                    _salsa20ExpansionKey8(counter, ret);
                    _counterInc();
                };
            })();
        } else if(16 == keyBuf.byteLength){
            var key = new Uint32Array(keyBuf);
            _salsa20BufferFillKey4(nonce, key);
            blockGenerator = (function(){
                return function(ret){
                    _salsa20ExpansionKey4(counter, ret);
                    _counterInc();
                };
            })();
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
        var stream = new Uint8Array(dataBuf),
            xorStream = new Uint8Array(stream.length + 64);
        var b=0, i, j;

        _counterReset();
        for(i=0; i<blocksCount; i++){
            blockGenerator(block);
            for(j=0; j<16; j++){
                xorStream[b++] = (block[j] >> 24) & 0xff;
                xorStream[b++] = (block[j] >> 16) & 0xff;
                xorStream[b++] = (block[j] >> 8) & 0xff;
                xorStream[b++] = block[j] & 0xff;
            };
        };

        for(i=0; i<origLength; i++) stream[i] ^= xorStream[i];
        return stream.buffer;
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

function exporter(){ return new NCSC512(); };
tool.set('cipher.symmetric', exporter);
tool.exp('cipher.symmetric', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * Enigma Object Encoding/Decoding
 * ===============================
 *
 * Outputs of `identity.js` and `message.js` are instances of this encoder.
 * This a quasi-generic encoder dealing with serialization/deserialization of
 * mentioned messages. Binary or Base64 represented output can be selected
 * in such instances.
 *
 * It is also able to read in any input and decide, if it contains an `Enigma`
 * generated input. The reading and decoding such inputs will be then done.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function abstractMessage(){
    var self = this;


    return this;
};

//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * Enigma Identity Class
 * =====================
 *
 * In `Enigma`, an identity is a public key bound with a description. It is
 * always self-signed(this is the only signature that exists in Enigma system
 * and doesn't follow the standard format of signing--the signing in message).
 *
 * To initialize a class, 2 ways are provided:
 *  1 by generating an identity. Providing description and selecting algorithm.
 *  2 by providing a serialized public/private part of identity. A passphrase
 *    will be required, when a private part is given.
 *
 * After initialization, public identity part will be always ready to export.
 * The private part will be able to export, only when the initialization is
 * done by generation or by providing a private part. Either way, another
 * passphrase for protecting the private part is required.
 *
 * The identity is also ready for encryption/decryption/signing/verifying based
 * on how it is generated.
 *
 *
 * ===================================
 * IMPORTANT!! Remarks on `pinkey` !!!
 * ===================================
 *  Using a PIN to protect the secret key is necessary, and this PIN serves
 *  also as an identification process, which ties the personality and the data
 *  together.
 *
 *  But we know a PIN is too weak to be directly used as a key to encrypt the
 *  secret. Therefore PBKDF2, scrypt or bcrypt should be applied. Now comes the
 *  problem, that browser and javascript implemented such algorithms are too
 *  slow to be comparable with those code in C. Lacking speed means also that
 *  such protections are no-use(to delay the same length time we have to reduce
 *  the calculation rounds).
 *
 *  --------------------------------------------------------------------------
 *  Therefore, the author is decided, not to accept a PIN and derive the
 *  encryption key natively using javascript, but instead require a `derived
 *  key`. The derivation should be done somewhere else, may be using browser's
 *  `crypto`.
 *  --------------------------------------------------------------------------
 *  
 *  In short, you YOURSELF are responsible for providing key good enough to
 *  secure the user's secret(seed used to initialize all user's private key
 *  instances).
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////
// Adjustable
var config = {
    defaultAlgorithmName: 'NECRAC128', // default and fallback algorithm choice 
    subjectRule: /^[0-9a-z\s]{8,255}$/i,
};
/****************************************************************************/

var template = {
    '_': ['constant', new Uint8Array([69, 73]).buffer],
    'subject': 'shortBinary',
    'algorithm': ['enum', 
        'NECRAC96',
        'NECRAC112',
        'NECRAC128',
        'NECRAC192',
        'NECRAC256',
    ],
    'public': 'binary',
    'secret': 'shortBinary',
        // optional. if given, should be ciphertext protected with pinkey
        // max. length: 255 bytes. should be enough!
    'signature': 'binary',
};

function identity(){
    var self = this;
    var hash = tool.get('hash');
    var buffer = tool.get('util.buffer');
    var getDef = tool.get('cipher.asymmetric.definition');
    var testType = tool.get('util.type');

    var serializer = tool.get('util.serialize')(template);

    var subjectBuf, secretBuf, publicKeyBuf, algorithmName, signatureBuf,
        asymCipher;

    var identityID = false;
    function getID(){
        if(identityID) return identityID;
        identityID = hash('WHIRLPOOL').mac(publicKeyBuf, subjectBuf).buffer;
        return identityID;
    };

    ////////////////////// STAGE 1 INITIALIZATION ////////////////////////

    /*
     * Each method of initialization must do followings:
     *  o set `subjectBuf`
     *  o set `publicKeyBuf`
     *  o set `signatureBuf`
     *  o set `algorithmName`
     *  o initialize `asymCipher`
     */

    function initialize(prv){
        self.exportPublic = exportPublic;
        self.verify = verify;
        self.encrypt = encrypt;
        self.getFingerprint = getFingerprint;
        self.getHash = getID;
        self.getSubject = getSubject;

        if(prv){
            self.decrypt = decrypt;
            self.sign = sign;
            self.exportPrivate = exportPrivate;
        };
        self.isPrivate = function(){ return Boolean(prv); };

        delete self.generate;
        delete self.loadPublic;
        delete self.loadPrivate;
    };

    this.generate = function(subject, options){
        /*
         * Generate a new identity
         *  1. Test subject validity
         *  2. Fetch random secret
         *  3. set asymCipher, algorithmName
         *  4. get public key and signature
         */
        if(!options) options = {};
        if(!config.subjectRule.test(subject))
            throw new Error('enigma-invalid-input');

        // write subject buf
        subjectBuf =
            tool.get('util.encoding')(subject, 'ascii').toArrayBuffer();

        // generate asymmetric key
        algorithmName = options.algorithm || config.defaultAlgorithmName;
        var algorithm = getDef(algorithmName);
        if(!algorithm){
            algorithmName = defaults.algorithmName;
            algorithm = getDef(algorithmname);
        };

        secretBuf = tool.get('util.srand')().bytes(algorithm.secretLength);
        asymCipher = tool.get('cipher.asymmetric')(algorithm.name);
        asymCipher.setPrivateKey(secretBuf);
        publicKeyBuf = asymCipher.getPublicKey();

        signatureBuf = asymCipher.sign(getID());

        // initialize the instance
        initialize(true);
    };

    function loadIdentityBuf(buf, pinkeyBuf){
        if(!testType(buf).isArrayBuffer())
            throw new Error('enigma-invalid-input');
        if(pinkeyBuf && !testType(pinkeyBuf).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        try{
            var d = serializer.deserialize(buf);
        } catch(e){
            throw new Error('enigma-invalid-input');
        };

        var dSubjectBuf = d['subject'],
            dAlgorithmName = d['algorithm'],
            dSignatureBuf = d['signature'],
            dPublicBuf = d['public'],
            dSecretBuf = d['secret'];

        if(!config.subjectRule.test(
            tool.get('util.encoding')(dSubjectBuf).toASCII()
        ))
            throw new Error('enigma-invalid-input');

        subjectBuf = dSubjectBuf;
        algorithmName = dAlgorithmName;
        signatureBuf = dSignatureBuf;
        publicKeyBuf = dPublicBuf;

        // initialize asymmetric cipher
        asymCipher = tool.get('cipher.asymmetric')(algorithmName);
        if(pinkeyBuf){
            try{
                secretBuf = tool.get('cipher.symmetric')()
                    .key(pinkeyBuf)
                    .decrypt(dSecretBuf)
                ;
            } catch(e){
                throw new Error('enigma-invalid-pinkey');
            };
            asymCipher.setPrivateKey(secretBuf);

            var derivedPublicKey = asymCipher.getPublicKey();
            if(!tool.get('util.buffer').equal(
                derivedPublicKey,
                publicKeyBuf
            ))
                throw new Error('enigma-identity-invalid');

        } else {
            asymCipher.setPublicKey(publicKeyBuf);
        };

        // verify public key self signature
        var selfSigVerify = asymCipher.verify(getID(), signatureBuf);
        if(!selfSigVerify)
            throw new Error('enigma-identity-invalid');


        return true;
    };

    this.loadPublic = function(publicIdentityBuf){
        /*
         * Read the public identity
         *  1. read `subjectBuf`, test validity
         *  2. read `publicKeyBuf`, use it to initialize `asymCipher`
         *  3. read `signatureBuf`
         *  4. check signature against subject and publicKey.
         *  5. call `initialize(false)`.
         */
        if(loadIdentityBuf(publicIdentityBuf)) initialize(false);
    };

    this.loadPrivate = function(secretIdentityBuf, pinkeyBuf){
        if(loadIdentityBuf(secretIdentityBuf, pinkeyBuf)) initialize(true);
    };

    ////////////////////////// STAGE 2 USAGE ////////////////////////////

    function getSubject(){
        return tool.get('util.encoding')(subjectBuf).toASCII();
    };

    function getFingerprint(useStrFormat){
        var fp = getID().slice(0, 10);
        if(useStrFormat) return tool.get('util.encoding')(fp).toBase32();
        return fp;
    };

    function exportPublic(){
        var ret = serializer.serialize({
            'subject': subjectBuf,
            'algorithm': algorithmName,
            'public': publicKeyBuf,
            'secret': new Uint8Array(0).buffer,
            'signature': signatureBuf,
        });
        return ret;
    };

    function exportPrivate(pinkeyBuf){
        if(!(
            testType(pinkeyBuf).isArrayBuffer() &&
            pinkeyBuf.byteLength >= 32
        ))
            throw new Error('enigma-invalid-pinkey');

        var secretEncryptedBuf = tool.get('cipher.symmetric')()
            .key(pinkeyBuf)
            .encrypt(secretBuf)
        ;

        var ret = serializer.serialize({
            'subject': subjectBuf,
            'algorithm': algorithmName,
            'public': publicKeyBuf,
            'secret': secretEncryptedBuf,
            'signature': signatureBuf,
        });
        return ret;
    };

    function verify(plaintext, signature){
        if(!(
            testType(plaintext).isArrayBuffer() &&
            testType(signature).isArrayBuffer()
        ))
            throw new Error('enigma-invalid-input');

        try{
            return true === asymCipher.verify(plaintext, signature);
        } catch(e){
            return false;
        };
    };

    function sign(plaintext){
        if(!testType(plaintext).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        try{
            return asymCipher.sign(plaintext);
        } catch(e){
            throw new Error('enigma-identity-unable-to-sign');
        };
    };

    function encrypt(plaintext){
        if(!testType(plaintext).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        try{
            return asymCipher.encrypt(plaintext);
        } catch(e){
            throw new Error('enigma-identity-unable-to-encrypt');
        };
    };

    function decrypt(ciphertext){
        if(!testType(ciphertext).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        try{
            return asymCipher.decrypt(ciphertext);
        } catch(e){
            throw new Error('enigma-identity-unable-to-decrypt');
        };
    };

    return this;
};



var exporter = function(){ return new identity(); };
tool.set('enigma.identity', exporter);
tool.exp('enigma.identity', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * Enigma Message(something like PGP message) Manager
 * ==================================================
 *
 * Generate: Generate message like PGP messages. Features include:
 *  o multiple identities as receivers
 *  o plaintext can be signed
 *  o output multiple formats is possible
 *
 * Read:
 *  1 Read message, and see if it is encrypted.
 *  2 If yes, a list of hints, indicating possible decryptable identites will
 *    be returned.
 *
 * Decrypt(when examined to be encrypted):
 *  by supplying the possible identity, it will be tried to decrypt the
 *  ciphertext.
 *
 * Verify:
 *  After decryption the instance will have a `read` and a `verify` attribute.
 *  An indication, which shows who have signed the text, will be given. By
 *  supplying an identity, this text will be verified.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

// payload can be directly released(which is a `clear sign`, or be encrypted in
// serialized form and set to be value of `payload` in envelope.
var templatePayload = {
    '_': ['constant', new Uint8Array([69, 112]).buffer],
    'signers': 'shortArray',
    'signatures': 'array',
    'content': 'longBinary',
};

var templateEnvelope = {
    '_': ['constant', new Uint8Array([69, 67]).buffer],
    'compression': ['enum',
        false,
        'lzw',
    ],
    'receivers': 'shortArray',
    'decryptors': 'array',
    'payload': 'longBinary',
};

function message(){
    var self = this;
    var testType = tool.get('util.type');

    var payloadSerializer = tool.get('util.serialize')(templatePayload),
        envelopeSerializer = tool.get('util.serialize')(templateEnvelope);

    var plaintextBuf, mainKeyBuf, receivers = [], decryptors = [],
        signatures = [], signers = [], clearSign = false;

    var payloadBuf, payloadCompression;

    /////////////// METHODS FOR INITIALIZING THIS INSTANCE ///////////////

    /* Prepares a encryption by supplying the plaintext. */
    this.write = function(plaintext, options){
        if(!testType(plaintext).isArrayBuffer())
            throw new Error('enigma-invalid-input');
        
        plaintextBuf = plaintext;
        mainKeyBuf = new tool.get('util.srand')().bytes(64);
        clearSign = (options && true === options.clearsign);

        delete self.write;
        delete self.read;
        self.sign = sign;
        if(!clearSign) self.encrypt = encrypt;
        self.done = done;
    };

    /* Prepares a decryption by supplying the ciphertext. */
    this.read = function(textBuf){
        if(!testType(textBuf).isArrayBuffer())
            throw new Error('enigma-invalid-input');

        // see if we can treat the message as something enveloped.
        var isEnvelope = true;
        try{
            var envelopeDeserialized = envelopeSerializer.deserialize(textBuf);
        } catch(e){
            isEnvelope = false;
        };

        if(isEnvelope){
            var dReceivers = envelopeDeserialized.receivers,
                dDecryptors = envelopeDeserialized.decryptors,
                dCompression = envelopeDeserialized.compression,
                dPayload = envelopeDeserialized.payload;

            payloadBuf = dPayload;
            payloadCompression = dCompression;

            if(dReceivers.length != dDecryptors.length)
                throw new Error('enigma-invalid-input');
   
            if(dReceivers.length > 0){
                // payload needs to be decrypted.
                decryptors = dDecryptors;
                receivers = dReceivers;
                self.decrypt = decrypt;
                self.getReceivers = getReceivers;
                // ... and therefore no more processing.
                delete self.write;
                delete self.read;
                return;
            };
            // otherwise, payload is already clear. this needs to be proceeded
            // with following sequence.
        } else {
            // !! or this is not a envelope at all! continue to unpack payload.
            payloadCompression = false;
            payloadBuf = textBuf;
        };

        continueUnpackPayload();

        console.log('************************');
        delete self.write;
        delete self.read;
    };

    function continueUnpackPayload(){
        // this may be called immediate after `this.read`, or after
        // a decryption.
        
        // if payload compressed, decompress.
        if('lzw' == payloadCompression){
            try{
                payloadBuf = tool.get('util.decompress')(payloadBuf);
            } catch(e){
                throw new Error('enigma-invalid-input');
            };
        } else if(false !== payloadCompression)
            throw new Error('enigma-invalid-input');

        try{
            var payloadDeserialized = payloadSerializer.deserialize(payloadBuf);
        } catch(e){
            // payload being here must be readable. ciphertext must have been
            // provided with decryptors, which happens above.
            throw new Error('enigma-invalid-input');
        };
        
        var dSignatures = payloadDeserialized.signatures,
            dSigners = payloadDeserialized.signers,
            dPlaintext = payloadDeserialized.content;

        if(dSignatures.length != dSigners.length)
            throw new Error('enigma-invalid-input');

        plaintextBuf = dPlaintext;
        self.getPlaintext = getPlaintext;

        if(dSigners.length > 0){
            signatures = dSignatures;
            signers = dSigners;
            self.verify = verify;
            self.getSigners = getSigners;
        };
    };

    ////////////////// METHODS FOR A WRITTEN INSTANCE ////////////////////

    function sign(withIdentity){
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-sign');

        var withIdentityFp = withIdentity.getFingerprint();
        var signature = withIdentity.sign(plaintextBuf);
        signers.push(withIdentityFp);
        signatures.push(signature);

        if(signers.length >= 255) delete self.sign;
    };

    function encrypt(toIdentity){
        var decryptor = toIdentity.encrypt(mainKeyBuf);
        var toIdentityFp = toIdentity.getFingerprint();
        receivers.push(toIdentityFp);
        decryptors.push(decryptor);

        if(receivers.length >= 255) delete self.encrypt;
        return true;
    };

    function done(){
        delete self.sign;
        delete self.encrypt;

        var payloadBuf = payloadSerializer.serialize({
            'signers': signers,
            'signatures': signatures,
            'content': plaintextBuf,
        });

        if(clearSign) return payloadBuf;

        
        var compress = 'lzw';
        if(compress){
            payloadBuf = tool.get('util.compress')(payloadBuf);
        };

        var encrypt = (decryptors.length > 0);
        if(encrypt){
            payloadBuf = tool.get('cipher.symmetric')()
                .key(mainKeyBuf)
                .encrypt(payloadBuf)
            ;
        };

        var envelopeBuf = envelopeSerializer.serialize({
            'compression': compress || false,
            'receivers': receivers,
            'decryptors': decryptors,
            'payload': payloadBuf,
        });

        return envelopeBuf;
    };

    ////////////////// METHODS FOR A READING INSTANCE ////////////////////

    function decrypt(withIdentity){
        // decrypt `payloadBuf`. and call `continueUnpackPayload`.
        
        if(!withIdentity.isPrivate())
            throw new Error('enigma-invalid-identity-for-decrypt');

        var identityFingerprint = withIdentity.getFingerprint(),
            found = false;
        for(var i=0; i<receivers.length; i++){
            if(tool.get('util.buffer').equal(
                identityFingerprint,
                receivers[i]
            )){
                found = true;
                break;
            };
        };

        if(!found) throw new Error('enigma-invalid-identity-for-decrypt');

        var decryptor = decryptors[i];
        try{
            var mainKeyBuf = withIdentity.decrypt(decryptor);
        } catch(e){
            throw new Error('enigma-invalid-identity-for-decrypt');
        };

        try{
            payloadBuf = tool.get('cipher.symmetric')()
                .key(mainKeyBuf)
                .decrypt(payloadBuf)
            ;
        } catch(e){
            throw new Error('enigma-message-corrupted');
        };

        continueUnpackPayload(payloadBuf);
        delete self.decrypt;
        delete self.getReceivers;
    };

    function verify(withIdentity){
        var identityFingerprint = withIdentity.getFingerprint(),
            found = false;
        for(var i=0; i<signers.length; i++){
            if(tool.get('util.buffer').equal(
                identityFingerprint,
                signers[i]
            )){
                found = true;
                break;
            };
        };

        if(!found) throw new Error('enigma-invalid-identity-for-verify');

        var signature = signatures[i];
        try{
            return withIdentity.verify(plaintextBuf, signature);
        } catch(e){
            throw new Error('enigma-invalid-identity-for-verify');
        };
    };

    function getPlaintext(){ return plaintextBuf; };
    function getReceivers(){ return receivers; }; // TODO bug for insecurity, copy the array
    function getSigners(){ return signers; }; 

    return this;
};


/****************************************************************************/
function exporter(){ return new message(); };
tool.set('enigma.message', exporter);
tool.exp('enigma.message', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTaskList(storage, log){
    var list = [];

    list.push(function askOptionIncludePrivate(){
        return {question: 'options.list-include-private-identities'}
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.list-include-public-identities'}
    });

    list.push(function askOptionIncludePublic(){
        return {question: 'options.filter-by-keywords'}
    });

    list.push(function doer(data, answers){
        
    });

    return list;
};

/****************************************************************************/

var exporter = {
    variables: {
        'options.list-include-private-identities': 'boolean',
        'options.list-include-public-identities': 'boolean',
        'options.filter-by-keywords': 'string',
    },
    errors: {
    },
    constructor: function(storage){
        return getTaskList(storage);
    },
};
tool.set('enigma.interface.api.identity-list', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * Interface of enigma high-level interface
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////
var loadAPI = [
    'identity-list',
    'identity-generate',
    'identity-import',
    'identity-export',
    'identity-delete',

    'message-write',
    'message-read',
];

/*****************************************************************************
 *
 * Provides a procedure constructor, which is the template of all sessions
 * =======================================================================
 *
 * Procedures are lists of functions, each function has following signature:
 *
 *   function(data)
 *
 * the functions within a list will be executed from the beginning. The
 * returned value of previous functions are excepted to be one of the following
 * styles:
 *  o continue proceeding to the next function:
 *      {data: ...}
 *  o pause proceeding and ask another question:
 *      {question: 'QUESTION NAME'}
 *    this may also be used as prompting an alarm, or info, whose expected
 *    answer may be anything.
 *  o jump to the function defined in this procedure:
 *      {jump: 'NAME OF THE DESTINATED FUNCTION'}
 *  o emit an error:
 *      {error: 'ERROR NAME'}
 *    this will not terminate the session, i.e. the procedure is stopped at
 *    current question, and will wait for another try.
 *  o emit an error and terminate the procedure:
 *      {error: 'ERROR NAME', terminate: true}
 */
function procedure(taskList, translator, validator, variableList, errorList){
    // translator: map a given id into localized string
    // validator: given a question ID, and an answer, validate the value
    //            against according rules
    var self = this;

    var index = {};
    var type = tool.get('util.type');

    // index all functions with names to enable jumping feature
    var regexp = /^function\s([0-9a-z\_]+)\(/i, regexec, funcname;
    for(var i in taskList){
        if(!type(taskList[i]).isFunction())
            throw new Error('Non function defined.');
        regexec = regexp.exec(taskList[i].toString());
        if(!regexec) continue;
        funcname = regexec[1];
        index[funcname] = i;
    };


    // callback register
    var callbacks = {error: [], question: [], terminated: []};
    this.onError = function(callback){
        callbacks.error.push(callback);
    };
    this.onQuestion = function(callback){
        callbacks.question.push(callback);
    };
    this.onTerminated = function(callback){
        callbacks.terminated.push(callback);
    };
    function emit(type, a, b){
        for(var i in callbacks[type]) callbacks[type][i](a, b);
    };


    // preassigned variables
    var preassigned = {};
    this.assign = function(n, v){
        preassigned[n] = v;
        return self;
    };


    // shift function
    var cancelled = false;
    var pointer = 0, previousData = null, gotAnswers = {};
    function shift(){
        delete self.answer;
        delete self.cancel;

        if(pointer >= taskList.length || cancelled)
            return emit('terminated', previousData);

        var result = taskList[pointer](previousData, gotAnswers);
        if(!type(result).isObject())
            throw new Error('Result is not an object.');

        // data question jump error terminate

        previousData = result.data || null;

        if(result.error){
            if(errorList.indexOf(result.error))
                throw new Error('Undeclared error being thrown.');

            var error = {
                id: result.error,
                description: translator.error(result.error),
            };
            emit('error', error);
        };
        if(result.jump){
            var dest = index[result.jump];
            if(!dest) throw new Error('Jump destination unknown.');
            pointer = dest;
            shift();
        } else if(result.question){
            if(variableList.indexOf(result.question) < 0)
                throw new Error('Undeclared question being asked.');

            var question = {
                id: result.question,
                description: translator.question(result.question),
            };
            emit('question', question);

            (function(questionID){
                self.validate = function(ans){
                    return validator(questionID, ans);
                };
                self.answer = function(ans){
                    if(!validator(questionID, ans)){
                        emit('question', question);
                        return false;
                    };
                    gotAnswers[questionID] = ans;
                    pointer++;
                    shift();
                    return true;
                };
                self.cancel = function(){
                    cancelled = true;
                    shift();
                };
            })(result.question);
            
            if(preassigned[result.question])
                return self.answer(preassigned[result.question]);
        } else if(result.terminate){
            emit('terminated', previousData);
        } else {
            pointer++;
            shift();
        };
    };

    // starter, to start the procedure
    this.start = function(){
        // binding listeners are now no longer possible
        delete self.onError;
        delete self.onQuestion;
        delete self.onTerminated;
        
        delete self.assign;
        delete self.start;
        shift();
    };

    return this;
};

/****************************************************************************/

function initializer(options){
    var translator = options.translator,
        storage = options.storage;

    if(!(translator && storage))
        throw new Error('Missing components for initialization.');

    return function(apiName){
        if(loadAPI.indexOf(apiName) < 0) throw new Error('Unknown API');
        
        var api = tool.get('enigma.interface.api.' + apiName);
        if(!api) throw new Error('API not exists or not loaded.');

        // load declared variables and errors that may be asked/emitted.
        var variables = api.variables, errors = api.errors;

        // build a validator
        var type = tool.get('util.type');
        var validator = function(name, value){
            var desc = variables[name];

            function isType(type, value){
                if('string' === type) return type(value).isString();
                else if('boolean' === type) return type(value).isBoolean();
                else if('number' === type) return type(value).isNumber();
                else if('date' === type) return type(value).isDate();
                else throw new Error('Unknown type descriptor');
            };

            var typeTest = type(desc);

            // variable type specified by a string
            if(typeTest.isString()) return isType(desc, value);

            // variable validity specified by a function
            if(typeTest.isFunction()) return desc(value);

            // variable validity specified by an object, with type specified
            // and function defined
            if(typeTest.isObject()){
                if(!isType(desc.type, value)) return false;
                if(!desc.validate(value)) return false;
                return true;
            };

            throw new Error('Unknown variable descriptor');
        };

        // build a logger
        var logStart = new Date().getTime();
        var log = function(text){
            var time = (new Date().getTime() - logStart) / 1000;
            console.log('[' + apiName + '][' + time + '] ' + text);
        };

        var taskList = api.constructor(storage, log);
        var session = new procedure(
            taskList,
            translator,
            validator,
            Object.keys(variables),
            Object.keys(errors)
        );

        return session;
    };
};

tool.exp('enigma.interface', initializer);
//////////////////////////////////////////////////////////////////////////////
})(tool);
/*
 * Replace internal random generator
 * =================================
 *
 * This plugin implements an API provided by `enigma-fsbrowser`. It is a
 * new getRandomBytes() function implemented in Python utilizing its
 * `os.urandom` function, which provides cryptographically secure random bytes.
 */
(function(tool){

var supportEnhancement = (
    ('undefined' !== typeof ENIGMA_ENHANCEMENT) &&
    ('undefined' !== typeof ENIGMA_ENHANCEMENT.getRandomBytes)
);

if(supportEnhancement) tool.acc('util.srand.getRandomBytes', function(n){
    return ENIGMA_ENHANCEMENT.getRandomBytes(n);
});

})(tool);
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
/* //test code begin 

var identity = tool.get('enigma.identity')(),
    identity2 = tool.get('enigma.identity')(),
    identity3 = tool.get('enigma.identity')(),
    key = new tool.get('util.srand')().bytes(32);

identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});
console.log(identity.getFingerprint(true), '******************************');

identity2.loadPublic(identity.exportPublic());

var privateKey = identity.exportPrivate(key);
identity3.loadPrivate(privateKey, key);


var message = tool.get('enigma.message')();
message.write(tool.get('util.encoding')('The first enigma message.', 'ascii').toArrayBuffer());
//message.sign(identity3);
message.encrypt(identity2);

var doneMessage = message.done();

var message2 = tool.get('enigma.message')();
message2.read(doneMessage);
message2.decrypt(identity3);

console.log(message2);
console.log(message2.getPlaintext());

process.exit();*/
//////////////////////////////////////////////////////////////////////////////
/* test code end */
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
return exportTree;
})();
