var crypto = require('./enigma-jscrypto.js');

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
    var sequence = [];


    sequence.push(function(cb){
        console.log('Add first new identity');

        var session = enigma('identity-generate');
        session
            .assign('text.passphrase', passphrase)
            .assign('select.algorithm', 'NECRAC256')
            .assign('text.subject', 'TestSubject01')
        ;
        session.onTerminated(function(fp){
            data.fingerprint1 = fp;
            cb();
        });
        session.start();
    });


    sequence.push(function(cb){
        console.log('Add second new identity');

        var session = enigma('identity-generate');
        session
            .assign('text.passphrase', passphrase)
            .assign('select.algorithm', 'NECRAC112')
            .assign('text.subject', 'TestSubject02')
        ;
        session.onTerminated(function(fp){
            data.fingerprint2 = fp;
            cb();
        });
        session.start();
    });


    sequence.push(function(cb){
        console.log('Send an encrypted message from 1 to 2 without signature.');

        var session = enigma('message-write');
        session
            .assign('text.data', 'deadbeef')
            .assign('option.add-sign', false)
        ;

        var s = [data.fingerprint2];
        session.onQuestion(function smartAnswer(q){
            console.log('Auto answer: ', q.id);
            if(s.length > 0){
                if('option.add-encrypt' == q.id){
                    return session.answer(true);
                } else { // text.fingerprint
                    return session.answer(s.shift());
                };
            } else {
                if('option.add-encrypt' == q.id) return session.answer(false);
                if('option.add-sign' == q.id) return session.answer(false);
            };
        });

        session.onTerminated(function(d){
            data.ciphertextTo2NoSign = d;
            cb();
        });

        session.start();
    });


    sequence.push(function(cb){
        console.log('Export the new identity with private part');

        var session = enigma('identity-export');

        cb();
    });


    sequence.push(function(cb){
        console.log('Delete identity 1');
        var session = enigma('identity-delete');
        session.assign('text.fingerprint', data.fingerprint1);
        session.onTerminated(cb);
        session.start();
    });



    sequence.push(function(cb){
        console.log('Delete identity 2');
        var session = enigma('identity-delete');
        session.assign('text.fingerprint', data.fingerprint2);
        session.onTerminated(cb);
        session.start();
    });



    var cb = function(){
        if(sequence.length > 0)
            sequence.shift()(cb);
        else
            process.exit(0);
    };
    cb();
};

test();
