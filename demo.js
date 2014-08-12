var crypto = require('./lib/enigma-jscrypto.js');
function test(name, func){
    var s = 'Testing item [' + name + '], result: ';
    if(func())
        s += 'OK';
    else
        s += 'FAILED!';
    crypto.util.log.notice(s);
};
crypto.util.log.notice('----------------------');
//////////////////////////////////////////////////////////////////////////////
test('Random Generator', function(){
    var x = new crypto.util.srand().bytes(1024);
    return 1024 == x.byteLength;
});
test('Hash Function', function(){
    
});
