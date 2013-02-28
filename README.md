Yet another node.js option parsing library.
[Why? See below](#why). tl;dr: The others I've tried are one of
too loosey goosey (not explicit), too big/too many deps, or ill specified.
YMMV.

Follow <a href="https://twitter.com/intent/user?screen_name=trentmick" target="_blank">@trentmick</a>
for updates to node-dashdash.


# Usage

    var dashdash = require('dashdash');

    // Specify the options. Minimally `name` (or `names`) and `type`
    // must be given for each.
    var options = [
        {
            // `names` or a single `name`. First element is the `opts.KEY`.
            names: ['help', 'h'],
            // See "Option config" below for types.
            type: 'bool',
            help: 'Print this help and exit.'
        }
    ];

    // Shortcut form. As called it infers `process.argv`. See below for
    // the longer form to use methods like `.help()` on the Parser object.
    var opts = dashdash.parse({options: options});

    console.log("opts:", opts);
    console.log("args:", opts._args);


# Longer Example

A more realistic starter script is as follows. This also shows using
`parser.help()` for formatted option help.

    var dashdash = require('./lib/dashdash');

    var options = [
        {
            name: 'version',
            type: 'bool',
            help: 'Print tool version and exit.'
        },
        {
            names: ['help', 'h'],
            type: 'bool',
            help: 'Print this help and exit.'
        },
        {
            names: ['verbose', 'v'],
            type: 'arrayOfBool',
            help: 'Verbose output. Use multiple times for more verbose.'
        },
        {
            names: ['file', 'f'],
            type: 'string',
            help: 'File to process',
            helpArg: 'FILE'
        }
    ];

    var parser = new dashdash.Parser({options: options});
    try {
        var opts = parser.parse(process.argv);
    } catch (e) {
        console.error('foo: error: %s', e.message);
        process.exit(1);
    }

    console.log("# opts:", opts);
    console.log("# args:", opts._args);

    // Use `parser.help()` for formatted options help.
    if (opts.help) {
        console.log('usage: node foo.js [OPTIONS]\n'
                    + 'options:\n'
                    + parser.help().trimRight());
        process.exit(0);
    }

    // ...


Some example output from this script (foo.js):

    $ node foo.js -h
    # opts: { help: true, _order: [ { help: true } ], _args: [] }
    # args: []
    usage: node foo.js [OPTIONS]
    options:
        --version             Print tool version and exit.
        -h, --help            Print this help and exit.
        -v, --verbose         Verbose output. Use multiple times for more verbose.
        -f FILE, --file=FILE  File to process

    $ node foo.js -v
    # opts: { verbose: [ true ], _order: [ { verbose: true } ], _args: [] }
    # args: []

    $ node foo.js --version arg1
    # opts: { version: true,
      _order: [ { version: true } ],
      _args: [ 'arg1' ] }
    # args: [ 'arg1' ]

    $ node foo.js -f bar.txt
    # opts: { file: 'bar.txt', _order: [ { file: 'bar.txt' } ], _args: [] }
    # args: []

    $ node foo.js -vvv --file=blah
    # opts: { verbose: [ true, true, true ],
      file: 'blah',
      _order:
       [ { verbose: true },
         { verbose: true },
         { verbose: true },
         { file: 'blah' } ],
      _args: [] }
    # args: []


# Parser config

The `dashdash.Parser` supports some configuration parameters on:

    new dashdash.Parser({options: options, ...});

These are:

- `interspersed` (Boolean). If true this allows interspersed arguments and
  options. I.e.:

        node ./tool.js -v arg1 arg2 -h   # '-h' is after interspersed args

  This is true by default. Set it to false to have '-h' **not** get parsed
  as an option in the above example.


# Option config

Each option spec in the `options` array must/can have the following fields:

- `name` (String) or `names` (Array). Required. These give the option name
  and aliases. The first name (if more than one given) is the key for the
  parsed `opts` object.

- `type` (String). Required. One of bool, string, number, arrayOfBool,
  arrayOfString, arrayOfNumber. (FWIW, these names attempt to match with
  asserts on [assert-plus](https://github.com/mcavage/node-assert-plus)).

- `help` (String). Optional. Used for `parser.help()` output.

- `helpArg` (String). Optional. Used in help output as the placeholder for
  the option argument, e.g. the "PATH" in:

        ...
        -f PATH, --file=PATH    File to process
        ...

- `default`. Optional. A default value used for this option, if the
  option isn't specified in argv.


# Help config

The `parser.help(...)` function is configurable as follows:

    Options:
        -w WEAPON, --weapon=WEAPON  Weapon with which to crush. One of: |
                                    sword, spear, maul                  |
        -h, --help                  Print this help and exit.           |
    ^^^^                            ^                                   |
        `-- indent                   `-- helpCol              maxCol ---'

- `indent` (Number or String). Default 4. Set to a number (for that many
  spaces) or a string for the literal indent.
- `maxCol` (Number). Default 80. Note that reflow is just done on whitespace
  so a long token in the option help can overflow maxCol.
- `helpCol` (Number). If not set a reasonable value will be determined
  between `minHelpCol` and `maxHelpCol`.
- `minHelpCol` (Number). Default 20.
- `maxHelpCol` (Number). Default 40.


# Why

Why another node.js option parsing lib?

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

# License

MIT. See LICENSE.txt.
