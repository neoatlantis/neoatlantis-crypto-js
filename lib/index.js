module.exports = new (function(){
    var self = this;
    
    this.hash = require('./hash.js');
    this.random = require('./random.js');
    this.crypt = require('./crypt.js');
    this.acrypt = require('./acrypt.js');
    
//    this.class = require('./class');

    return this;
})();
