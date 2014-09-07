(function(tool){

function _array(length){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(arrayOfBuffer){
        if(!Boolean(arrayOfBuffer))
            arrayOfBuffer = [];
        else {
            if(arrayOfBuffer.length > 255)
                throw new Error('invalid-parameter');
            for(var i=0; i<arrayOfBuffer.length; i++)
                if(!testType(arrayOfBuffer[i]).isArrayBuffer())
                    throw new Error('invalid-parameter');
        };

        var data = [];
        for(var i in arrayOfBuffer){
            var len = arrayOfBuffer[i].byteLength;

            if(1 == length){
                if(len > 0xff) throw new Error('invalid-parameter');
                var lenBuf = new Uint8Array([len]).buffer;
            } else if(2 == length){
                if(len > 0xffff) throw new Error('invalid-parameter');
                var lenBuf = new Uint16Array([len]).buffer;
            };

            data.push(
                tool.get('util.buffer').concat([lenBuf, arrayOfBuffer[i]])
            );
        };

        lenBuf = new Uint8Array([arrayOfBuffer.length]).buffer;
        data.unshift(lenBuf);

        return tool.get('util.buffer').concat(data);
    };

    this.unpack = function(buf){
        var totalCount = 0, cutLen = 0, cut;
        
        var tempBuf = buf.slice(0, 1);
        buf = buf.slice(1);
        totalCount = new Uint8Array(tempBuf)[0];

        var ret = [];
        for(var i=0; i<totalCount; i++){
            tempBuf = buf.slice(0, length);
            buf = buf.slice(length);
            if(1 == length)
                cutLen = new Uint8Array(tempBuf)[0];
            else if(2 == length)
                cutLen = new Uint16Array(tempBuf)[0];
            cut = buf.slice(0, cutLen);
            buf = buf.slice(cutLen);
            ret.push(cut);
        };
        
        return [ret, buf];
    };

    return this;
};

tool.set('util.serialize.array', function(regtree){
    regtree["array"] = function(){return new _array(2);};
    regtree["shortArray"] = function(){return new _array(1);};
});
})(tool);
