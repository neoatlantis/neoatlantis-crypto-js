(function(tool){

var exporter = {
    notice: function(x){console.log(x);},
    error: function(x){console.error(x);},
};

tool.set('util.log', exporter);
tool.exp('util.log', exporter);
})(tool);
