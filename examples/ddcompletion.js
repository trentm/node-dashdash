#!/usr/bin/env node
/*
 * An example tool that shows how to get Bash completion using dashdash's
 * helpers for this.
 *
 * Usage:
 *      # One time setup:
 *      cd examples/
 *      alias ddcompletion='node ddcompletion.js'
 *      ddcompletion --completion > /usr/local/etc/bash_completion.d/ddcompletion
 *      source /usr/local/etc/bash_completion.d/ddcompletion
 *
 *      # Now play with the bash completion:
 *      ddcompletion -<TAB>             # complete options
 *      ddcompletion --none <TAB>       # explicit "no completions"
 *      ddcompletion -H <TAB>           # complete custom "knownhosts" type
 *      ddcompletion <TAB>              # complete first positional arg type
 *      ddcompletion banana <TAB>       # complete second position arg type
 */

var dashdash = require('../lib/dashdash');

var options = [
    { name: 'version', type: 'bool', help: 'Print tool version and exit.' },
    { names: ['help', 'h'], type: 'bool', help: 'Print this help and exit.' },
    { names: ['verbose', 'v'], type: 'arrayOfBool', help: 'Verbose output.' },
    { names: ['file', 'f'], type: 'string', helpArg: 'FILE' },
    // Add a (hidden) '--completion' that will emit the bash completion content.
    {
        names: ['completion'],
        type: 'bool',
        hidden: true
    },
    {
        names: ['host', 'H'],
        type: 'string',
        // We'll define a custom completion type and, further down, a Bash
        // completion function for this type. Test it with:
        //      $ ddcompletion --host <TAB>
        completionType: 'knownhosts',
        help: 'A known host (taken from ~/.ssh/known_hosts).'
    },
    {
        names: ['none', 'N'],
        type: 'string',
        // Show off the 'none' completion type, which uses somewhat of
        // a hack to enforce no completions on <TAB>.
        completionType: 'none',
        help: 'Testing "none" argtype. Should be no completions on <TAB>.'
    }
];


var completionFuncs = [
    // A 'knownhosts' completer function.
    'function complete_knownhosts {',
    '    local word="$1"',
    '    local candidates',
    '    candidates=$(cat ~/.ssh/known_hosts  | awk \'{print $1}\' | grep \'^[a-zA-Z]\' | cut -d, -f1)',
    '    compgen $compgen_opts -W "$candidates" -- "$word"',
    '}',

    // A 'fruit' completer function for the first positional arg.
    'function complete_fruit {',
    '    compgen $compgen_opts -W "apple banana orange" -- "$1"',
    '}'
].join('\n');


var parser = dashdash.createParser({options: options});
try {
    var opts = parser.parse(process.argv);
} catch (e) {
    console.error('foo: error: %s', e.message);
    process.exit(1);
}

if (opts.help) {
    var help = parser.help({includeEnv: true}).trimRight();
    console.log('usage: node ddcompletion.js [OPTIONS]\n'
                + 'options:\n'
                + help);
    process.exit(0);
} else if (opts.completion) {
    // Use the `parser.bashCompletion()` helper to create the Bash
    // completion file content, then just dump it.
    console.log( parser.bashCompletion({
        name: 'ddcompletion',
        specExtra: completionFuncs,
        // Define the first positional arg to be a fruit, and subsequent
        // args to be 'file'.
        argtypes: ['fruit', 'file']
    }) );
    process.exit(0);
}

// ...
console.log('opts:', opts);
console.log('args:', opts._args);
console.log('...')
