module.exports = function(regtree){
    regtree.binary = function(){return new _binary(false);};
    regtree.longBinary = function(){return new _binary(true);};
};

//////////////////////////////////////////////////////////////////////////////
function _binary(isLong){
    var self = this;

    this.unpack = function(buf){
        var unpackLength;
        if(isLong){
            unpackLength = buf.readUInt32BE(0);
            buf = buf.slice(4);
        } else {
            unpackLength = buf.readUInt16BE(0);
            buf = buf.slice(2);
        };
        if(0 == unpackLength)
            return [null, buf];

        unpackResult = buf.slice(0, unpackLength);
        buf = buf.slice(unpackLength);
        return [unpackResult, buf]; 
    };

    this.pack = function(buffer){
        if(!Boolean(buffer))
            buffer = new $.node.buffer.Buffer(0);

        if(!$.tools.type.isBuffer(buffer))
            throw $.error('invalid-parameter', 'not-buffer-item');

        packLength = buffer.length;
        if(
            (isLong && packLength > 0xffffffff) ||
            (!isLong && packLength > 0xffff)
        )
            throw $.error('invalid-parameter', 'too-long');

        var head = new $.node.buffer.Buffer((isLong?4:2));
        if(isLong)
            head.writeUInt32BE(packLength, 0);
        else
            head.writeUInt16BE(packLength, 0);

        return $.node.buffer.Buffer.concat([head, buffer]);
    };

    return this;
};
