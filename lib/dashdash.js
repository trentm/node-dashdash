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



// ---- Parser

var validTypes = [Boolean, String];

function Parser(config) {
    assert.object(config, 'config');
    assert.arrayOfObject(config.options, 'config.options');
    assert.optionalBool(config.interspersed, 'config.interspersed');
    var self = this;

    // Allow interspersed arguments (true by default).
    this.interspersed = (config.interspersed !== undefined
        ? config.interspersed : true);

    this.options = config.options;
    this.optionFromName = {};
    for (var i = 0; i < this.options.length; i++) {
        var o = this.options[i];
        assert.ok(validTypes.indexOf(o.type) !== -1,
            format('invalid config.options.%d.type', i));
        assert.optionalString(o.name, format('config.options.%d.name', i));
        assert.optionalArrayOfString(o.names,
            format('config.options.%d.names', i));
        assert.ok((o.name || o.names) && !(o.name && o.names),
            format('exactly one of "name" or "names" required: %j', o));
        assert.optionalString(o.desc, format('config.options.%d.desc', i));
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
    if (option.type === Boolean) {
        return false;
    } else if (option.type === String) {
        return true;
    } else {
        throw new Error(format('unknown option type: "%s"', option.type));
    }
};

Parser.prototype.parse = function parse(argv) {
    var args = argv.slice(2);

    // Setup default values
    var opts = {};
    this.options.forEach(function (o) {
        if (o.default) {
            opts[o.name] = o.default;
        }
    });

    // Parse args.
    var _ = [];
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
                throw new Error(format(
                    'argument given to "--%s" option that does not take one: "%s"',
                    name, arg));
            }
            //XXX parsing values for other types
            if (!takesArg) {
                //XXX This is wrong for 'arrayOfBool'.
                opts[option.name] = true;
            } else if (val !== null) {
                opts[option.name] = val;
            } else if (i + 1 >= args.length) {
                throw new Error(format('do not have enough args for "--%s" '
                    + 'option', name));
            } else {
                opts[option.name] = args[i + 1];
                i++;
            }

        // Short option
        } else if (arg[0] === '-' && arg.length > 1) {
            var j = 1;
            while (j < arg.length) {
                var name = arg[j];
                var val = arg.slice(j + 1);  // option val if it takes an arg
                //debug('name: %s (val: %s)', name, val)
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
                    //XXX This is wrong for 'arrayOfBool'.
                    opts[option.name] = true;
                } else if (val) {
                    //XXX option to disallow cuddled arg?
                    opts[option.name] = val;
                    break;
                } else {
                    if (i + 1 >= args.length) {
                        throw new Error(format('do not have enough args '
                            + 'for "-%s" option', name));
                    }
                    opts[option.name] = args[i + 1];
                    i++;
                    break;
                }
                j++;
            }

        // An interspersed arg
        } else if (this.interspersed) {
            _.push(arg);

        // An arg and interspersed args are not allowed, so done options.
        } else {
            break;
        }
        i++;
    }
    _ = _.concat(args.slice(i));

    opts._ = _;
    return opts;
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
