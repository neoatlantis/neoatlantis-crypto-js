/* test code begin */

var identity = tool.get('enigma.identity')();
identity.generate('abcdefghijklmn', {algorithm: 'NECRAC96'});
console.log(tool.get('util.encoding')(identity.exportPublic()).toBase32());

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
