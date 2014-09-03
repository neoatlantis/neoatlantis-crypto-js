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
