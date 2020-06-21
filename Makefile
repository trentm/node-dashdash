
JSSTYLE_FILES := $(shell find lib test -name "*.js")


all:
	npm install

.PHONY: test
test:
	npm test

.PHONY: distclean
distclean: clean
	rm -rf node_modules

.PHONY: clean
clean:
	rm -f dashdash-*.tgz

.PHONY: check-jsstyle
check-jsstyle: $(JSSTYLE_FILES)
	./tools/jsstyle -o indent=4,doxygen,unparenthesized-return=0,blank-after-start-comment=0,leading-right-paren-ok $(JSSTYLE_FILES)

.PHONY: check
check:: check-jsstyle versioncheck
	@echo "Check ok."

# Ensure CHANGES.md and package.json have the same version.
.PHONY: versioncheck
versioncheck:
	@echo version is: $(shell cat package.json | json version)
	[[ `cat package.json | json version` == `grep '^## ' CHANGES.md | head -2 | tail -1 | awk '{print $$2}'` ]]

.PHONY: cutarelease
cutarelease: versioncheck
	[[ -z `git status --short` ]]  # If this fails, the working dir is dirty.
	@which json 2>/dev/null 1>/dev/null && \
	    ver=$(shell json -f package.json version) && \
	    name=$(shell json -f package.json name) && \
	    publishedVer=$(shell npm view -j $(shell json -f package.json name)@$(shell json -f package.json version) version 2>/dev/null) && \
	    if [[ -n "$$publishedVer" ]]; then \
		echo "error: $$name@$$ver is already published to npm"; \
		exit 1; \
	    fi && \
	    echo "** Are you sure you want to tag and publish $$name@$$ver to npm?" && \
	    echo "** Enter to continue, Ctrl+C to abort." && \
	    read
	ver=$(shell cat package.json | json version) && \
	    date=$(shell date -u "+%Y-%m-%d") && \
	    git tag -a "$$ver" -m "version $$ver ($$date)" && \
	    git push --tags origin && \
	    npm publish
