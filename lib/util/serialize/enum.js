module.exports = function(regtree){
    regtree["enum"] = function(p){return new _enum(p);};
};

function _enum(p){
    var self = this;

    if(!$.tools.type.isArray(p) || p.length > 255)
        throw $.error('invalid-parameter');

    this.pack = function(str){
        var value = p.indexOf(str);
        if(value < 0)
            throw $.error('invalid-parameter', 'not-enum-item');
        var ret = new $.node.buffer.Buffer(1);
        ret.writeUInt8(value, 0);
        return ret;
    };

    this.unpack = function(buf){
        var value = buf.slice(0, 1);
        buf = buf.slice(1);
        value = value.readUInt8(0);
        return [p[value], buf];
    };

    return this;
};
