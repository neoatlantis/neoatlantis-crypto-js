/*
 * Test vectors for the ChaCha20 cipher
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

var chacha20 = tool.get('cipher.symmetric.chacha20').raw;

var assureBuf = function(v){
    if(tool.get('util.type')(v).isArrayBuffer()) return v;
    return tool.get('util.encoding')(v, 'hex').toArrayBuffer();
};

function testExpansion(rounds, nonceBuf, keyBuf, assertBuf){
    nonceBuf = assureBuf(nonceBuf);
    keyBuf = assureBuf(keyBuf);
    assertBuf = assureBuf(assertBuf);

    var nonceAry = new Uint8Array(nonceBuf);
    var keyAry = new Uint8Array(keyBuf);
    var input = new Uint8Array(8 + keyAry.length);
    for(var i=0; i<8; i++) input[i] = nonceAry[i];
    for(var i=0; i<keyAry.length; i++) input[i+8] = keyAry[i];

    var cipher = new chacha20(rounds, true).key(input.buffer);

    if(nonceBuf.byteLength > 8){
        var counterAry = new Uint32Array(nonceBuf.slice(8,16));
        cipher.seek(counterAry[0], counterAry[1]);
    };

    var ret = cipher.encrypt(assertBuf);
    return tool.get('util.buffer').equal(
        ret,
        new Uint8Array(ret.byteLength).buffer
    );
};

//--------------------------------------------------------------------------//

function doChaChaTest(){
    var result = {};

    // tests over 12 rounds

    result['draft-12-256-1'] = testExpansion(
        12,
        '0000000000000000',
        '00000000000000000000000000000000' +
        '00000000000000000000000000000000',
        '9bf49a6a0755f953811fce125f2683d50429c3bb49e074147e0089a52eae155f' +
        '0564f879d27ae3c02ce82834acfa8c793a629f2ca0de6919610be82f411326be' +
        '0bd58841203e74fe86fc71338ce0173dc628ebb719bdcbcc151585214cc089b4' +
        '42258dcda14cf111c602b8971b8cc843'
    );

    result['draft-12-256-2'] = testExpansion(
        12,
        '0000000000000000',
        '01000000000000000000000000000000' +
        '00000000000000000000000000000000',
        '12056e595d56b0f6eef090f0cd25a20949248c2790525d0f930218ff0b4ddd10' +
        'a6002239d9a454e29e107a7d06fefdfef0210feba044f9f29b1772c960dc29c0' +
        '0c7366c5cbc604240e665eb02a69372a7af979b26fbb78092ac7c4b88029a7c8' +
        '54513bc217bbfc7d90432e308eba15afc65aeb48ef100d5601e6afba257117a9'
    );

    result['draft-12-256-3'] = testExpansion(
        12,
        '1ada31d5cf688221',
        'c46ec1b18ce8a878725a37e780dfb7351f68ed2e194c79fbc6aebee1a667975d',
        '1482072784bc6d06b4e73bdc118bc0103c7976786ca918e06986aa251f7e9cc1' +
        'b2749a0a16ee83b4242d2e99b08d7c20092b80bc466c87283b61b1b39d0ffbab' +
        'd94b116bc1ebdb329b9e4f620db695544a8e3d9b68473d0c975a46ad966ed631' +
        'e42aff530ad5eac7d8047adfa1e5113c91f3e3b883f1d189ac1c8fe07ba5a42b'
    );

    // test over 20 rounds

    result['draft-20-256-1'] = testExpansion(
        20,
        '0000000000000000',
        '01000000000000000000000000000000' +
        '00000000000000000000000000000000',
        'c5d30a7ce1ec119378c84f487d775a8542f13ece238a9455e8229e888de85bbd' +
        '29eb63d0a17a5b999b52da22be4023eb07620a54f6fa6ad8737b71eb0464dac0' +
        '10f656e6d1fd55053e50c4875c9930a33f6d0263bd14dfd6ab8c70521c19338b' +
        '2308b95cf8d0bb7d202d2102780ea3528f1cb48560f76b20f382b942500fceac'
    );

    result['draft-20-256-2'] = testExpansion(
        20,
        '0100000000000000',
        '00000000000000000000000000000000' +
        '00000000000000000000000000000000',
        'ef3fdfd6c61578fbf5cf35bd3dd33b8009631634d21e42ac33960bd138e50d32' +
        '111e4caf237ee53ca8ad6426194a88545ddc497a0b466e7d6bbdb0041b2f586b' +
        '5305e5e44aff19b235936144675efbe4409eb7e8e5f1430f5f5836aeb49bb532' +
        '8b017c4b9dc11f8a03863fa803dc71d5726b2b6b31aa32708afe5af1d6b69058'
    );

    result['draft-20-256-3'] = testExpansion(
        20,
        '1ada31d5cf688221',
        'c46ec1b18ce8a878725a37e780dfb7351f68ed2e194c79fbc6aebee1a667975d',
        'f63a89b75c2271f9368816542ba52f06ed49241792302b00b5e8f80ae9a473af' +
        'c25b218f519af0fdd406362e8d69de7f54c604a6e00f353f110f771bdca8ab92' +
        'e5fbc34e60a1d9a9db17345b0a402736853bf910b060bdf1f897b6290f01d138' +
        'ae2c4c90225ba9ea14d518f55929dea098ca7a6ccfe61227053c84e49a4a3332'
    );


    return result;
};

function evalChaChaTest(v){
    for(var i in v) if(false == v[i]) return false;
    return true;
};


tool.set('test.chacha20', {
    exec: doChaChaTest,
    eval: evalChaChaTest,
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
