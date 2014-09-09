/* //test code begin 

var identity = tool.get('enigma.identity')(),
    identity2 = tool.get('enigma.identity')(),
    identity3 = tool.get('enigma.identity')(),
    key = new tool.get('util.srand')().bytes(32);

identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});
console.log(identity.getFingerprint(true), '******************************');

identity2.loadPublic(identity.exportPublic());

var privateKey = identity.exportPrivate(key);
identity3.loadPrivate(privateKey, key);


var message = tool.get('enigma.message')();
message.write(tool.get('util.encoding')('The first enigma message.', 'ascii').toArrayBuffer());
//message.sign(identity3);
message.encrypt(identity2);

var doneMessage = message.done();

var message2 = tool.get('enigma.message')();
message2.read(doneMessage);
message2.decrypt(identity3);

console.log(message2);
console.log(message2.getPlaintext());

process.exit();*/
//////////////////////////////////////////////////////////////////////////////
/* test code end */
if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        return exportTree;
    });
return exportTree;
})();
