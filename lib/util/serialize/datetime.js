(function(tool){
//////////////////////////////////////////////////////////////////////////////

function _datetime(){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(date){
        if(!Boolean(date)) return new Uint8Array([0]).buffer;

        if(!testType(date).isDate())
            if(testType(date).isString()){
                try{
                    date = new Date(date);
                } catch(e){
                    throw new Error('invalid-parameter');
                };
            } else
                throw new Error('invalid-parameter');

        var isoStr = date.toISOString();

        var repr = tool.get('util.encoding')(isoStr, 'ascii').toArrayBuffer(),
            reprlen = repr.byteLength,
            reprlenBuf = new Uint8Array([reprlen]).buffer;

        return tool.get('util.buffer').concat([reprlenBuf, repr]);
    };

    this.unpack = function(buf){
        var reprlenBuf = buf.slice(0, 1),
            reprlen = new Uint8Array(reprlenBuf)[0];
        buf = buf.slice(1);
        
        if(0 == reprlen) return [null, buf];

        var repr = buf.slice(0, reprlen);
        buf = buf.slice(reprlen);

        var ret = new Date(tool.get('util.encoding')(repr).toASCII());
        return [ret, buf];
    };

    return this;
};


tool.set('util.serialize.datetime', function(regtree){
    regtree["datetime"] = function(){return new _datetime();};
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
