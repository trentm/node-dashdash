/*
 * dashdash tests
 */

var DEBUG = false;
if (DEBUG) {
    var debug = console.warn;
} else {
    var debug = function () {};
}

var format = require('util').format;


// node-tap API
if (require.cache[__dirname + '/tap4nodeunit.js'])
    delete require.cache[__dirname + '/tap4nodeunit.js'];
var tap4nodeunit = require('./tap4nodeunit.js');
var after = tap4nodeunit.after;
var before = tap4nodeunit.before;
var test = tap4nodeunit.test;

var dashdash = require('../lib/dashdash');


// ---- tests

before(function (next) {
    next();
});

test('exports', function (t) {
    t.ok(dashdash.parse, 'dashdash.parse');
    t.ok(dashdash.Parser, 'dashdash.Parser');
    t.end();
});

var cases = [
    // no opts
    {
        options: [],
        argv: 'node tool.js',
        expect: {
            _: []
        }
    },
    {
        options: [],
        argv: 'node tool.js a b c',
        expect: {
            _: ['a', 'b', 'c']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a b',
        expect: {
            _: ['a', 'b']
        }
    },

    // '--'
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js -- a',
        expect: {
            _: ['a']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a -- b',
        expect: {
            _: ['a', 'b']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a -- --help',
        expect: {
            _: ['a', '--help']
        }
    },

    // '--long-opt'
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js --help',
        expect: {
            help: true,
            _: []
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js --help a b',
        expect: {
            help: true,
            _: ['a', 'b']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a --help b',
        expect: {
            help: true,
            _: ['a', 'b']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a --help b',
        interspersed: true,
        expect: {
            help: true,
            _: ['a', 'b']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js a --help b',
        interspersed: false,
        expect: {
            _: ['a', '--help', 'b']
        }
    },
    {
        options: [{name: 'help', type: Boolean}],
        argv: 'node tool.js --help=foo',
        expect: /argument given to .* option that does not take one/,
    },
    {
        options: [{name: 'file', type: String}],
        argv: 'node tool.js --file',
        expect: /do not have enough args/
    },
    {
        options: [{name: 'file', type: String, default: '/dev/null'}],
        argv: 'node tool.js',
        expect: {
            file: '/dev/null',
            _: []
        }
    },
    {
        options: [{name: 'file', type: String}],
        argv: 'node tool.js --file foo.txt',
        expect: {
            file: 'foo.txt',
            _: []
        }
    },
    {
        options: [{name: 'file', type: String}],
        argv: 'node tool.js --file=foo.txt',
        expect: {
            file: 'foo.txt',
            _: []
        }
    },

    // short opts
    {
        options: [{name: 'h', type: Boolean}],
        argv: 'node tool.js -',
        expect: {
            _: ['-']
        }
    },
    {
        options: [{name: 'h', type: Boolean}],
        argv: 'node tool.js -h',
        expect: {
            h: true,
            _: []
        }
    },
    {
        options: [{name: 'f', type: String}],
        argv: 'node tool.js -f',
        expect: /do not have enough args/
    },
    {
        options: [{name: 'f', type: String}],
        argv: 'node tool.js -f foo.txt',
        expect: {
            f: 'foo.txt',
            _: []
        }
    },
    {
        options: [{name: 'f', type: String}],
        argv: 'node tool.js -ffoo.txt',
        expect: {
            f: 'foo.txt',
            _: []
        }
    },
    {
        options: [{name: 'l', type: Boolean},
                  {names: ['all', 'a'], type: Boolean}],
        argv: 'node ls.js -l -a dir',
        expect: {
            l: true,
            all: true,
            _: ['dir']
        }
    },
    {
        options: [{name: 'l', type: Boolean},
                  {names: ['all', 'a'], type: Boolean}],
        argv: 'node ls.js -l dir -a',
        expect: {
            l: true,
            all: true,
            _: ['dir']
        }
    },
    {
        options: [{name: 'l', type: Boolean},
                  {names: ['all', 'a'], type: Boolean}],
        argv: 'node ls.js -l dir -a',
        interspersed: false,
        expect: {
            l: true,
            _: ['dir', '-a']
        }
    },
    {
        options: [{name: 'l', type: Boolean},
                  {names: ['all', 'a'], type: Boolean}],
        argv: 'node ls.js -la dir',
        expect: {
            l: true,
            all: true,
            _: ['dir']
        }
    },
];
cases.forEach(function (c, i) {
    var expect = c.expect;
    delete c.expect;
    if (typeof c.argv === 'string') {
        c.argv = c.argv.split(/\s+/);
    }
    test(format('case %d: %s', i, c.argv.join(' ')), function (t) {
        debug('--', i)
        debug('c: %j', c)
        var opts;
        if (expect instanceof RegExp) {
            var error = null;
            try {
                opts = dashdash.parse(c);
            } catch (e) {
                error = e;
                t.ok(expect.test(e.message), format(
                    'error message did not match %s: "%s"',
                    expect, e.message));
            }
            t.ok(error, 'got an expected error');
        } else {
            opts = dashdash.parse(c);
            debug('opts: %j', opts)
            t.deepEqual(opts, expect);
        }
        t.end();
    });
});
