/* test code begin */

var identity = tool.get('enigma.identity')();
identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});

console.log(tool.get('util.encoding')(
    identity.decrypt(
        identity.encrypt(new Uint8Array([1,2,3,4,5]).buffer)
    )
).toHEX());


process.exit();
//////////////////////////////////////////////////////////////////////////////
/* test code end */
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
})();
