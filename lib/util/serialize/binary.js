(function(tool){
//////////////////////////////////////////////////////////////////////////////
function _binary(length){
    var self = this;

    this.unpack = function(buf){
        var unpackLength;
        if(4 == length){
            unpackLength = new Uint32Array(buf)[0];
            buf = buf.slice(4);
        } else if(2 == length){
            unpackLength = new Uint16Array(buf)[0];
            buf = buf.slice(2);
        } else if(1 == length){
            unpackLength = new Uint8Array(buf)[0];
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
