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

var _def = false;

function _SERIALIZATION(definition){
    var self = this;
    var testType = tool.get('util.type');

    if(!testType(definition).isObject())
        throw new Error('invalid-data-structure');

    var order = Object.keys(definition).sort(),
        workers = [];
    for(var i in order){
        var key = order[i];
        var typeName, typeParam;
        if(testType(definition[key]).isString()){
            typeName = definition[key];
            typeParam = [];
        } else {
            typeName = definition[key][0];
            typeParam = definition[key].slice(1);
        };
        if(!_def[typeName])
            throw new Error('invalid-data-structure');
        workers.push(_def[typeName](typeParam));
    };

    this.serialize = function(obj){
        if(!testType(obj).isObject()) throw new Error('invalid-parameter');

        var result = [];

        for(var i in workers){
            var key = order[i];
            result.push(workers[i].pack(obj[key]));
        };

        return tool.get('util.buffer').concat(result);
    };

    this.deserialize = function(buffer){
        if(!testType(buffer).isArrayBuffer())
            throw new Error('invalid-parameter');

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
    if(false === _def){
        // first use. load modules
        _def = {};
        tool.get('util.serialize.enum')(_def);
        tool.get('util.serialize.binary')(_def);
        tool.get('util.serialize.boolean')(_def);
        tool.get('util.serialize.constant')(_def);
        tool.get('util.serialize.array')(_def);
        tool.get('util.serialize.datetime')(_def);
    };
    return new _SERIALIZATION(definition);
};
tool.set('util.serialize', exporter);
//////////////////////////////////////////////////////////////////////////////
})(tool);
