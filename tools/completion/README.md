An incomplete start at intelligent bash completion.

To test:

    # In a separate terminal:
    tail -f /var/tmp/d.completion.log

    # In your play terminal:
    source ./d.completion
    d --version --file "foo bar" --timeout=asd - -bv -bfFILE -fFILE -t 10 <TAB>

Edit "dashdash-completion.sh", which is the guts of "d.completion". Because
"d.completion" shells out to this for each completion, you don't need to
re-`source`.

The intention of dashdash-completion.sh is to (a) be generic (eventually the
option specifics would be factored out, (b) to fully parse the argv to know
options from arguments, and (c) to support argument type specific
completion.

Some problems:
- We use "complete -o default ..." to benefit from readline dir/file
  completion, env completion (`$P<TAB>`) and sub-shell completion
  (`... $(ca<TAB>`). However, that gets in the way if, e.g. we
  *know* that a given arg should not complete filenames, but we
  don't have any completions. The `complete -o default` will
  fallback to file completion.
- Still incomplete code. Commiting now to not lose the current work.
