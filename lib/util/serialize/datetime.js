/*
 * Serialize and Deserialize Date and Time.
 *
 * Available Date and Time Range: 1. Jan. 0001(AC) - 31. Dec. 65535(AC).
 */


(function(tool){
//////////////////////////////////////////////////////////////////////////////

function _datetime(){
    var self = this;
    var testType = tool.get('util.type');

    this.pack = function(date){
        if(!Boolean(date)) return new Uint16Array([0]).buffer;

        if(!testType(date).isDate())
            if(testType(date).isString()){
                try{
                    date = new Date(date);
                } catch(e){
                    throw new Error('invalid-parameter');
                };
            } else
                throw new Error('invalid-parameter');

        var dYear = date.getUTCFullYear() & 0xFFFF,
            dMonth = (date.getUTCMonth() + 1) & 0xFF,
            dDate = date.getUTCDate() & 0xFF,
            dHour = date.getUTCHours() & 0xFF,
            dMinute = date.getUTCMinutes() & 0xFF,
            dSecond = date.getUTCSeconds() & 0xFF;

        // the 0 year is reserved for displaying 'no date specified'.
        if(0 == dYear) throw new Error('invalid-parameter');

        var buf = tool.get('util.buffer').concat([
            new Uint16Array([dYear]).buffer,
            new Uint8Array([dMonth, dDate, dHour, dMinute, dSecond]).buffer,
        ]);

        return buf;
    };

    this.unpack = function(buf){
        var dYear = new Uint16Array(buf.slice(0, 2))[0];
        if(0 == dYear){
            buf = buf.slice(2);
            return [null, buf];
        };

        var dMonth = new Uint8Array(buf.slice(2, 3))[0],
            dDate = new Uint8Array(buf.slice(3, 4))[0],
            dHour = new Uint8Array(buf.slice(4, 5))[0],
            dMinute = new Uint8Array(buf.slice(5, 6))[0],
            dSecond = new Uint8Array(buf.slice(6, 7))[0];
        buf = buf.slice(7);

        var ret = new Date();

        ret.setUTCMilliseconds(0);
        ret.setUTCSeconds(dSecond);
        ret.setUTCMinutes(dMinute);
        ret.setUTCHours(dHour);
        ret.setUTCDate(dDate);
        ret.setUTCMonth(dMonth);
        ret.setUTCFullYear(dYear);

        return [ret, buf];
    };

    return this;
};


tool.set('util.serialize.datetime', function(regtree){
    regtree["datetime"] = function(){return new _datetime();};
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
