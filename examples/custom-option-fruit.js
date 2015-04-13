#!/usr/bin/env node
/*
 * Example showing adding a custom option type **with a default value**
 * to dashdash's parsing.
 *
 *
 * Here we'll add a 'fruit' option type, with 'apple' as the default.
 */

var path = require('path');
var format = require('util').format;
var dashdash = require('../lib/dashdash');


var fruits = [
    'apple',
    'pear',
    'cherry',
    'strawberry',
    'banana'
];
function parseFruit(option, optstr, arg) {
    if (fruits.indexOf(arg) === -1) {
        throw new Error(format('arg for "%s" is not a known fruit: "%s"',
            optstr, arg));
    }
    return arg;
}

// Here we add the new 'fruit' option type to dashdash's set.
dashdash.addOptionType({
    name: 'fruit',
    takesArg: true,
    helpArg: 'FRUIT',
    parseArg: parseFruit,
    default: 'apple'
});


var options = [
    {
        names: ['help', 'h'],        // first name is opts key
        type: 'bool',
        help: 'Print this help and exit.'
    },
    { names: ['pie', 'p'], type: 'fruit', env: 'FRUIT' }
];

var parser = dashdash.createParser({options: options});
try {
    var opts = parser.parse(process.argv);
} catch (e) {
    console.error('%s: error: %s', path.basename(process.argv[1]), e.message);
    process.exit(1);
}

if (opts.help) {
    var help = parser.help({
        includeEnv: true,
        includeDefault: true
    }).trimRight();
    console.log('usage: node custom-option-fruit.js [OPTIONS]\n'
                + 'options:\n'
                + help);
    process.exit(0);
}

console.log('pie fruit: %s', opts.pie);
