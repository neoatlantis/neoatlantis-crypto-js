function translate(){
    return {
        error: function(v){return v},
        question: function(v){return v},
    }
};

/****************************************************************************/
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
console.log(session);
