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


// ---- globals

var TEST_FILTER = process.env.TEST_FILTER;


// ---- support stuff

function parseYesNo(option, optstr, arg) {
    var argLower = arg.toLowerCase()
    if (~['yes', 'y'].indexOf(argLower)) {
        return true;
    } else if (~['no', 'n'].indexOf(argLower)) {
        return false;
    } else {
        throw new Error(format(
            'arg for "%s" is not "yes" or "no": "%s"',
            optstr, arg));
    }
}

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


// ---- tests

before(function (next) {
    next();
});

test('exports', function (t) {
    t.ok(dashdash.createParser, 'dashdash.createParser');
    t.ok(dashdash.parse, 'dashdash.parse');
    t.ok(dashdash.Parser, 'dashdash.Parser');
    t.end();
});

test('createParser', function (t) {
    var options = [ {name: 'help', type: 'bool'} ];
    var parser = dashdash.createParser({options: options});
    t.ok(parser);
    t.end();
});

test('Parser', function (t) {
    var options = [ {name: 'help', type: 'bool'} ];
    var parser = new dashdash.Parser({options: options});
    t.ok(parser);
    t.end();
});

test('parse', function (t) {
    var options = [ {name: 'help', type: 'bool'} ];
    var argv = 'node tool.js --help'.split(/\s+/g);
    var opts = dashdash.parse({options: options, argv: argv});
    t.ok(opts);
    t.end();
});


test('old Parser.parse() API', function (t) {
    var options = [ {name: 'v', type: 'bool'} ];
    var parser = new dashdash.Parser({options: options});
    var opts = parser.parse('node tool.js -v'.split(/\s+/g));
    t.ok(opts.v);
    opts = parser.parse('-v'.split(/\s+/g), 0);
    t.ok(opts.v);
    t.end();
});


test('slice', function (t) {
    var options = [ {name: 'v', type: 'bool'} ];
    var parser = new dashdash.Parser({options: options});
    var opts = parser.parse({argv: 'node tool.js -v'.split(/\s+/g)});
    t.ok(opts.v);
    t.equal(opts._args.length, 0);
    var opts = parser.parse({argv: '-v'.split(/\s+/g), slice: 0});
    t.ok(opts.v);
    t.equal(opts._args.length, 0);
    t.end();
});


var cases = [
    // no opts
    {
        options: [],
        argv: 'node tool.js',
        expect: {
            _args: []
        }
    },
    {
        options: [],
        argv: 'node tool.js a b c',
        expect: {
            _args: ['a', 'b', 'c']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a b',
        expect: {
            _args: ['a', 'b']
        }
    },

    // '--'
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js -- a',
        expect: {
            _args: ['a']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a -- b',
        expect: {
            _args: ['a', 'b']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a -- --help',
        expect: {
            _args: ['a', '--help']
        }
    },

    // '--long-opt'
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js --help',
        expect: {
            help: true,
            _args: []
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js --help a b',
        expect: {
            help: true,
            _args: ['a', 'b']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a --help b',
        expect: {
            help: true,
            _args: ['a', 'b']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a --help b',
        interspersed: true,
        expect: {
            help: true,
            _args: ['a', 'b']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a --help b',
        interspersed: false,
        expect: {
            _args: ['a', '--help', 'b']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js --help=foo',
        expect: /argument given to .* option that does not take one/,
    },
    {
        options: [ {name: 'file', type: 'string'} ],
        argv: 'node tool.js --file',
        expect: /do not have enough args/
    },
    {
        options: [ {name: 'file', type: 'string', default: '/dev/null'} ],
        argv: 'node tool.js',
        expect: {
            file: '/dev/null',
            _args: []
        }
    },
    {
        options: [ {name: 'file', type: 'string'} ],
        argv: 'node tool.js --file foo.txt',
        expect: {
            file: 'foo.txt',
            _args: []
        }
    },
    {
        options: [ {name: 'file', type: 'string'} ],
        argv: 'node tool.js --file=foo.txt',
        expect: {
            file: 'foo.txt',
            _args: []
        }
    },

    // short opts
    {
        options: [ {name: 'h', type: 'bool'} ],
        argv: 'node tool.js -',
        expect: {
            _args: ['-']
        }
    },
    {
        options: [ {name: 'h', type: 'bool'} ],
        argv: 'node tool.js -h',
        expect: {
            h: true,
            _args: []
        }
    },
    {
        options: [ {name: 'f', type: 'string'} ],
        argv: 'node tool.js -f',
        expect: /do not have enough args/
    },
    {
        options: [ {name: 'f', type: 'string'} ],
        argv: 'node tool.js -f foo.txt',
        expect: {
            f: 'foo.txt',
            _args: []
        }
    },
    {
        options: [ {name: 'f', type: 'string'} ],
        argv: 'node tool.js -ffoo.txt',
        expect: {
            f: 'foo.txt',
            _args: []
        }
    },
    {
        options: [ {name: 'l', type: 'bool'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node ls.js -l -a dir',
        expect: {
            l: true,
            all: true,
            _order: [ {key: 'l', value: true, from: 'argv'},
                {key: 'all', value: true, from: 'argv'} ],
            _args: ['dir']
        }
    },
    {
        options: [ {name: 'l', type: 'bool'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node ls.js -l dir -a',
        expect: {
            l: true,
            all: true,
            _order: [ {key: 'l', value: true, from: 'argv'},
                {key: 'all', value: true, from: 'argv'} ],
            _args: ['dir']
        }
    },
    {
        options: [ {name: 'l', type: 'bool'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node ls.js -l dir -a',
        interspersed: false,
        expect: {
            l: true,
            _order: [ {key: 'l', value: true, from: 'argv'} ],
            _args: ['dir', '-a']
        }
    },
    {
        options: [ {name: 'l', type: 'bool'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node ls.js -la dir',
        expect: {
            l: true,
            all: true,
            _args: ['dir']
        }
    },

    {
        options: [ {name: 'f', type: 'string'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node tool.js -af',
        expect: /do not have enough args/
    },
    {
        options: [ {name: 'f', type: 'string'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node tool.js -af foo.txt',
        expect: {
            all: true,
            f: 'foo.txt',
            _args: []
        }
    },
    {
        options: [ {name: 'f', type: 'string'},
                   {names: ['all', 'a'], type: 'bool'} ],
        argv: 'node tool.js -affoo.txt',
        expect: {
            all: true,
            f: 'foo.txt',
            _args: []
        }
    },

    {
        options: [ {name: 'f', type: 'string'},
                   {name: 'v', type: 'arrayOfBool'} ],
        argv: 'node tool.js -v -vvf',
        expect: /do not have enough args/
    },
    {
        options: [ {name: 'f', type: 'string'},
                   {name: 'v', type: 'arrayOfBool'} ],
        argv: 'node tool.js -v -vvf foo.txt',
        expect: {
            v: [true, true, true],
            f: 'foo.txt',
            _args: []
        }
    },
    {
        options: [ {name: 'f', type: 'string'},
                   {name: 'v', type: 'arrayOfBool'} ],
        argv: 'node tool.js -v -vvffoo.txt',
        expect: {
            v: [true, true, true],
            f: 'foo.txt',
            _args: []
        }
    },

    // type=number
    {
        options: [
            {name: 'a', type: 'number'},
            {name: 'b', type: 'number'},
            {name: 'c', type: 'number'},
            {name: 'd', type: 'number'},
            {name: 'e', type: 'number'},
            ],
        argv: 'node tool.js -a 5 -b4 -c -1 -d -3.14159 -e 1.0e42 foo',
        expect: {
            a: 5,
            b: 4,
            c: -1,
            d: -3.14159,
            e: 1.0e42,
            _args: ['foo']
        }
    },
    {
        options: [ {names: ['timeout', 't'], type: 'number'} ],
        argv: 'node tool.js -t 5a',
        /* JSSTYLED */
        expect: /arg for "-t" is not a number/
    },

    // type: arrayOf*
    {
        options: [ {names: ['verbose', 'v'], type: 'arrayOfBool'} ],
        argv: 'node tool.js -vvv foo bar',
        expect: {
            verbose: [true, true, true],
            _args: ['foo', 'bar']
        }
    },
    {
        options: [ {names: ['verbose', 'v'], type: 'arrayOfBool'} ],
        argv: 'node tool.js foo bar',
        expect: {
            // verbose: undefined,
            _args: ['foo', 'bar']
        }
    },
    {
        options: [ {names: ['weapon', 'w'], type: 'arrayOfString'} ],
        argv: 'node tool.js -w club --weapon mallet -w sword bang',
        expect: {
            weapon: ['club', 'mallet', 'sword'],
            _args: ['bang']
        }
    },
    {
        options: [ {names: ['split', 's'], type: 'arrayOfNumber'} ],
        argv: 'node tool.js --split 10 -s 5 -s 0.01 bang',
        expect: {
            split: [10, 5, 0.01],
            _args: ['bang']
        }
    },

    // help
    {
        options: [
            {names: ['help', 'h'], type: 'bool', help: 'Show help and exit.'}
        ],
        argv: 'node tool.js --help',
        expectHelp: /-h, --help\s+Show help and exit./
    },
    {
        options: [
            { names: ['help', 'h'], type: 'bool' },
            { group: 'first group' },
            { names: [ 'first-one', 'f' ], type: 'bool' },
            { names: [ 'first-two', 'F' ], type: 'bool' },
            { group: 'second group' },
            { names: [ 'second-one', 's' ], type: 'bool' },
            { names: [ 'second-two', 'S' ], type: 'bool' },
        ],
        argv: 'node option-groups-tool.js --help',
        expectHelp: [
            /--help\n\n\s\sfirst group:/m,
            /^\s\sfirst group:\n\s\s\s\s-f, --first-one$/m,
            /first-two\n\n\s\ssecond group:\n\s\s\s\s-s, --second-one$/m,
        ]
    },

    // integer
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 0',
        expect: { t: 0, _args: [] }
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 42',
        expect: { t: 42, _args: [] }
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t42',
        expect: { t: 42, _args: [] }
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t -5',
        expect: { t: -5, _args: [] }
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t-5',
        expect: { t: -5, _args: [] }
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 1e2',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 0x32',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 3.1',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 42.',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },
    {
        options: [ {name: 't', type: 'integer'} ],
        argv: 'node tool.js -t 1e-2',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },
    {
        options: [ {name: 't', type: 'arrayOfInteger'} ],
        argv: 'node tool.js',
        expect: { _args: [] }
    },
    {
        options: [ {name: 't', type: 'arrayOfInteger'} ],
        argv: 'node tool.js -t 42',
        expect: { t: [42], _args: [] }
    },
    {
        options: [ {name: 't', type: 'arrayOfInteger'} ],
        argv: 'node tool.js -t 1 -t 2 -t -3',
        expect: { t: [1, 2, -3], _args: [] }
    },
    {
        options: [ {name: 't', type: 'arrayOfInteger'} ],
        argv: 'node tool.js -t 1 -t 1e2',
        /* JSSTYLED */
        expect: /arg for "-t" is not an integer/
    },

    // positiveInteger
    {
        options: [ {name: 't', type: 'positiveInteger'} ],
        argv: 'node tool.js -t 0',
        expect: { t: 0, _args: [] }
    },
    {
        options: [ {name: 't', type: 'positiveInteger'} ],
        argv: 'node tool.js -t 42',
        expect: { t: 42, _args: [] }
    },
    {
        options: [ {name: 't', type: 'positiveInteger'} ],
        argv: 'node tool.js -t42',
        expect: { t: 42, _args: [] }
    },
    {
        options: [ {name: 't', type: 'positiveInteger'} ],
        argv: 'node tool.js -t -5',
        /* JSSTYLED */
        expect: /arg for "-t" is not a positive integer/
    },
    {
        options: [ {name: 't', type: 'arrayOfPositiveInteger'} ],
        argv: 'node tool.js -t42',
        expect: { t: [42], _args: [] }
    },
    {
        options: [ {name: 't', type: 'arrayOfPositiveInteger'} ],
        argv: 'node tool.js -t 42 -t -5',
        /* JSSTYLED */
        expect: /arg for "-t" is not a positive integer/
    },

    // env
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'bool'} ],
        argv: 'node foo.js -v',
        /* JSSTYLED */
        expect: {
            v: true,
            _args: [],
            _order: [ {key: 'v', value: true, from: 'argv'} ]
        }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'bool'} ],
        argv: 'node foo.js -v',
        env: {FOO_VERBOSE: '1'},
        /* JSSTYLED */
        expect: {
            v: true,
            _args: [],
            _order: [ {key: 'v', value: true, from: 'argv'} ]
        }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'bool'} ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: '1'},
        expect: {
            v: true,
            _args: [],
            _order: [ {key: 'v', value: true, from: 'env'} ]
        }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'bool'} ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: '0'},
        expect: {
            v: false,
            _args: [],
            _order: [ {key: 'v', value: false, from: 'env'} ]
        }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'bool'} ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: ''},
        /* JSSTYLED */
        expect: { _args: [] }
    },

    // env help
    {
        options: [
            {names: ['a'], type: 'string', env: 'A', help: 'Phrase'},
            {names: ['b'], type: 'string', env: 'B', help: 'Sentence.'},
            {names: ['c'], type: 'string', env: 'C', help: 'Question?'},
            {names: ['d'], type: 'string', env: 'D', help: 'Exclamation!'},
            {names: ['e'], type: 'string', env: 'E', help: ' '},
            {names: ['f'], type: 'string', env: 'F', help: ''},
            {names: ['g'], type: 'string', env: 'G'},
            {names: ['h'], type: 'bool', env: 'H'},
        ],
        argv: 'node tool.js --help',
        helpOptions: { includeEnv: true },
        /* BEGIN JSSTYLED */
        expectHelp: [
            /-a ARG\s+Phrase. Environment: A=ARG/,
            /-b ARG\s+Sentence. Environment: B=ARG/,
            /-c ARG\s+Question\? Environment: C=ARG/,
            /-d ARG\s+Exclamation! Environment: D=ARG/,
            /-e ARG\s+Environment: E=ARG/,
            /-f ARG\s+Environment: F=ARG/,
            /-g ARG\s+Environment: G=ARG/,
            /-h\s+Environment: H=1/,
        ]
        /* END JSSTYLED */
    },

    // env (number)
    {
        options: [
            {names: ['timeout', 't'], env: 'FOO_TIMEOUT', type: 'number'}
        ],
        argv: 'node foo.js -t 42',
        env: {},
        /* JSSTYLED */
        expect: { timeout: 42, _args: [] }
    },
    {
        options: [
            {names: ['timeout', 't'], env: 'FOO_TIMEOUT', type: 'number'}
        ],
        argv: 'node foo.js',
        env: {FOO_TIMEOUT: '32'},
        /* JSSTYLED */
        expect: { timeout: 32, _args: [] }
    },
    {
        options: [
            {names: ['timeout', 't'], env: 'FOO_TIMEOUT', type: 'number'}
        ],
        argv: 'node foo.js -t 52',
        env: {FOO_TIMEOUT: '32'},
        /* JSSTYLED */
        expect: { timeout: 52, _args: [] }
    },

    // Test that a validation fail in env throws, but NOT if a valid
    // value is given in CLI opts (i.e. when env is ignored).
    {
        options: [
            {names: ['timeout', 't'], env: 'FOO_TIMEOUT', type: 'number'}
        ],
        argv: 'node foo.js -t 52',
        env: {FOO_TIMEOUT: 'wallawalla'},
        /* JSSTYLED */
        expect: { timeout: 52, _args: [] }
    },
    {
        options: [
            {names: ['timeout', 't'], env: 'FOO_TIMEOUT', type: 'number'}
        ],
        argv: 'node foo.js',
        env: {FOO_TIMEOUT: 'wallawalla'},
        /* JSSTYLED */
        expect: /arg for "FOO_TIMEOUT" is not a number: "wallawalla"/
    },

    // env (arrayOfBool)
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'arrayOfBool'} ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: 'blah'},
        /* JSSTYLED */
        expect: { v: [true], _args: [] }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'arrayOfBool'} ],
        argv: 'node foo.js -v',
        env: {FOO_VERBOSE: 'blah'},
        /* JSSTYLED */
        expect: { v: [true], _args: [] }
    },
    {
        options: [ {name: 'v', env: 'FOO_VERBOSE', type: 'arrayOfBool'} ],
        argv: 'node foo.js -vv',
        env: {FOO_VERBOSE: 'blah'},
        /* JSSTYLED */
        expect: { v: [true, true], _args: [] }
    },

    // key name transformation
    {
        options: [ {names: ['dry-run', 'n'], type: 'bool'} ],
        argv: 'node foo.js --dry-run',
        /* JSSTYLED */
        expect: { dry_run: true, _args: [] }
    },
    {
        options: [ {name: 'foo-bar-', type: 'bool'} ],
        argv: 'node foo.js --foo-bar-',
        /* JSSTYLED */
        expect: { foo_bar_: true, _args: [] }
    },

    // issue #1: 'env' not taking precendence over 'default'
    {
        options: [ {
            names: ['file', 'f'],
            env: 'FOO_FILE',
            'default': 'default.file',
            type: 'string'
        } ],
        argv: 'node foo.js',
        expect: { file: 'default.file', _args: [] }
    },
    {
        options: [ {
            names: ['file', 'f'],
            env: 'FOO_FILE',
            'default': 'default.file',
            type: 'string'
        } ],
        env: {FOO_FILE: 'env.file'},
        argv: 'node foo.js',
        expect: { file: 'env.file', _args: [] }
    },
    {
        options: [ {
            names: ['file', 'f'],
            env: 'FOO_FILE',
            'default': 'default.file',
            type: 'string'
        } ],
        argv: 'node foo.js -f argv.file',
        env: {FOO_FILE: 'env.file'},
        expect: { file: 'argv.file', _args: [] }
    },

    {
        options: [ {
            names: ['verbose', 'v'],
            env: 'FOO_VERBOSE',
            'default': false,
            type: 'bool'
        } ],
        argv: 'node foo.js',
        expect: { verbose: false, _args: [] }
    },
    {
        options: [ {
            names: ['verbose', 'v'],
            env: 'FOO_VERBOSE',
            'default': false,
            type: 'bool'
        } ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: '1'},
        expect: { verbose: true, _args: [] }
    },
    {
        options: [ {
            names: ['verbose', 'v'],
            env: 'FOO_VERBOSE',
            'default': false,
            type: 'bool'
        } ],
        argv: 'node foo.js',
        env: {FOO_VERBOSE: '0'},
        expect: { verbose: false, _args: [] }
    },
    {
        options: [ {
            names: ['verbose', 'v'],
            env: 'FOO_VERBOSE',
            'default': false,
            type: 'bool'
        } ],
        argv: 'node foo.js -v',
        env: {FOO_VERBOSE: '0'},
        expect: { verbose: true, _args: [] }
    },

    // unstrict
    {
        options: [ {name: 'help', type: 'bool'} ],
        argv: 'node tool.js a --help -b --cheese',
        allowUnknown: true,
        expect: {
            help: true,
            _args: ['a', '-b', '--cheese']
        }
    },
    {
        options: [ {name: 'help', type: 'bool'}, {name: 'c', type: 'bool'} ],
        argv: 'node tool.js a -bcd --cheese --help',
        allowUnknown: true,
        expect: {
            help: true,
            _args: ['a', '-bcd', '--cheese']
        }
    },

    // date
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s',
        /* JSSTYLED */
        expect: /do not have enough args for "-s" option/
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s notadate',
        /* JSSTYLED */
        expect: /arg for "-s" is not a valid date format: "notadate"/
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 0',
        expect: { start: new Date(0), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 1',
        expect: { start: new Date(1000), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 1396065084',
        expect: { start: new Date(1396065084000), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01',
        expect: { start: new Date('2014-04-01'), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01T',
        /* JSSTYLED */
        expect: /arg for "-s" is not a valid date format: "2014-04-01T"/
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01T12:01:02',
        expect: { start: new Date('2014-04-01T12:01:02Z'), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01T12:01:02Z',
        expect: { start: new Date('2014-04-01T12:01:02Z'), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01T12:01:02.7',
        expect: { start: new Date('2014-04-01T12:01:02.7Z'), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01T12:01:02.456Z',
        expect: { start: new Date('2014-04-01T12:01:02.456Z'), _args: [] }
    },
    {
        options: [ {names: ['start', 's'], type: 'date'} ],
        argv: 'node foo.js -s 2014-04-01t12:01:02.456z',
        expect: { start: new Date('2014-04-01T12:01:02.456Z'), _args: [] }
    },
    {
        options: [ {names: ['times', 't'], type: 'arrayOfDate'} ],
        argv: 'node foo.js --times 1 -t 2 -t 2014-04-01',
        expect: {
            times: [
                new Date(1000),
                new Date(2000),
                new Date('2014-04-01T00:00:00Z')
            ],
            _args: [] }
    },

    {
        optionTypes: [
            {
                name: 'yesno',
                takesArg: true,
                helpArg: '<yes/no>',
                parseArg: parseYesNo
            }
        ],
        options: [ {names: ['answer', 'a'], type: 'yesno'} ],
        argv: 'node foo.js -a yes',
        expect: {
            answer: true,
            _args: []
        }
    },
    {
        optionTypes: [
            {
                name: 'yesno',
                takesArg: true,
                helpArg: '<yes/no>',
                parseArg: parseYesNo
            }
        ],
        options: [ {names: ['answer', 'a'], type: 'yesno'} ],
        argv: 'node foo.js -a no',
        expect: {
            answer: false,
            _args: []
        }
    },

    // helpWrap option
    {
        options: [
            {
              names: ['opt', 'o'],
              type: 'string',
              env: ['ENVVARIABLE'],
              help: 'long help with\n  newlines' +
                '\n  spaces\n  and such\nwill not render correctly'
            },
            {
              names: ['array', 'a'],
              type: 'string',
              helpWrap: false,
              env: ['OTHERVARIABLE'],
              help: 'long help with\n  newlines' +
                '\n  spaces\n  and such\nwill render correctly'
            },
            {
              names: ['foo'],
              type: 'string',
              helpWrap: false,
              env: ['FOOVAR']
            }
        ],
        argv: 'node helpWrapTool.js --help',
        helpOptions: { includeEnv: true },
        /* BEGIN JSSTYLED */
        expectHelp: [
            /long help with newlines spaces and such will not render/,
            /\. Environment: ENVVARIABLE=ARG/,
            // Without wrapping:
            /long help with$/m,
            /^ +newlines$/m,
            /^ +Environment: OTHERVARIABLE=ARG/m,
            // Ensure FOOVAR env is on *first* line and not after a blank.
            /^ +--foo=ARG +Environment: FOOVAR=ARG$/m
        ]
        /* END JSSTYLED */
    },
    {
        options: [
            {
              names: ['array', 'a'],
              type: 'string',
              env: ['OTHERVARIABLE'],
              help: 'long help with\n  newlines' +
                '\n  spaces\n  and such\nwill render correctly'
            }
        ],
        argv: 'node helpWrapTool2.js --help',
        helpOptions: { includeEnv: true, helpWrap: false },
        /* BEGIN JSSTYLED */
        expectHelp: [
            /long help with$/m,
            /^ +newlines$/m,
            /^ +Environment: OTHERVARIABLE=ARG/m,
        ]
        /* END JSSTYLED */
    },

    // hidden
    {
        options: [
            {names: ['help', 'h'], type: 'bool'},
            {names: ['timeout', 't'], type: 'number', hidden: true},
            {names: ['version'], type: 'bool'},
        ],
        argv: 'node hidden-opts.js --help',
        expectHelp: /-h, --help\n\s+--version/m,
    },

    // optionType.default
    {
        optionTypes: [
            {
                name: 'fruit',
                takesArg: true,
                helpArg: '<fruit>',
                parseArg: parseFruit,
                default: 'apple'
            }
        ],
        options: [ {names: ['pie', 'p'], type: 'fruit'} ],
        argv: 'node foo.js',
        expect: {
            pie: 'apple',
            _args: []
        }
    },
    {
        optionTypes: [
            {
                name: 'fruit',
                takesArg: true,
                helpArg: '<fruit>',
                parseArg: parseFruit,
                default: 'apple'
            }
        ],
        options: [
            {group: 'Filling'},
            {names: ['pie', 'p'], type: 'fruit', env: 'FRUIT'}
        ],
        argv: 'node foo.js -p pear',
        expect: {
            pie: 'pear',
            _args: []
        },
        helpOptions: {
            includeEnv: true,
            includeDefault: true
        },
        /* BEGIN JSSTYLED */
        expectHelp: [
            /^  Filling:$/m,
            / +Environment: FRUIT=<fruit>\. Default: "apple"/m,
        ]
        /* END JSSTYLED */
    },
];

cases.forEach(function (c, num) {
    var expect = c.expect;
    delete c.expect;
    var expectHelps = c.expectHelp;
    if (!Array.isArray(expectHelps)) {
        expectHelps = expectHelps ? [expectHelps] : [];
        for (var i = 0; i < expectHelps.length; i++) {
            if (typeof (expectHelps[i]) === 'string') {
                expectHelps[i] = new RegExp(expectHelps[i]);
            }
        }
    }
    delete c.expectHelp;
    var helpOptions = c.helpOptions;
    delete c.helpOptions;
    var argv = c.argv;
    delete c.argv;
    if (typeof (argv) === 'string') {
        argv = argv.split(/\s+/);
    }
    var env = c.env;
    delete c.env;
    var envStr = '';
    if (env) {
        Object.keys(env).forEach(function (e) {
            envStr += format('%s=%s ', e, env[e]);
        });
    }
    var optionTypes = c.optionTypes;
    delete c.optionTypes;
    if (optionTypes) {
        // WARNING: These are not removed for subsequent tests. That *could*
        // theoretically cause conflicts.
        optionTypes.forEach(function (ot) {
            dashdash.addOptionType(ot);
        });
    }
    var testName = format('case %d: %s%s', num, envStr, argv.join(' '));
    if (TEST_FILTER && !~testName.indexOf(TEST_FILTER)) {
        return;
    }
    test(testName, function (t) {
        debug('--', num)
        debug('c: %j', c)
        var parser = new dashdash.Parser(c);
        var opts;
        if (expect instanceof RegExp) {
            var error = null;
            try {
                opts = parser.parse({argv: argv, env: env});
            } catch (e) {
                error = e;
                t.ok(expect.test(e.message), format(
                    'error message did not match %s: "%s"',
                    expect, e.message));
            }
            t.ok(error, 'expected an error');
        } else if (expect) {
            opts = parser.parse({argv: argv, env: env});
            if (!expect._order) {
                delete opts._order; // don't test it, if not in case data
            }
            debug('opts: %j', opts)
            t.deepEqual(opts, expect);
        }
        if (expectHelps.length) {
            var help = parser.help(helpOptions);
            expectHelps.forEach(function (eH) {
                t.ok(eH.test(help), format(
                    'help did not match %s: "%s"', eH, help));
            });
        }
        t.end();
    });
});
