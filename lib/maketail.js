/* test code begin */

var identity = tool.get('enigma.identity')(),
    identity2 = tool.get('enigma.identity')();

identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});

console.log(tool.get('util.encoding')(
    identity.encrypt(new Uint8Array([1,2,3,4,5]).buffer)
).toBase32());

console.log(identity);


identity2.loadPublic(identity.exportPublic());

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
