/*
 * Test vectors for the Salsa20 cipher
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

var salsa20 = tool.get('cipher.symmetric.salsa20').raw;

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

    var cipher = new salsa20(rounds, true).key(input.buffer);

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

function testCore(rounds, inputBuf, assertBuf){
    inputBuf = assureBuf(inputBuf);
    assertBuf = assureBuf(assertBuf);
    var cipher = new salsa20(rounds, true);
    var ret = cipher.core(inputBuf);
    return tool.get('util.buffer').equal(ret, assertBuf);
};

//--------------------------------------------------------------------------//

function doSalsaTest(){
    var result = {};

    // core function test #1 according to specification
    result['spec-core-1'] = testCore(
        10,
        new Uint8Array([
            211,159, 13,115, 76, 55, 82,183, 3,117,222, 37,191,187,234,136,
            49,237,179, 48, 1,106,178,219,175,199,166, 48, 86, 16,179,207,
            31,240, 32, 63, 15, 83, 93,161,116,147, 48,113,238, 55,204, 36,
            79,201,235, 79, 3, 81,156, 47,203, 26,244,243, 88,118,104, 54
        ]).buffer,
        new Uint8Array([
            109, 42,178,168,156,240,248,238,168,196,190,203, 26,110,170,154,
            29, 29,150, 26,150, 30,235,249,190,163,251, 48, 69,144, 51, 57,
            118, 40,152,157,180, 57, 27, 94,107, 42,236, 35, 27,111,114,114,
            219,236,232,135,111,155,110, 18, 24,232, 95,158,179, 19, 48,202
        ]).buffer
    );

    // core function test #2 according to specification
    result['spec-core-2'] = testCore(
        10,
        new Uint8Array([
            88,118,104, 54, 79,201,235, 79, 3, 81,156, 47,203, 26,244,243,
            191,187,234,136,211,159, 13,115, 76, 55, 82,183, 3,117,222, 37,
            86, 16,179,207, 49,237,179, 48, 1,106,178,219,175,199,166, 48,
            238, 55,204, 36, 31,240, 32, 63, 15, 83, 93,161,116,147, 48,113
        ]).buffer,
        new Uint8Array([
            179, 19, 48,202,219,236,232,135,111,155,110, 18, 24,232, 95,158,
            26,110,170,154,109, 42,178,168,156,240,248,238,168,196,190,203,
            69,144, 51, 57, 29, 29,150, 26,150, 30,235,249,190,163,251, 48,
            27,111,114,114,118, 40,152,157,180, 57, 27, 94,107, 42,236, 35
        ]).buffer
    );

    // key expansion #1 with 256 bit key according to specification
    result['spec-exp-256'] = testExpansion(
        10,
        new Uint8Array([
            101, 102, 103, 104, 105, 106, 107, 108,
            109, 110, 111, 112, 113, 114, 115, 116
        ]).buffer,
        new Uint8Array([
            1, 2, 3, 4, 5, 6, 7, 8,
            9, 10, 11, 12, 13, 14, 15, 16,
            201, 202, 203, 204, 205, 206, 207, 208,
            209, 210, 211, 212, 213, 214, 215, 216,
        ]).buffer,
        new Uint8Array([
            69, 37, 68, 39, 41, 15,107,193,255,139,122, 6,170,233,217, 98,
            89,144,182,106, 21, 51,200, 65,239, 49,222, 34,215,114, 40,126,
            104,197, 7,225,197,153, 31, 2,102, 78, 76,176, 84,245,246,184,
            177,160,133,130, 6, 72,149,119,192,195,132,236,234,103,246, 74
        ]).buffer
    );

    // key expansion #2 with 128 bit key according to specification
    result['spec-exp-128'] = testExpansion(
        10,
        new Uint8Array([
            101, 102, 103, 104, 105, 106, 107, 108,
            109, 110, 111, 112, 113, 114, 115, 116
        ]).buffer,
        new Uint8Array([
            1, 2, 3, 4, 5, 6, 7, 8,
            9, 10, 11, 12, 13, 14, 15, 16,
        ]).buffer,
        new Uint8Array([
            39,173, 46,248, 30,200, 82, 17, 48, 67,254,239, 37, 18, 13,247,
            241,200, 61,144, 10, 55, 50,185, 6, 47,246,253,143, 86,187,225,
            134, 85,110,246,161,163, 43,235,231, 94,171, 51,145,214,112, 29,
            14,232, 5, 16,151,140,183,141,171, 9,122,181,104,182,177,193
        ]).buffer
    );


    // <https://github.com/alexwebr/salsa20/blob/master/test_vectors.256>

    result['aug-exp-256-1.0'] = testExpansion(
        10,
        '0000000000000000',
        '80000000000000000000000000000000' +
        '00000000000000000000000000000000',
        'E3BE8FDD8BECA2E3EA8EF9475B29A6E7003951E1097A5C38D23B7A5FAD9F6844' +
        'B22C97559E2723C7CBBD3FE4FC8D9A0744652A83E72A9C461876AF4D7EF1A117'
    );

    result['aug-exp-256-2.252'] = testExpansion(
        10,
        '0000000000000000',
        'FCFCFCFCFCFCFCFCFCFCFCFCFCFCFCFC' +
        'FCFCFCFCFCFCFCFCFCFCFCFCFCFCFCFC',
        '356DD71DBC2B216B7A439E07BCC1348F769F7EF482486C92E8FD8EB050224838' +
        'AB1F4DFCD2FB196AFD4C4FFBF51B91246BF45AE8131B8D5CAFA29FC3025A3597'
    );

    result['aug-exp-256-6.0'] = testExpansion(
        10,
        '0D74DB42A91077DE',
        '0053A6F94C9FF24598EB3E91E4378ADD' +
        '3083D6297CCF2275C81B6EC11467BA0D',
        'F5FAD53F79F9DF58C4AEA0D0ED9A9601F278112CA7180D565B420A48019670EA' +
        'F24CE493A86263F677B46ACE1924773D2BB25571E1AA8593758FC382B1280B71'
    );

    result['aug-exp-256-6.2'] = testExpansion(
        10,
        '1F86ED54BB2289F0',
        '0A5DB00356A9FC4FA2F5489BEE4194E7' +
        '3A8DE03386D92C7FD22578CB1E71C417',
        '3FE85D5BB1960A82480B5E6F4E965A4460D7A54501664F7D60B54B06100A37FF' +
        'DCF6BDE5CE3F4886BA77DD5B44E95644E40A8AC65801155DB90F02522B644023'
    );


    // <https://github.com/alexwebr/salsa20/blob/master/test_vectors.128>

    result['aug-exp-128-1.0'] = testExpansion(
        10,
        '0000000000000000',
        '80000000000000000000000000000000',
        '4DFA5E481DA23EA09A31022050859936DA52FCEE218005164F267CB65F5CFD7F' +
        '2B4F97E0FF16924A52DF269515110A07F9E460BC65EF95DA58F740B7D1DBB0AA'
    );

    result['aug-exp-128-1.18'] = testExpansion(
        10,
        '0000000000000000',
        '00002000000000000000000000000000',
        'BACFE4145E6D4182EA4A0F59D4076C7E83FFD17E7540E5B7DE70EEDDF9552006' +
        'B291B214A43E127EED1DA1540F33716D83C3AD7D711CD03251B78B2568F2C844'
    );

    result['aug-exp-128-2.18'] = testExpansion(
        10,
        '0000000000000000',
        '12121212121212121212121212121212',
        '05835754A1333770BBA8262F8A84D0FD70ABF58CDB83A54172B0C07B6CCA5641' +
        '060E3097D2B19F82E918CB697D0F347DC7DAE05C14355D09B61B47298FE89AEB'
    );

    result['aug-exp-128-6.2'] = testExpansion(
        10,
        '1F86ED54BB2289F0',
        '0A5DB00356A9FC4FA2F5489BEE4194E7',
        '8B354C8F8384D5591EA0FF23E7960472B494D04B2F787FC87B6569CB9021562F' +
        'F5B1287A4D89FB316B69971E9B861A109CF9204572E3DE7EAB4991F4C7975427'
    );


    // test with aug-exp-256-1.0 but with multiple blocks

    result['aug-exp-256-1.0-multiple'] = testExpansion(
        10,
        '0000000000000000',
        '80000000000000000000000000000000' +
        '00000000000000000000000000000000',
        'E3BE8FDD8BECA2E3EA8EF9475B29A6E7003951E1097A5C38D23B7A5FAD9F6844' + // 000-031
        'B22C97559E2723C7CBBD3FE4FC8D9A0744652A83E72A9C461876AF4D7EF1A117' + // 032-063
        '8da2b74eef1b6283e7e20166abcae538e9716e4669e2816b6b20c5c356802001' + // 064-095
        'cc1403a9a117d12a2669f456366d6ebb0f1246f1265150f793cdb4b253e348ae' + // 096-127
        '203d89bc025e802a7e0e00621d70aa36b7e07cb1e7d5b38d5e222b8b0e4b8407' + // 128-159
        '0142b1e29504767d76824850320b5368129fdd74e861b498e3be8d16f2d7d169' + // 160-191
        '57BE81F47B17D9AE7C4FF15429A73E10ACF250ED3A90A93C711308A74C6216A9' + // 192-223
        'ED84CD126DA7F28E8ABF8BB63517E1CA98E712F4FB2E1A6AED9FDC73291FAA17' + // 224-255
        '958211C4BA2EBD5838C635EDB81F513A91A294E194F1C039AEEC657DCE40AA7E' + // 256-287
        '7C0AF57CACEFA40C9F14B71A4B3456A63E162EC7D8D10B8FFB1810D71001B618'   // 288-319
    );


    return result;
};

function evalSalsaTest(v){
    for(var i in v) if(false == v[i]) return false;
    return true;
};


tool.set('test.salsa20', {
    exec: doSalsaTest,
    eval: evalSalsaTest,
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
