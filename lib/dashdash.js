/**
 * dashdash - yet another node.js optional parsing library
 */

var p = console.log;
var format = require('util').format;

var assert = require('assert-plus');

var DEBUG = true;
if (DEBUG) {
    var debug = console.warn;
} else {
    var debug = function () {};
}



// ---- internal support stuff

/**
 * Return a shallow copy of the given object;
 */
function shallowCopy(obj) {
    if (!obj) {
        return (obj);
    }
    var copy = {};
    Object.keys(obj).forEach(function (k) {
        copy[k] = obj[k];
    });
    return (copy);
}


function space(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
        s += ' ';
    }
    return s;
}


/**
 * Return an array of lines wrapping the given text to the given width.
 * This splits on whitespace. Single tokens longer than `width` are not
 * broken up.
 */
function textwrap(s, width) {
    var words = s.trim().split(/\s+/);
    var lines = [];
    var line = '';
    words.forEach(function (w) {
        var newLength = line.length + w.length;
        if (line.length > 0)
            newLength += 1;
        if (newLength > width) {
            lines.push(line);
            line = '';
        }
        if (line.length > 0)
            line += ' ';
        line += w;
    });
    lines.push(line);
    return lines;
}




// ---- Option types

function parseBool(option, optstr, arg) {
    return true;
}

function parseString(option, optstr, arg) {
    assert.string(arg, 'arg');
    return arg;
}

function parseNumber(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (isNaN(num)) {
        optstr = (optstr.length > 1 ? '--'+optstr : '-'+optstr);
        throw new Error(format('arg for "%s" is not a number: "%s"',
            optstr, arg));
    }
    return num;
}

function parseInteger(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (!/^[0-9-]+$/.test(arg) || isNaN(num)) {
        optstr = (optstr.length > 1 ? '--'+optstr : '-'+optstr);
        throw new Error(format('arg for "%s" is not an integer: "%s"',
            optstr, arg));
    }
    return num;
}

function parsePositiveInteger(option, optstr, arg) {
    assert.string(arg, 'arg');
    var num = Number(arg);
    if (!/^[0-9]+$/.test(arg) || isNaN(num)) {
        optstr = (optstr.length > 1 ? '--'+optstr : '-'+optstr);
        throw new Error(format('arg for "%s" is not a positive integer: "%s"',
            optstr, arg));
    }
    return num;
}

var types = {
    bool: {
        takesArg: false,
        parseArg: parseBool
    },
    string: {
        takesArg: true,
        helpArg: 'ARG',
        parseArg: parseString
    },
    number: {
        takesArg: true,
        helpArg: 'NUM',
        parseArg: parseNumber
    },
    integer: {
        takesArg: true,
        helpArg: 'INT',
        parseArg: parseInteger
    },
    positiveInteger: {
        takesArg: true,
        helpArg: 'INT',
        parseArg: parsePositiveInteger
    },
    arrayOfBool: {
        takesArg: false,
        array: true,
        parseArg: parseBool
    },
    arrayOfString: {
        takesArg: true,
        helpArg: 'ARG',
        array: true,
        parseArg: parseString
    },
    arrayOfNumber: {
        takesArg: true,
        helpArg: 'NUM',
        array: true,
        parseArg: parseNumber
    },
    arrayOfInteger: {
        takesArg: true,
        helpArg: 'INT',
        array: true,
        parseArg: parseInteger
    },
    arrayOfPositiveInteger: {
        takesArg: true,
        helpArg: 'INT',
        array: true,
        parseArg: parsePositiveInteger
    },
};



// ---- Parser

function Parser(config) {
    assert.object(config, 'config');
    assert.arrayOfObject(config.options, 'config.options');
    assert.optionalBool(config.interspersed, 'config.interspersed');
    var self = this;

    // Allow interspersed arguments (true by default).
    this.interspersed = (config.interspersed !== undefined
        ? config.interspersed : true);

    this.options = config.options.map(function (o) { return shallowCopy(o); });
    this.optionFromName = {};
    for (var i = 0; i < this.options.length; i++) {
        var o = this.options[i];
        assert.ok(types[o.type],
            format('invalid config.options.%d.type: "%s" in %j',
                   i, o.type, o));
        assert.optionalString(o.name, format('config.options.%d.name', i));
        assert.optionalArrayOfString(o.names,
            format('config.options.%d.names', i));
        assert.ok((o.name || o.names) && !(o.name && o.names),
            format('exactly one of "name" or "names" required: %j', o));
        assert.optionalString(o.help, format('config.options.%d.help', i));
        if (o.name) {
            o.names = [o.name];
        } else {
            assert.string(o.names[0],
                format('config.options.%d.names is empty', i));
            o.name = o.names[0];
        }

        o.names.forEach(function (n) {
            if (self.optionFromName[n]) {
                throw new Error(format(
                    'option name collision: "%s" used in %j and %j',
                    n, self.optionFromName[n], o));
            }
            self.optionFromName[n] = o;
        });
    }
}

Parser.prototype.optionTakesArg = function optionTakesArg(option) {
    return types[option.type].takesArg;
};

/**
 * Parse options from the given argv.
 *
 * @param argv {Array} Optional. The argv to process. Defaults to
 *      `process.argv`.
 * @param slice {Number} The index into argv at which options/args begin.
 *      Default is 2, as appropriate for `process.argv`.
 * @returns {Object} Parsed `opts`. It has special keys `_args` (the
 *      remaining args from `argv`) and `_order` (gives the order that
 *      options were specified).
 */
Parser.prototype.parse = function parse(argv, slice) {
    assert.optionalArrayOfString(argv, 'argv');
    assert.optionalNumber(slice, 'slice');
    var argv = argv || process.argv;
    var slice = slice || 2;
    var args = argv.slice(slice);

    // Setup default values
    var opts = {};
    var _order = [];
    this.options.forEach(function (o) {
        if (o.default) {
            opts[o.name] = o.default;
        }
    });

    function addOpt(option, optstr, name, val) {
        var type = types[option.type];
        var parsedVal = type.parseArg(option, optstr, val);
        if (type.array) {
            if (!opts[name]) {
                opts[name] = [];
            }
            opts[name].push(parsedVal);
        } else {
            opts[name] = parsedVal;
        }
        var item = {};
        item[name] = parsedVal;
        _order.push(item);
    }

    // Parse args.
    var _args = [];
    var i = 0;
    while (i < args.length) {
        var arg = args[i];

        // End of options marker.
        if (arg === '--') {
            i++;
            break;

        // Long option
        } else if (arg.slice(0, 2) === '--') {
            var name = arg.slice(2);
            var val = null;
            var idx = name.indexOf('=');
            if (idx !== -1) {
                val = name.slice(idx + 1);
                name = name.slice(0, idx);
            }
            var option = this.optionFromName[name];
            if (!option) {
                throw new Error(format('unknown option: "--%s"', name));
            }
            var takesArg = this.optionTakesArg(option);
            if (val !== null && !takesArg) {
                throw new Error(format('argument given to "--%s" option '
                    + 'that does not take one: "%s"', name, arg));
            }
            if (!takesArg) {
                addOpt(option, name, option.name, true);
            } else if (val !== null) {
                addOpt(option, name, option.name, val);
            } else if (i + 1 >= args.length) {
                throw new Error(format('do not have enough args for "--%s" '
                    + 'option', name));
            } else {
                addOpt(option, name, option.name, args[i + 1]);
                i++;
            }

        // Short option
        } else if (arg[0] === '-' && arg.length > 1) {
            var j = 1;
            while (j < arg.length) {
                var name = arg[j];
                var val = arg.slice(j + 1);  // option val if it takes an arg
                // debug('name: %s (val: %s)', name, val)
                var option = this.optionFromName[name];
                if (!option) {
                    if (arg.length > 2) {
                        throw new Error(format(
                            'unknown option: "-%s" in "%s" group',
                            name, arg));
                    } else {
                        throw new Error(format('unknown option: "-%s"', name));
                    }
                }
                var takesArg = this.optionTakesArg(option);
                if (!takesArg) {
                    addOpt(option, name, option.name, true);
                } else if (val) {
                    addOpt(option, name, option.name, val);
                    break;
                } else {
                    if (i + 1 >= args.length) {
                        throw new Error(format('do not have enough args '
                            + 'for "-%s" option', name));
                    }
                    addOpt(option, name, option.name, args[i + 1]);
                    i++;
                    break;
                }
                j++;
            }

        // An interspersed arg
        } else if (this.interspersed) {
            _args.push(arg);

        // An arg and interspersed args are not allowed, so done options.
        } else {
            break;
        }
        i++;
    }
    _args = _args.concat(args.slice(i));

    opts._order = _order;
    opts._args = _args;
    return opts;
};


/**
 * Return help output for the current options.
 *
 * E.g.: if the current options are:
 *      [{names: ['help', 'h'], type: 'bool', help: 'Show help and exit.'}]
 * then this would return:
 *      '  -h, --help     Show help and exit.\n'
 *
 * @param options {Object} Options for controlling the option help output.
 *      - indent {Number|String} Default 4. An indent/prefix to use for
 *        each option line.
 *      - nameSort {String} Default is 'length'. By default the names are
 *        sorted to put the short opts first (i.e. '-h, --help' preferred
 *        to '--help, -h'). Set to 'none' to not do this sorting.
 *      - maxCol {Number} Default 80. Note that long tokens in a help string
 *        can go past this.
 *      - helpCol {Number} Set to specify a specific column at which
 *        option help will be aligned. By default this is determined
 *        automatically.
 *      - minHelpCol {Number} Default 20.
 *      - maxHelpCol {Number} Default 40.
 * @returns {String}
 */
Parser.prototype.help = function help(options) {
    options = options || {};
    assert.object(options, 'options');
    var indent;
    if (options.indent === undefined) {
        indent = space(4);
    } else if (typeof (options.indent) === 'number') {
        indent = space(options.indent);
    } else if (typeof (options.indent) === 'string') {
        indent = options.indent;
    } else {
        assert.fail('invalid "options.indent": not a string or number: '
            + options.indent);
    }
    assert.optionalString(options.nameSort, 'options.nameSort');
    var nameSort = options.nameSort || 'length';
    assert.ok(~['length', 'none'].indexOf(nameSort),
        'invalid "options.nameSort"');
    assert.optionalNumber(options.maxCol, 'options.maxCol');
    assert.optionalNumber(options.maxHelpCol, 'options.maxHelpCol');
    assert.optionalNumber(options.minHelpCol, 'options.minHelpCol');
    assert.optionalNumber(options.helpCol, 'options.helpCol');
    var maxCol = options.maxCol || 80;
    var minHelpCol = options.minHelpCol || 20;
    var maxHelpCol = options.maxHelpCol || 40;

    var lines = [];
    var maxWidth = 0;
    this.options.forEach(function (o) {
        var type = types[o.type];
        var arg = o.helpArg || type.helpArg || 'ARG';
        var line = '';
        var names = o.names.slice();
        if (nameSort === 'length') {
            names.sort(function (a, b) {
                if (a.length < b.length)
                    return -1;
                else if (b.length < a.length)
                    return 1;
                else
                    return 0;
            })
        }
        names.forEach(function (name, i) {
            if (i > 0)
                line += ', ';
            if (name.length === 1) {
                line += '-' + name
                if (type.takesArg)
                    line += ' ' + arg;
            } else {
                line += '--' + name
                if (type.takesArg)
                    line += '=' + arg;
            }
        });
        maxWidth = Math.max(maxWidth, line.length);
        lines.push(line);
    });

    // Add help strings.
    var helpCol = options.helpCol;
    if (!helpCol) {
        helpCol = maxWidth + indent.length + 2;
        helpCol = Math.min(Math.max(helpCol, minHelpCol), maxHelpCol);
    }
    this.options.forEach(function (o, i) {
        if (!o.help) {
            return;
        }
        var line = lines[i];
        var n = helpCol - (indent.length + line.length);
        if (n >= 0) {
            line += space(n);
        } else {
            line += '\n' + space(helpCol);
        }
        line += textwrap(o.help, maxCol - helpCol).join(
            '\n' + space(helpCol));
        lines[i] = line;
    });

    var rv = '';
    if (lines.length > 0) {
        rv = indent + lines.join('\n' + indent) + '\n';
    }
    return rv;
};



// ---- exports

function parse(config) {
    assert.object(config, 'config');
    assert.optionalArrayOfString(config.argv, 'config.argv');
    var config = shallowCopy(config);
    var argv = config.argv || process.ARGV;
    delete config.argv;

    var parser = new Parser(config);
    return parser.parse(argv);
}

module.exports = {
    Parser: Parser,
    parse: parse
};
