# node-dashdash changelog

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
