#!/usr/bin/env node
/*
 * Example showing adding a custom option type to dashdash's parsing.
 *
 * Here we'll add a 'duration' option type. It supports durations specified
 * like this:
 *      1h          meaning 1 hour
 *      5m          meaning 5 minutes
 *      2d          meaning 2 days
 *      12s         meaning 12 seconds
 *
 * For simplicity, our first cut doesn't support multiple scopes. E.g. we
 * don't support "1h25m".
 *
 * The value of the parsed option is a number of milliseconds (that could
 * then be added/subtracted from a current Date).
 */

var path = require('path');
var format = require('util').format;
var dashdash = require('../lib/dashdash');


var durationRe = /^([1-9]\d*)([smhd])$/;
function parseDuration(option, optstr, arg) {
    var d;
    var match = durationRe.exec(arg);
    if (!match) {
        throw new Error(format('arg for "%s" is not a valid duration: "%s"',
            optstr, arg));
    }
    var num = match[1];
    var scope = match[2];
    var t = 0;
    switch (scope) {
        case 's':
            t += num * 1000;
            break;
        case 'm':
            t += num * 60 * 1000;
            break;
        case 'h':
            t += num * 60 * 60 * 1000;
            break;
        case 'd':
            t += num * 24 * 60 * 60 * 1000;
            break;
    }
    return t;
}

// Here we add the new 'duration' option type to dashdash's set.
dashdash.addOptionType({
    name: 'duration',
    takesArg: true,
    helpArg: 'DURATION',
    parseArg: parseDuration
});


var options = [
    { names: ['time', 't'], type: 'duration' }
];

try {
    var opts = dashdash.parse({options: options});
} catch (e) {
    console.error('%s: error: %s', path.basename(process.argv[1]), e.message);
    process.exit(1);
}

if (opts.time) {
    console.log('duration: %d ms', opts.time);
}
