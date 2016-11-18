var test = require('ava');
var OpenT2T = require('opent2t').OpenT2T;
var config = require('./testConfig');

console.log("Config:");
console.log(JSON.stringify(config, null, 2));

var translatorPath = require('path').join(__dirname, '..');
var hubPath = require('path').join(__dirname, '../../../../opent2t.p.hub/com.smartthings.hub/js');
var translator = undefined;
var controllId = undefined;

function getBinarySwitch(devices) {
    for (var i = 0; i < devices.length; i++) {
        var d = devices[i];
        if (d.opent2t.translator === 'opent2t-translator-com-smartthings-binaryswitch') {
            return d;
        }
    }

    return undefined;
}

// setup the translator before all the tests run
test.before(async () => {
    var hubTranslator = await OpenT2T.createTranslatorAsync(hubPath, 'thingTranslator', config);
    var hubInfo = await OpenT2T.invokeMethodAsync(hubTranslator, 'opent2t.p.hub', 'get', [false]);
    var deviceInfo = getBinarySwitch(hubInfo.platforms);
    controllId = deviceInfo.opent2t.controlId;
    translator = await OpenT2T.createTranslatorAsync(translatorPath, 'thingTranslator', {'deviceInfo': deviceInfo, 'hub': hubTranslator});
});

test.serial("Valid Binary Switch Translator", t => {
    t.is(typeof translator, 'object') && t.truthy(translator);
});

///
/// Run a series of tests to validate the translator
///

// Get the entire Lamp schema object unexpanded
test.serial('GetPlatform', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.outlet', 'get', [])
        .then((response) => {
            t.is(response.rt[0], 'opent2t.p.outlet');

            console.log('*** GetPlatform::response: \n' + JSON.stringify(response, null, 2));
        });
});

// Get the entire Lamp schema object expanded
test.serial('GetPlatformExpanded', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.outlet', 'get', [true])
        .then((response) => {
            t.is(response.rt[0], 'opent2t.p.outlet');

            var resource = response.entities[0].resources[0];
            t.is(resource.id, 'power');
            t.is(resource.rt[0], 'oic.r.switch.binary');
            t.true(resource.value !== undefined);

            console.log('*** GetPlatformExpanded::response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('GetPower', t => {
    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.outlet', 'getDevicesPower', [controllId])
        .then((response) => {
            t.is(response.rt[0], 'oic.r.switch.binary');

            console.log('*** GetPower::response: \n' + JSON.stringify(response, null, 2));
        });
});

test.serial('SetPower', t => {
    var power = { 'value': true };

    return OpenT2T.invokeMethodAsync(translator, 'opent2t.p.outlet', 'postDevicesPower', [controllId, power])
        .then((response) => {
            t.is(response.rt[0], 'oic.r.switch.binary');
            t.true(response.value);
            
            console.log('*** SetPower::response: \n' + JSON.stringify(response, null, 2));
        });
});