/*
 * Wrapper of accessing the storage with localStorage-compatiable API
 * ==================================================================
 *
 * This is a wrapper to access the localStorage using the standard API defined
 * by W3C. It is meant to provide more convenient structural management of
 * data, e.g.  tables, notes, etc.
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function wrapper(storage){
    var self = this;
    
    this.all = function(){
        var ret = [], key;
        for(var i=0; i<storage.length; i++){
            key = storage.key(i);
            if('value.' === key.slice(0, 6)) ret[i] = key.slice(6);
        };
        return ret;
    };

    function operator(mappedKey, data){
        if(undefined === data){
            try{
                return JSON.parse(storage.getItem(mappedKey));
            } catch(e){
                return null;
            };
        } else if(null === data){
            storage.removeItem(mappedKey);
            return self;
        } else {
            console.log('data set:', mappedKey, JSON.stringify(data))
            storage.setItem(mappedKey, JSON.stringify(data));
            return self;
        };
    };

    this.value = function(key, data){
        if(!/^[0-9a-z\-_]+$/i.test(key)) throw new Error('Invalid key');
        var mappedKey = 'value.' + key;
        return operator(mappedKey, data);
    };

    this.note = function(key, noteKey, data){
        if(!/^[0-9a-z\-_]+$/i.test(key)) throw new Error('Invalid key');
        if(!/^[0-9a-z\-_]+$/i.test(noteKey)) throw new Error('Invalid note key');
        var mappedKey = 'note.' + key + '.' + noteKey;
        return operator(mappedKey, data);
    };

    return this;
};

//////////////////////////////////////////////////////////////////////////////
tool.set('enigma.interface.storage', function(p){return new wrapper(p);});
})(tool);
