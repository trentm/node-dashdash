# node-dashdash changelog

## 1.3.2

- Fix a subtlety where a *bool* option using both `env` and `default` didn't
  work exactly correctly. If `default: false` then all was fine (by luck).
  However, if you had an option like this:

        options: [ {
            names: ['verbose', 'v'],
            env: 'FOO_VERBOSE',
            'default': true,    // <--- this
            type: 'bool'
        } ],

  wanted `FOO_VERBOSE=0` to make the option false, then you need the fix
  in this version of dashdash.


## 1.3.1

- [issue #1] Fix an envvar not winning over an option 'default'. Previously
  an option with both `default` and `env` would never take a value from the
  environment variable. E.g. `FOO_FILE` would never work here:

        options: [ {
            names: ['file', 'f'],
            env: 'FOO_FILE',
            'default': 'default.file',
            type: 'string'
        } ],


## 1.3.0

- [Backward incompatible change for boolean envvars] Change the
  interpretation of environment variables for boolean options to consider '0'
  to be false. Previous to this *any* value to the envvar was considered
  true -- which was quite misleading. Example:

        $ FOO_VERBOSE=0 node examples/foo.js
        # opts: { verbose: [ false ],
          _order: [ { key: 'verbose', value: false, from: 'env' } ],
          _args: [] }
        # args: []


## 1.2.1

- Fix for `parse.help({includeEnv: true, ...})` handling to ensure that an
  option with an `env` **but no `help`** still has the "Environment: ..."
  output. E.g.:

        { names: ['foo'], type: 'string', env: 'FOO' }

        ...

        --foo=ARG      Environment: FOO=ARG


## 1.2.0

- Transform the option key on the `opts` object returned from
  `<parser>.parse()` for convenience. Currently this is just
  `s/-/_/g`, e.g. '--dry-run' -> `opts.dry_run`. This allow one to use hyphen
  in option names (common) but not have to do silly things like
  `opt["dry-run"]` to access the parsed results.


## 1.1.0

- Environment variable integration. Envvars can be associated with an option,
  then option processing will fallback to using that envvar if defined and
  if the option isn't specified in argv. See the "Environment variable
  integration" section in the README.

- Change the `<parser>.parse()` signature to take a single object with keys
  for arguments. The old signature is still supported.

- `dashdash.createParser(CONFIG)` alternative to `new dashdash.Parser(CONFIG)`
  a la many node-land APIs.


## 1.0.2

- Add "positiveInteger" and "arrayOfPositiveInteger" option types that only
  accept positive integers.

- Add "integer" and "arrayOfInteger" option types that accepts only integers.
  Note that, for better or worse, these do NOT accept: "0x42" (hex), "1e2"
  (with exponent) or "1.", "3.0" (floats).


## 1.0.1

- Fix not modifying the given option spec objects (which breaks creating
  a Parser with them more than once).


## 1.0.0

First release.
