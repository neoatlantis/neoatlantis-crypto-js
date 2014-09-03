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
