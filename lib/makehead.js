(function(){
var funcTree = {}, accTree = {}, exportTree = {};
var tool = {
    'get': function(name){
        // accelerator: if accelerated version exists in accTree, then
        // return accelerated version.
        if(true){ // TODO if acceleration
            if(accTree[name]) return accTree[name];
        };
        return funcTree[name];
    },
    'set': function(name, x){
        funcTree[name] = x;
    },
    'exp': function(path, x){
        var paths = path.split('.');
        var cursor = exportTree;
        for(var i in paths){
            if('undefined' == typeof cursor[paths[i]]){
                if(i == paths.length - 1){
                    cursor[paths[i]] = x;
                    break;
                };
                cursor[paths[i]] = {};
            };
            cursor = cursor[paths[i]];
        };
    },
    'acc': function(name, x){
        accTree[name] = x;
    },
};




/* Define Environmental Variables */

tool.set('env.isNode', (
    'undefined' != typeof module &&
    'undefined' != typeof process &&
    'undefined' != typeof process.title &&
    'node' === process.title
));
