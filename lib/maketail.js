/* test code begin */

var identity = tool.get('enigma.identity')(),
    identity2 = tool.get('enigma.identity')(),
    identity3 = tool.get('enigma.identity')(),
    key = new tool.get('util.srand')().bytes(32);

identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});

identity2.loadPublic(identity.exportPublic());

var privateKey = identity.exportPrivate(key);
identity3.loadPrivate(privateKey, key);


var message = tool.get('enigma.message')();
message.write(tool.get('util.encoding')('The first enigma message.', 'ascii').toArrayBuffer());
message.sign(identity3);

var doneMessage = message.done();

var message2 = tool.get('enigma.message')();
message2.read(doneMessage);


console.log(message2.getSigners());

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
