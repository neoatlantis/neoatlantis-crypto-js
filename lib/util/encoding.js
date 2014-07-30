(function(root){
//////////////////////////////////////////////////////////////////////////////

function encoding(src, format){
    var self = this;

    var buffer = null;

    var type = root.util.type(src);
    if(type.isArrayBuffer())
        buffer = src;
    else if(type.isString()){
        switch(format.toLowerCase()){
            case 'hex': 
                if(!/^[0-9a-f]+$/i.test(src) || 0 != src.length % 2)
                    throw Error('invalid-encoding-choosen');
                src = src.toLowerCase();

                var cbuf = new Uint8Array(src.length / 2),
                    table = [
                        '0', '1', '2', '3', '4', '5', '6', '7',
                        '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
                for(var i=0; i<cbuf.length; i++){
                    cbuf[i] = table.indexOf(src[2*i]) * 16
                        + table.indexOf(src[2*i+1])
                };

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
        var view = new Uint16Array(buffer), s = '';
        for(var i=0; i<view.length; i++) s += String.fromCharCode(view[i]);
        return s;
    };

    this.toBase64 = function(){
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

    return this;
};


if('undefined' != typeof module && 'undefined' != typeof module.exports){
    module.exports = encoding;
} else {
    define([], function(){
        return encoding;
    });
};
root.util.encoding = encoding;
//////////////////////////////////////////////////////////////////////////////
})(__enigma_jscrypto__);
