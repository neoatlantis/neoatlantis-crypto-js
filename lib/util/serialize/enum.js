(function(tool){

function _enum(p){
    var self = this;

    if(!tool.get('util.type')(p).isArray() || p.length > 255)
        throw new Error('invalid-parameter');

    this.pack = function(str){
        var value = p.indexOf(str);
        if(value < 0)
            throw new Error('invalid-parameter', 'not-enum-item');
        var ret = new Uint8Array([value,]);
        return ret.buffer;
    };

    this.unpack = function(buf){
        var value = new Uint8Array(buf.slice(0, 1))[0];
        buf = buf.slice(1);
        return [p[value], buf];
    };

    return this;
};

tool.set('util.serialize.enum', function(regtree){
    regtree["enum"] = function(p){return new _enum(p);};
});

})(tool);
