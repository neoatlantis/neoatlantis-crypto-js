(function(tool){
tool.exp('util.uuid', function(){
    var bytes = new tool.get('util.srand')().bytes(16);
    var hex = tool.get('util.encoding')(bytes).toHEX();

    return String(
        hex.slice(0,8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) +
        '-' + hex.slice(16, 20) + '-' + hex.slice(20, 32)
    );
});
})(tool);
