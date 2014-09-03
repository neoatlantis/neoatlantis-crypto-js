module.exports = function(regtree){
    regtree["boolean"] = function(){return new _boolean();};
};

function _boolean(){
    var self = this;

    this.pack = function(bool){
        if(!$.tools.type.isBoolean(bool))
            throw $.error('invalid-parameter', 'not-boolean-item');
        var ret = new $.node.buffer.Buffer(1);
        ret.writeUInt8((bool?255:0), 0);
        return ret;
    };

    this.unpack = function(buf){
        var value = buf.slice(0, 1);
        buf = buf.slice(1);
        value = (255 == value.readUInt8(0));
        return [value, buf];
    };

    return this;
};
