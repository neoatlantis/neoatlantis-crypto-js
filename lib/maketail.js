/* test code begin */

var identity = tool.get('enigma.identity')(),
    identity2 = tool.get('enigma.identity')(),
    identity3 = tool.get('enigma.identity')(),
    key = new tool.get('util.srand')().bytes(32);

identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});

/*console.log(tool.get('util.encoding')(
    identity.encrypt(new Uint8Array([1,2,3,4,5]).buffer)
).toBase32());*/

identity2.loadPublic(identity.exportPublic());
console.log(identity2);

var privateKey = identity.exportPrivate(key);
identity3.loadPrivate(privateKey, key);
console.log(identity3);

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
