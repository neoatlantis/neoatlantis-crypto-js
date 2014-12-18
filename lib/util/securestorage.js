/*
 * A secured storage for storing multiple types of JavaScript things
 * =================================================================
 *
 * The storage overlays a HTML5 localStorage, has a slightly different usage
 * from it, in that it has to be decrypted firstly. After that, it turns into a
 * compatible interface like localStorage.
 *
 * You have to specify during initialization a localStorage access point. It
 * may be a browser-based localStorage, or some compatible implementation.
 * 
 * ATTENTION: The key used for encrypting the storage SHOULD be a derivation
 * with some algorithm like PBKDF2 or scrypt! It depends on your
 * implementation, but you're responsible for making it enough secure with
 * enough bits of security.
 */

(function(tool){
//////////////////////////////////////////////////////////////////////////////

function secureStorage(localStorageInterface){
    var self = this;

    var prefix = 'secureStorage';

    var mainKeyBuf;

    function prefix(p){
        // set prefix for this storage. It may be used to distinguish this
        // piece of storage from others.
        if(!/^[0-9a-z].+$/i.test(prefix)) throw new Error('invalid-prefix');
        prefix = p;
        delete self.prefix;
    };

    function open(key){
        // Assume either the storage of given prefix exists, and use this key
        // to decrypt it, or when not, create one.
        // When existing storage is unable to be decrypted with this key,
        // nothing will be done except an error will be raised.
        // Otherwise, a successful decryption will set this instance with all
        // localStorage-compatible methods. The returned value is a `close`
        // function, which, when called, will revert this state.
        var decryptKeyBuf = tool.get('util.encoding')(key).toArrayBuffer();

        var header = localStorageInterface.getItem(prefix);
        if(null == header) throw new Error('storage-not-exists');

        if(!tool.get('util.type')(header).isString()){
            var mainKeyEncryptor = tool.get('cipher.symmetric')();
            mainKeyEncryptor.key(decryptKeyBuf);
            mainKeyBuf = new tool.get('util.srand')().bytes(128);
            header = tool.get('util.encoding')(
                mainKeyEncryptor.encrypt(mainKeyBuf)
            ).toBase64();
            localStorageInterface.setItem(prefix, header);
        } else {
            try{
                var mainKeyEncryptedBuf = tool.get('util.encoding')(
                    header,
                    'base64'
                ).toArrayBuffer();
                var mainKeyEncryptor = tool.get('cipher.symmetric')();
                mainKeyEncryptor.key(decryptKeyBuf);
                mainKeyBuf = mainKeyEncryptor.decrypt(mainKeyEncryptedBuf);
            } catch(e){
                throw new Error('storage-corrupted');
            };
        };
        var openRet = _open();
        if(!openRet) throw new Error('storage-corrupted');
        
        return function close(){
            openRet._close();
            _close();
        };
    };

    function changeKey(oldKey, newKey){
        // Assume the storage with given prefix exists and is decryptable with
        // oldKey. The encryption key will be replaced with newKey. If storage
        // does not exist, or oldKey is unable to decrypt this storage, nothing
        // will be done except an error will be raised. 
        // This method has no effect on making the `getAccess` method
        // available.
    };


    function _close(){
        mainKeyBuf = null;
        self.open = open;
        self.changeKey = changeKey;
        self.prefix = prefix;
        delete self.setItem;
        delete self.getItem;
        delete self.removeItem;
        delete self.key;
    };

    /*******************************************************************/

    function _storageWorker(){
        var closed = false;
        var ret = {};
        var symcipher = tool.get('cipher.symmetric')();
        symcipher.key(mainKeyBuf);

        var keyList = {};
        function _encryptKey(key){
            if(undefined != keyList[key]) return keyList[key];
            var ret = symcipher.encrypt(key);
            ret = prefix + '-' + tool.get('util.encoding')(ret).toBase32();
            keyList[key] = ret;
            return ret;
        };

        ret.setItem = function(key, value){
            if(closed) throw new Error('storage-closed');
            if(!tool.get('util.type')(key).isString()) 
                throw new Error('invalid-storage-key');
        };

        ret.getItem = function(key){
            if(closed) throw new Error('storage-closed');
            if(!tool.get('util.type')(key).isString()) 
                throw new Error('invalid-storage-key');
        };

        ret._close = function(){
            closed = true;
            symcipher = null;
        };

        return ret;
    };

    function _open(){
        try{
            var workers = new _storageWorker();
        } catch(e){
            return false;
        };

        self.setItem = workers.setItem;
        self.getItem = workers.getItem;
        delete self.open;
        delete self.changeKey;
        delete self.prefix;

        return workers._close;
    };


    _close();

    return this;
};

//////////////////////////////////////////////////////////////////////////////
})(tool);
