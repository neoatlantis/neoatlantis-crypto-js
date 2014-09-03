/*
 * Enigma Defined Serialization
 * ============================
 *
 * This is to reinvent the wheel, in order to do a serializing worker as
 * compact as possible. The result should also be deterministic, so that even
 * a calculation of hash is also possible.
 *
 * This should be done in such a way. The declaration of data structure should
 * be done at beginning. The serializing process deals with all parameters
 * in an array in order. Although the data structure is a key-valued model,
 * the result contains only the data. When it hopefully successfully
 * deserialized, the keys will be reassigned.
 *
 * Read the `README.md` for more specification.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

var _def = {};

require('./binary.js')(_def);
require('./enum.js')(_def);
require('./boolean.js')(_def);
require('./datetime.js')(_def);
require('./constant.js')(_def);
require('./array.js')(_def);

function _SERIALIZATION(definition){
    var self = this;

    if(!$.tools.type.isObject(definition))
        throw $.error('invalid-data-structure');

    var order = Object.keys(definition).sort(),
        workers = [];
    for(var i in order){
        var key = order[i];
        var typeName, typeParam;
        if($.tools.type.isString(definition[key])){
            typeName = definition[key];
            typeParam = [];
        } else {
            typeName = definition[key][0];
            typeParam = definition[key].slice(1);
        };
        if(!_def[typeName])
            throw $.error('invalid-data-structure');
        workers.push(_def[typeName](typeParam));
    };

    this.serialize = function(obj){
        if(!$.tools.type.isObject(obj))
            throw $.error('invalid-parameter');

        var result = [];

        for(var i in workers){
            var key = order[i];
            result.push(workers[i].pack(obj[key]));
        };

        return $.node.buffer.Buffer.concat(result);
    };

    this.deserialize = function(buffer){
        if(!$.tools.type.isBuffer(buffer))
            throw $.error('invalid-parameter');

        var resultObj = {};

        for(var i in order){
            var key = order[i];
            var result = workers[i].unpack(buffer);
            resultObj[key] = result[0];
            buffer = result[1];
        };

        return resultObj;
    };
    
    return this;
};


/****************************************************************************/

var exporter = function(definition){
    return new _SERIALIZATION(definition);
};
tool.set('util.serialize', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
