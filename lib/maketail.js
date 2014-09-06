/* test code begin */

var identity = tool.get('enigma.identity')();
identity.generate('abcdefghijklmn');
console.log(identity);

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
