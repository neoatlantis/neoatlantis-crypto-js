if('undefined' != typeof module && 'undefined' != module.exports)
    module.exports = exportTree;
else
    define([], function(){
        console.log('***', exportTree);
        return exportTree;
    });
})();
