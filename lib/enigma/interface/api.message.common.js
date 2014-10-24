(function(tool){

tool.set('enigma.interface.api.message.common.loadIdentity',
function (s, fingerprint, pinKey){
    var storage = tool.get('enigma.interface.storage')(s);
    var buf = storage.value(fingerprint),
        isPrivate = storage.note(fingerprint, 'isPrivate') || false;

    if(!buf) return false;
    if(!isPrivate && pinKey) return false;

    buf = tool.get('util.encoding')(buf, 'base64').toArrayBuffer();

    var ret = tool.get('enigma.identity')();

    try{
        if(isPrivate && pinKey)
            ret.loadPrivate(buf, pinKey);
        else
            ret.loadPublic(buf);
    } catch(e){
        console.error('unable to load this identity');
        return false;
    };

    return ret;
});

})(tool);
