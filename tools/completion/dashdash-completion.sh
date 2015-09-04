
# TODO:
# - get it working
# - test suite
# - docs and helpers on how to use/deploy/maintain this
#   - how to debug not getting what you expect
#   - doc the annoyance that no matches results in default completion
# - node-cmdln support
# - test with other shells



# compgen notes, from http://unix.stackexchange.com/questions/151118/understand-compgen-builtin-command
#
#    -a means Names of alias
#    -b means Names of shell builtins
#    -c means Names of all commands
#    -d means Names of directory
#    -e means Names of exported shell variables
#    -f means Names of file and functions
#    -g means Names of groups
#    -j means Names of job
#    -k means Names of Shell reserved words
#    -s means Names of service
#    -u means Names od userAlias names
#    -v means Names of shell variables
#
#You can see complete man page here: https://www.gnu.org/software/bash/manual/html_node/Programmable-Completion-Builtins.html

TRACE=1
if [[ -n "$TRACE" ]]; then
    export PS4='[\D{%FT%TZ}] ${BASH_SOURCE}:${LINENO}: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'
    set -o xtrace
fi
set -o errexit
set -o pipefail


# ---- globals

NAME=dashdash-completion


# ---- support functions

function fatal
{
    echo "" >&2
    echo "* * *" >&2
    printf "$NAME: fatal error: $*\n" >&2
    exit 1
}

function trace
{
    echo "$*" >&2
}


# ---- mainline

# Examples/design:
#
# 1. all the short opts
#       $ tool -<TAB>
#       -b -f -h -t -v
#
# 2. all the long opts
#       $ tool --<TAB>      # all the long opts
#       --file --help --timeout ...
#
# 3. non-opts, no input info
#       $ tool <TAB>
#       ('file' completion)
#    AFAIK, the default complete, at least for Bash, when there is no registered
#    complete function is to do 'file' completion.
#
# 4. long opt arg with '='
#       $ tool --file=<TAB>
#       $ tool --file=./d<TAB>
#    We maintain the "--file=" prefix. Limitation: With the attached prefix
#    the `complete -o filenames` doesn't know to do dirname '/' suffixing. Meh.
#
#    XXX This is broken.
#
# 5. envvar support
#       $ tool $<TAB>
#       $ tool $P<TAB>
#    TODO: Currently only getting exported vars, so we miss "PS1" and others.
#
# 6. Defer to other completion in a subshell:
#       $ tool --file $(cat ./<TAB>
#    We get this from 'complete -o default ...'.
#
# XXX devil in the details of optargs and whether have enough info. What
#   is the bash function and what input opts does it take? Args or envvar
#   inputs?
#

trace ""
trace "-- $(date)"
trace "\$@: '$@'"
trace "COMP_WORDBREAKS: '$COMP_WORDBREAKS'"
trace "COMP_CWORD: '$COMP_CWORD'"
trace "COMP_LINE: '$COMP_LINE'"
trace "COMP_POINT: $COMP_POINT"

# Guard against negative COMP_CWORD. This is a Bash bug at least on
# Mac 10.10.4's bash. See
# <https://lists.gnu.org/archive/html/bug-bash/2009-07/msg00125.html>.
if [[ $COMP_CWORD -lt 0 ]]; then
    trace "abort on negative COMP_CWORD"
    exit 1;
fi

# I don't know how to do array manip on argv vars,
# so copy over to ARGV array to work on them.
declare -a ARGV
shift   # the leading '--'
i=0
len=$#
while [[ $# -gt 0 ]]; do
    ARGV[$i]=$1
    shift;
    i=$(( $i + 1 ))
done

trace "ARGV: '${ARGV[@]}'"
trace "ARGV[COMP_CWORD-1]: '${ARGV[$(( $COMP_CWORD - 1 ))]}'"
trace "ARGV[COMP_CWORD]: '${ARGV[$COMP_CWORD]}'"
trace "ARGV len: '$len'"

# Configuration (XXX)
shortOpts="-h -v -b -f -t -d"
longOpts="--version --help --verbose --file --timeout --dir"
takesArgOpts="-f=file --file=file -t=none --timeout=none -d=directory --dir=directory --tm=complete_tmprojects"
function complete_tmprojects () {
    trace "complete_tmprojects: '$1' '$2' '$3'"  # '$2' is the 'word'
    ls -1 $HOME/tm
}


# Get 'state' of option parsing at this COMP_POINT.
# Copying "dashdash.js#parse()" behaviour here.
# XXX move this all to a function and use 'local' for all vars
state=
nargs=0
i=1
while [[ $i -lt $len && $i -le $COMP_CWORD ]]; do
    optname=
    prefix=
    #argtype=
    word=

    arg=${ARGV[$i]}
    trace "consider ARGV[$i]: '$arg'"

    if [[ "$arg" == "--" ]]; then
        state=longopt
        word=--
        i=$(( $i + 1 ))
        break;
    elif [[ "${arg:0:2}" == "--" ]]; then
        arg=${arg:2}
        if [[ "$arg" == *"="* ]]; then
            optname=${arg%%=*}
            val=${arg##*=}
            trace "  long opt: optname='$optname' val='$val'"
            state=arg
            #argtype=$(echo "$takesArgOpts" | awk -F "-$optname=" '{print $2}' | cut -d' ' -f1)
            word=$val
            prefix="--$optname="
        else
            optname=$arg
            val=
            trace "  long opt: optname='$optname'"
            state=longopt
            word=--$optname

            if [[ "$takesArgOpts" == *"-$optname="* && $i -lt $COMP_CWORD ]]; then
                i=$(( $i + 1 ))
                state=arg
                trace "XXX here"
                #argtype=$(echo "$takesArgOpts" | awk -F "-$optname=" '{print $2}' | cut -d' ' -f1)
                word=${ARGV[$i]}
                trace "  takes arg (next arg, word='$word')"
            fi
        fi
    elif [[ "${arg:0:1}" == "-" ]]; then
        trace "  short opt group"
        state=shortopt
        word=$arg

        j=1
        while [[ $j -lt ${#arg} ]]; do
            optname=${arg:$j:1}
            trace "  consider index $j: optname '$optname'"

            if [[ "$takesArgOpts" == *"-$optname="* ]]; then
                #argtype=$(echo "$takesArgOpts" | awk -F "-$optname=" '{print $2}' | cut -d' ' -f1)
                if [[ $(( $j + 1 )) -lt ${#arg} ]]; then
                    state=arg
                    word=${arg:$(( $j + 1 ))}
                    trace "    takes arg (rest of this arg, word='$word')"
                elif [[ $i -lt $COMP_CWORD ]]; then
                    state=arg
                    i=$(( $i + 1 ))
                    word=${ARGV[$i]}
                    trace "  takes arg (word='$word')"
                fi
                break
            fi

            j=$(( $j + 1 ))
        done
    else
        trace "  not an opt"
        state=arg  #XXX arg type
        word=$arg
        nargs=$(( $nargs + 1 ))
    fi

    trace "  state=$state prefix='$prefix' word='$word'"
    i=$(( $i + 1 ))
done

trace "parsed: state=$state prefix='$prefix' word='$word'"
compgen_opts=
if [[ -n "$prefix" ]]; then
    compgen_opts="$compgen_opts -P $prefix"
fi

case $state in
shortopt)
    compgen $compgen_opts -W "$shortOpts" -- "$word"
    ;;
longopt)
    compgen $compgen_opts -W "$longOpts" -- "$word"
    ;;
arg)
    # Figure out arg type, if we can. If this was an *option* arg, then
    # 'optname' is set.
    if [[ -n "$optname" ]]; then
        argtype=$(echo "$takesArgOpts" | awk -F "-$optname=" '{print $2}' | cut -d' ' -f1)
        trace "argtype (for opt '$optname'): $argtype"
    else
        trace "XXX set argtype from nargs"
        trace "argtype (for arg $nargs): $argtype"
    fi

    # If we don't know what completion to do, then emit nothing. We
    # expect that we are running with:
    #       complete -o default ...
    # where "default" means: "Use Readline's default filename completion if
    # the compspec generates no matches." This gives us the good filename
    # completion, completion in subshells/backticks.
    #
    # The trade-off here is that we cannot explicitly have *no* completion.
    if [[ "${word:0:1}" == '$' ]]; then
        # "-o default" does *not* give us envvar completion apparently. This
        # means that with '-A export' we are missing envvars like "PS1" et al.
        compgen $compgen_opts -P '$' -A export -- "${word:1}"
    elif [[ $argtype == "none" ]]; then
        # TODO: want this hacky way to avoid completions for explicit none?
        echo "(no completion)"
    elif [[ $argtype == "directory" ]]; then
        # XXX damnit... using 'complete -o default' means that no dir hits
        #     results in filenames matching. Arrrrgggg. Compare to 'rmdir'.
        #     Does `compopt` work on Linux? If so
        #           compopt +o filenames -o dirnames
        compgen $compgen_opts -S '/' -A directory -- "$word"
    elif [[ -z $argtype || $argtype == "file" ]]; then
        # 'complete -o default' gives the best filename completion, at least
        # on Mac.
        echo ""
    else
        potentials=$($argtype "" "$word")   # TODO: follow 'compgen -F ...' signature?
        #echo $(compgen $compgen_opts -F $argtype -- "$word")
        compgen $compgen_opts -W "$potentials" -- "$word"
    fi
    ;;
*)
    trace "unknown state: $state"
    ;;
esac


#
# ./d options:
#    --version             Print tool version and exit.
#    -h, --help            Print this help and exit.
#    -v, --verbose         Verbose output. Use multiple times for more verbose.
#                          Environment: FOO_VERBOSE=1
#    -b                    A boolean arg.
#    -f FILE, --file=FILE  File to process. Environment: FOO_FILE=FILE
#    -t MS, --timeout=MS   Processing timeout in milliseconds. Environment:
#                          FOO_TIMEOUT=MS
#
