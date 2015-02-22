#!/usr/bin/env node
/*
 * Example showing adding a custom option type to dashdash's parsing.
 * Here we'll add a 'timeAgo' option type. See the comment below.
 */

var path = require('path');
var format = require('util').format;
var dashdash = require('../lib/dashdash');

/**
 * A 'time' option type that allows either a duration (an amount of time ago):
 *      1h      one hour ago
 *      2d      two days ago
 *      90m     ninety minutes ago
 *      120s    120 seconds ago
 * or a date (another parsable by `new Date()`).
 */
var durationRe = /^([1-9]\d*)([smhd])$/;
function parseTimeAgo(option, optstr, arg) {
    var t;
    var match = durationRe.exec(arg);
    if (match) {
        var num = match[1];
        var scope = match[2];
        var delta = 0;
        switch (scope) {
            case 's':
                delta += num * 1000;
                break;
            case 'm':
                delta += num * 60 * 1000;
                break;
            case 'h':
                delta += num * 60 * 60 * 1000;
                break;
            case 'd':
                delta += num * 24 * 60 * 60 * 1000;
                break;
        }
        t = new Date(Date.now() - delta);
    } else {
        try {
            t = dashdash.parseDate(arg);
        } catch (ex) {
            throw new Error(format('arg for "%s" is not a valid duration ' +
                '(e.g. 1h) or date: "%s"', optstr, arg));
        }
    }
    return t;
}

// Here we add the new 'duration' option type to dashdash's set.
dashdash.addOptionType({
    name: 'timeAgo',
    takesArg: true,
    helpArg: 'TIME',
    parseArg: parseTimeAgo
});



// ---- example usage

var options = [
    { names: ['time', 't'], type: 'timeAgo' }
];

try {
    var opts = dashdash.parse({options: options});
} catch (e) {
    console.error('%s: error: %s', path.basename(process.argv[1]), e.message);
    process.exit(1);
}

if (opts.time) {
    console.log('time (ISO format): %s', opts.time.toISOString());
}
