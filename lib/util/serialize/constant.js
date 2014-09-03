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
module.exports = function(regtree){
    regtree["constant"] = function(p){return new _constant(p);};
};

function _constant(p){
    var self = this;

    if(!$.tools.type.isArray(p)) throw $.error('invalid-parameter');

    var convertString = false;
    p = p[0];
    if($.tools.type.isString(p)){
        p = new $.node.buffer.Buffer(p);
        convertString = true;
    };
    if(!$.tools.type.isBuffer(p)) throw $.error('invalid-parameter');

    this.pack = function(){
        return p;
    };

    this.unpack = function(buf){
        var value = buf.slice(0, p.length);
        buf = buf.slice(p.length);
        if(value.toString('hex') !== p.toString('hex'))
            throw $.error('invalid-parameter', 'unexpected-constant');
        if(convertString) value = value.toString();
        return [value, buf];
    };

    return this;
};
