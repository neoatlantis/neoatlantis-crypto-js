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
    function bytex(ary){
        var ret = 0;
        for(var k=0; k<ary.length; k++){
            ret = (ret << 8);
            ret |= (ary[k] & 0xFF);
        };
        return ret;
    };

    var ret = [];
    while(i < array.length){
        sigbyte = array[i];
        i++;

        j = bytec(sigbyte, 3); b1 = bytex(array.slice(i, i+j)); i+=j;
        j = bytec(sigbyte, 2); b2 = bytex(array.slice(i, i+j)); i+=j;
        j = bytec(sigbyte, 1); b3 = bytex(array.slice(i, i+j)); i+=j;
        j = bytec(sigbyte, 0); b4 = bytex(array.slice(i, i+j)); i+=j;
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
    console.log(result, '*********');
    return new Uint8Array(enpack(result)).buffer;
};


//LZW Compression/Decompression for Strings
function decompress(compressedBuf){
    if(!tool.get('util.type')(compressedBuf).isArrayBuffer())
        throw Error('invalid-input');
    var src = new Uint8Array(compressedBuf);
    src = depack(src);
    console.log(src, '****');

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
    }
    return new Uint8Array(result).buffer;
}



tool.exp('util.compress', compress);
tool.exp('util.decompress', decompress);
tool.set('util.compress', compress);
tool.set('util.decompress', decompress);

//////////////////////////////////////////////////////////////////////////////
})(tool);
