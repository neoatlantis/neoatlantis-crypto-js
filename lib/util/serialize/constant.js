/*
 * Constant Type
 * =============
 *
 * This type is used to write a constant string in the packed string, and to
 * verify that the same value will be unpacked. This is useful for identifying
 * the type of a piece of message.
 *
 * At the time of packing, no actual value will be considered. At unpacking,
 * a `assume` process is done, that being said, if we could not get the
 * expected value from unpacked string, errors will be thrown.
 */
(function(tool){

function _constant(p){
    var self = this;
    var testType = tool.get('util.type');

    if(!testType(p).isArray())
        throw new Error('invalid-parameter');

    var convertString = false;
    p = p[0];
    if(testType(p).isString()){
        p = tool.get('util.encoding')(p).toArrayBuffer();
        convertString = true;
    };
    if(!testType(p).isArrayBuffer()) throw new Error('invalid-parameter');

    this.pack = function(){
        return p;
    };

    this.unpack = function(buf){
        var value = buf.slice(0, p.byteLength);
        buf = buf.slice(p.length);
        if(!tool.get('util.buffer').equal(value, p))
            throw new Error('unexpected-constant');
        if(convertString) value = value.toUTF16();
        return [value, buf];
    };

    return this;
};

tool.set('util.serialize.constant', function(regtree){
    regtree["constant"] = function(p){return new _constant(p);};
});

})(tool);
