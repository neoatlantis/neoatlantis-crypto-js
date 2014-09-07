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
console.log(identity2, identity2.isPrivate());

var privateKey = identity.exportPrivate(key);
identity3.loadPrivate(privateKey, key);
console.log(identity3, identity3.isPrivate());


var message = tool.get('enigma.message')();
message.write(tool.get('util.encoding')('The first enigma message.', 'ascii').toArrayBuffer());
message.sign(identity3);
console.log(message.done());

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
