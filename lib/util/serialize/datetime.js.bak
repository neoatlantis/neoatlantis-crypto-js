module.exports = function(regtree){
    regtree["datetime"] = function(){return new _datetime();};
};

function _datetime(){
    var self = this;

    this.pack = function(date){
        if(!Boolean(date)) return new $.node.buffer.Buffer('00', 'hex');

        if(!$.tools.type.isDate(date))
            if($.tools.type.isString(date)){
                try{
                    date = new Date(date);
                } catch(e){
                    throw $.error('invalid-parameter', 'date');
                };
            } else
                throw $.error('invalid-parameter', 'date');

        var repr = new $.node.buffer.Buffer(date.toISOString(), 'ascii'),
            reprlen = repr.length,
            reprlenBuf = new $.node.buffer.Buffer(1);

        reprlenBuf.writeUInt8(reprlen, 0);
        return $.node.buffer.Buffer.concat([reprlenBuf, repr]);
    };

    this.unpack = function(buf){
        var reprlenBuf = buf.slice(0, 1),
            reprlen = reprlenBuf.readUInt8(0);
        buf = buf.slice(1);
        
        if(0 == reprlen) return [null, buf];

        var repr = buf.slice(0, reprlen);
        buf = buf.slice(reprlen);

        var ret = new Date(repr.toString('ascii'));
        return [ret, buf];
    };

    return this;
};
