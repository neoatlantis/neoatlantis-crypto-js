(function(tool){

function _array(){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(arrayOfBuffer){
        if(!Boolean(arrayOfBuffer))
            arrayOfBuffer = [];
        else
            if(
                !$.tools.type.areBuffers(arrayOfBuffer) ||
                arrayOfBuffer.length > 255
            )
                throw $.error('invalid-parameter', 'not-buffers-items');

        var data = [];
        for(var i in arrayOfBuffer){
            var len = arrayOfBuffer[i].length,
                lenBuf = new $.node.buffer.Buffer(2);
            if(len > 0xffff)
                throw $.error('invalid-parameter', 'data-too-long');
            lenBuf.writeUInt16BE(len, 0);
            data.push(
                $.node.buffer.Buffer.concat([lenBuf, arrayOfBuffer[i]])
            );
        };

        lenBuf = new $.node.buffer.Buffer(2);
        lenBuf.writeUInt16BE(arrayOfBuffer.length, 0);
        data.unshift(lenBuf);

        return $.node.buffer.Buffer.concat(data);
    };

    this.unpack = function(buf){
        var totalCount = 0, cutLen = 0, cut;
        
        var tempBuf = buf.slice(0, 2);
        buf = buf.slice(2);
        totalCount = tempBuf.readUInt16BE(0);

        var ret = [];
        for(var i=0; i<totalCount; i++){
            tempBuf = buf.slice(0, 2);
            buf = buf.slice(2);
            cutLen = tempBuf.readUInt16BE(0);
            cut = buf.slice(0, cutLen);
            buf = buf.slice(cutLen);
            ret.push(cut);
        };
        
        return [ret, buf];
    };

    return this;
};

tool.set('util.serialize.array', function(regtree){
    regtree["array"] = function(){return new _array();};
});
})(tool);
