#!/usr/bin/env node
/*
 * Small example showing dashdash's "date" option type.
 */

var dashdash = require('../lib/dashdash');

var options = [
    { names: ['start', 's'], type: 'date' },
    { names: ['end', 'e'], type: 'date' }
];

try {
    var opts = dashdash.parse({options: options});
} catch (e) {
    console.error('date.js: error: %s', e.message);
    process.exit(1);
}

if (opts.start) {
    console.log('start at', opts.start.toISOString());
}
if (opts.end) {
    console.log('end at', opts.end.toISOString());
}
