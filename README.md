Yet another node.js option parsing library.
[Why? See below](#why).


# Usage

    var dashdash = require('dashdash');

    var options = [
        {
            name: '--version',              // `name` or `names`
            desc: 'Print tool version and exit.',
            type: 'bool'
        },
        {
            names: ['--help', '-h'],        // first name is opts key
            desc: 'Print this help and exit.',
            type: 'bool'
        },
        {
            names: ['--verbose', '-v'],
            desc: 'Verbose output. Use multiple times for more verbose.',
            type: 'bool'
        },
        {
            names: ['--file', '-f'],
            desc: 'File to process',
            type: 'string'
        }
    ];

    var opts = dashdash.parse({options: options, argv: process.ARGV});
    // Or this:
    //      var opts = dashdash.parse({options: options}); // argv inferred
    // Or this:
    //      var parser = new dashdash.Parser({options: options});
    //      var opts = parser.parse(process.ARGV);
    console.log("given options:", opts);
    console.log("given args:", opts._args);



# Parsing configuration

- `interspersed` (Boolean) to allow interspersed arguments. I.e.:

        node ./tool.js -v arg1 arg2 -h   # '-h' is after interspersed args

TODO:complete docs


# Why

`nopt` really is just for "tools like npm". Implicit opts (e.g. '--no-foo'
works for every '--foo'). Can't disable abbreviated opts. Can't do multiple
usages of same opt, e.g. '-vvv' (I think). Can't do grouped short opts.

`optimist` surprises. Implicit opts. `process.exit` calls.

`optparse` Incomplete docs. Is this an attempted clone of Python's `optparse`.
Not clear. Some divergence. `parser.on("name", ...)` API is weird.

`argparse` Dep on underscore. No thanks. `find lib | wc -l` -> `26`. Overkill.
Argparse is a bit different anyway. Not sure I want that.

`posix-getopt` No type validation. Though that isn't a killer. AFAIK can't
have a long opt without a short alias. I.e. not `getopt_long` semantics.
