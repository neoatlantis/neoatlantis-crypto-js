/* test code begin */

var template = tool.get('util.serialize')({
    _: ['constant', 'hi'],
    name: 'shortBinary',
});

var serialized = template.serialize({
    name: new Uint8Array([1,1,2,3,4,5,6,7,8]).buffer,
});

console.log(serialized.byteLength + ' bytes used');
var deserialized = template.deserialize(serialized);
console.log(deserialized);

/* test code end */
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
})();
