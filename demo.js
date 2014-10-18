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
    rl.question(question.description, function(answer){
        session.answer(answer);
    });
});

session.onError(function(error){
    console.log(error.description);
});

session.onTerminated(function(){
    console.log('session terminated.');
});


session.start();
