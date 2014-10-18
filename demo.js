var translate = {
    error: function(v){return v},
    question: function(v){return v},
}

var argv = process.argv;
var crypto = require('./lib/enigma-jscrypto.js'),
    localStorage = require('node-persist');

localStorage.initSync({
    dir: './test',
    continous: true,
    interval: false,
});

var apiName = argv[2];



var enigma = crypto.enigma.interface({
    storage: localStorage,
    translator: translate,
});

var session = enigma(apiName);

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});



session.onQuestion(function(question){
    rl.question('[' + question.type + '] ' + question.description + ' > ', function(answer){
        if('boolean' == question.type)
            return session.answer('true' === answer);
        session.answer(answer);
    });
});

session.onError(function(error){
    console.log('*** ERROR *** : ' + error.description);
});

session.onTerminated(function(d){
    console.log('session terminated.');
    console.log(d);
    process.exit(0);
});


session.start();
