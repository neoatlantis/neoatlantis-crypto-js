__enigma_jscrypto__ = {};
(function(namespace){
var funcTree = {}, exportTree = {};
var tool = {
    'get': function(name){
        return funcTree[name];
    },
    'set': function(name, func){
        funcTree[name] = func;
    },
    'export': function(path, func){
        var paths = path.split('.');
        var cursor = exportTree;
        for(var i in paths){
            if('undefined' == typeof cursor[paths[i]]){
                if(paths.length - 1 == i){
                    cursor[paths[i]] = func;
                    break;
                };
                cursor[paths[i]] = {};
            };
            cursor = cursor[paths[i]];
        };
    };
};
