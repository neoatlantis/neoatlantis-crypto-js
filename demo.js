var apiNameList = [
    'identity-generate',
    'identity-list',
    'identity-delete',
];

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

var translate = {
    error: function(v){return v},
    question: function(v){return v},
}

var argv = process.argv;
var crypto = require('./lib/enigma-jscrypto.js');

var LocalStorage = require('node-localstorage').LocalStorage;
var localStorage = new LocalStorage('./.localStorage');


var menu = '';
for(var i=0; i<apiNameList.length; i++)
    menu += i.toString() + ': ' + apiNameList[i] + '\n';
rl.question('Select an option:\n' + menu, function(answer){
    var select = apiNameList[parseInt(answer, 10)];
    if(!select) process.exit(1);
    proc(select);
});

//////////////////////////////////////////////////////////////////////////////
function proc(apiName){


var enigma = crypto.enigma.interface({
    storage: localStorage,
    translator: translate,
});

var session = enigma(apiName);




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


////
};
//////////////////////////////////////////////////////////////////////////////
