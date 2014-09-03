(function(tool){
//////////////////////////////////////////////////////////////////////////////
function _binary(isLong){
    var self = this;

    this.unpack = function(buf){
        var unpackLength;
        if(isLong){
            unpackLength = new Uint32Array(buf)[0];
            buf = buf.slice(4);
        } else {
            unpackLength = new Uint16Array(buf)[0];
            buf = buf.slice(2);
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
            (isLong && packLength > 0xffffffff) ||
            (!isLong && packLength > 0xffff)
        )
            throw new Error('invalid-parameter');

        var head = new Uint8Array(isLong?4:2));
        if(isLong){
            var head = new Uint32Array(1);
            head[0] = packLength;
        } else {
            var head = new Uint16Array(1);
            head[0] = packLength;
        };

        return tool.get('util.buffer').concat([head, buffer]);
    };

    return this;
};
//////////////////////////////////////////////////////////////////////////////
tool.set('util.serialize.binary', function(regtree){
    regtree.binary = function(){return new _binary(false);};
    regtree.longBinary = function(){return new _binary(true);};
});

})(tool);
