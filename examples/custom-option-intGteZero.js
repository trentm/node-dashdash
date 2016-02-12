#!/usr/bin/env node
/*
 * As of version 1.13.0, dashdash changed the meaning of 'positiveInteger'
 * to NOT accept zero. This example shows how to add a custom option type
 * that supports the old behaviour, if needed.
 */

var path = require('path');
var format = require('util').format;

var dashdash = require('../lib/dashdash');


function parseIntGteZero(option, optstr, arg) {
    var num = Number(arg);
    if (!/^[0-9]+$/.test(arg) || isNaN(num)) {
        throw new Error(format('arg for "%s" is not an integer >=0: "%s"',
            optstr, arg));
    }
    return num;
}

dashdash.addOptionType({
    name: 'intGteZero',
    takesArg: true,
    helpArg: 'INT',
    parseArg: parseIntGteZero
});


// --- example parsing using intGteZero type

var options = [
    { names: ['num', 'n'], type: 'intGteZero' }
];

try {
    var opts = dashdash.parse({options: options});
} catch (e) {
    console.error('%s: error: %s', path.basename(process.argv[1]), e.message);
    process.exit(1);
}

if (opts.num) {
    console.log('num: %d', opts.num);
}
