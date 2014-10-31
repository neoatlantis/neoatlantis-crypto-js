var crypto = require('./enigma-jscrypto.min.js');

var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./.localStorage');
var translate = {
    error: function(v){return v},
    question: function(v){return v},
}
var enigma = crypto.enigma.interface({
    storage: localStorage,
    translator: translate,
});


var passphrase = 'DEADBEEFDEADBEEFDEADBEEFDEADBEEF';
function test(){
    var data = {};
    var start,
        addIdentity,
        exportPrivate,
        exportPublic,
        deleteIdentity
        ;

    start = function(){ addIdentity(); };

    addIdentity = function(){
        var session = enigma('identity-generate');
        session
            .assign('text.passphrase', passphrase)
            .assign('select.algorithm', 'NECRAC256')
            .assign('text.subject', 'TestTestTest')
        ;
        session.onTerminated(function(fp){
            data.fingerprint = fp;
            exportPrivate();
        });
        session.start();
    };

    exportPrivate = function(){
        var session = enigma('identity-export');

    };


    start();
};

test();
