(function(tool){
//////////////////////////////////////////////////////////////////////////////

var curve25519 = tool.get('cipher.asymmetric.curve25519').constructor;

function toBuf(hex){
    return tool.get('util.encoding')(hex, 'hex').toArrayBuffer();
};

function toHEX(buf){
    return tool.get('util.encoding')(buf).toHEX();
};



function doCurve25519Test(){
    var buddy1 = curve25519();
    var buddy1prvkey = toBuf('0000000000000000000000000000000000000000000000000000000000000003');
    buddy1.setPrivateKey(buddy1prvkey);
    var buddy1pubkey = buddy1.getPublicKey();

    var buddy1pub = curve25519();
    buddy1pub.setPublicKey(buddy1pubkey);
    console.log(toHEX(buddy1pubkey))

    var plaintext = toBuf('deadbeef');

    var buddy1ciphertext = buddy1pub.encrypt(plaintext);

    var decrypttext = buddy1.decrypt(buddy1ciphertext);

    console.log(toHEX(buddy1ciphertext))
    console.log(toHEX(decrypttext));
};

function evalCurve25519Test(){
    return true;
};

tool.set('test.curve25519', {
    exec: doCurve25519Test,
    eval: evalCurve25519Test,
});

/////////////////////////////////////////////////////////////////////////////
})(tool);
