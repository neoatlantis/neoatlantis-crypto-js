/*
 * Self test of the hashing algorithm
 */



(function(tool){
//////////////////////////////////////////////////////////////////////////////

function getTests(){
    var tests = {
        'iso-1': {
            input: new Uint8Array(0).buffer,
            result:
                '19FA61D75522A466 9B44E39C1D2E1726 C530232130D407F8' +
                '9AFEE0964997F7A7 3E83BE698B288FEB CF88E3E03C4F0757' +
                'EA8964E59B63D937 08B138CC42A66EB3'
        },
        'iso-2': {
            input: tool.get('util.encoding')('a', 'ascii').toArrayBuffer(),
            result:
                '8ACA2602792AEC6F 11A67206531FB7D7 F0DFF59413145E69' +
                '73C45001D0087B42 D11BC645413AEFF6 3A42391A39145A59' +
                '1A92200D560195E5 3B478584FDAE231A'
        },
        'iso-3': {
            input: tool.get('util.encoding')('abc', 'ascii').toArrayBuffer(),
            result:
                '4E2448A4C6F486BB 16B6562C73B4020B F3043E3A731BCE72' +
                '1AE1B303D97E6D4C 7181EEBDB6C57E27 7D0E34957114CBD6' +
                'C797FC9D95D8B582 D225292076D4EEF5'
        },
        'iso-4': {
            input: tool.get('util.encoding')(
                'message digest',
                'ascii'
            ).toArrayBuffer(),
            result:
                '378C84A4126E2DC6 E56DCC7458377AAC 838D00032230F53C' +
                'E1F5700C0FFB4D3B 8421557659EF55C1 06B4B52AC5A4AAA6' +
                '92ED920052838F33 62E86DBD37A8903E'
        },
        'iso-5': {
            input: tool.get('util.encoding')(
                'abcdefghijklmnopqrstuvwxyz',
                'ascii'
            ).toArrayBuffer(),
            result:
                'F1D754662636FFE9 2C82EBB9212A484A 8D38631EAD4238F5' +
                '442EE13B8054E41B 08BF2A9251C30B6A 0B8AAE86177AB4A6' +
                'F68F673E7207865D 5D9819A3DBA4EB3B',
        },
        'iso-6': {
            input: tool.get('util.encoding')(
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                'ascii'
            ).toArrayBuffer(),
            result:
                'DC37E008CF9EE69B F11F00ED9ABA2690 1DD7C28CDEC066CC' +
                '6AF42E40F82F3A1E 08EBA26629129D8F B7CB57211B9281A6' +
                '5517CC879D7B9621 42C65F5A7AF01467',
        },
        'iso-7': {
            input: tool.get('util.encoding')(
                '1234567890123456789012345678901234567890' +
                '1234567890123456789012345678901234567890',
                'ascii'
            ).toArrayBuffer(),
            result:
                '466EF18BABB0154D 25B9D38A6414F5C0 8784372BCCB204D6' +
                '549C4AFADB601429 4D5BD8DF2A6C44E5 38CD047B2681A51A' +
                '2C60481E88C5A20B 2C2A80CF3A9A083B',
        },
        'iso-8': {
            input: tool.get('util.encoding')(
                'abcdbcdecdefdefgefghfghighijhijk',
                'ascii'
            ).toArrayBuffer(),
            result:
                '2A987EA40F917061 F5D6F0A0E4644F48 8A7A5A52DEEE6562' +
                '07C562F988E95C69 16BDC8031BC5BE1B 7B947639FE050B56' +
                '939BAAA0ADFF9AE6 745B7B181C3BE3FD'
        },
        'wiki-dog': {
            input: tool.get('util.encoding')(
                '54686520717569636b2062726f776e20666f78206a7' +
                '56d7073206f76657220746865206c617a7920646f67',
                'hex'
            ).toArrayBuffer(),
            result:
                'B97DE512E91E3828B40D2B0FDCE9CEB3C4A71F9BEA8' +
                'D88E75C4FA854DF36725FD2B52EB6544EDCACD6F8BE' +
                'DDFEA403CB55AE31F03AD62A5EF54E42EE82C3FB35',
        },
        'wiki-eog': {
            input: tool.get('util.encoding')(
                '54686520717569636b2062726f776e20666f78206a7' +
                '56d7073206f76657220746865206c617a7920656f67',
                'hex'
            ).toArrayBuffer(),
            result:
                'C27BA124205F72E6847F3E19834F925CC666D097416' +
                '7AF915BB462420ED40CC50900D85A1F923219D83235' +
                '7750492D5C143011A76988344C2635E69D06F2D38C'
        }
    };

    tests['iso-9'] = {};
    tests['iso-9']['input'] = new Uint8Array(1000000);
    for(var i=0; i<1000000; i++) tests['iso-9']['input'][i] = 0x61; // 'a'
    tests['iso-9']['input'] = tests['iso-9']['input'].buffer;
    tests['iso-9']['result'] =
        '0C99005BEB57EFF5 0A7CF005560DDF5D 29057FD86B20BFD6 2DECA0F1CCEA4AF5' +
        '1FC15490EDDC47AF 32BB2B66C34FF9AD 8C6008AD677F7712 6953B226E4ED8B01'
    ;

    return tests;
};

// ------------------------------------------------------------------------ //

function doHashTest(){
    var tests = getTests();
    var hashgen = tool.get('hash');
    var result = {};
    for(var item in tests){
        var output = tests[item].result.replace(/[^0-9a-f]/gi, '');
        var hash = new hashgen().hash(tests[item]['input']).hex;
        result[item] = Boolean(hash.toLowerCase() === output.toLowerCase());
    };
    return result;
};

function evalHashTest(v){
    for(var i in v) if(false == v[i]) return false;
    return true;
};


tool.set('test.hash', {
    exec: doHashTest,
    eval: evalHashTest,
});

//////////////////////////////////////////////////////////////////////////////
})(tool);
