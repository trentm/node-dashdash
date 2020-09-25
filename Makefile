
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

# Run just the lint-y parts of eslint (i.e. not "prettier" formatting).
.PHONY: lint
lint:
	npm run lint

.PHONY: fmt
fmt:
	npm run fmt

.PHONY: check
check:: check-eslint check-version
	@echo "Check ok."

.PHONY: check-eslint
check-eslint:
	npm run check

# Ensure CHANGES.md and package.json have the same version.
.PHONY: check-version
check-version:
	@echo version is: $(shell cat package.json | json version)
	[[ `cat package.json | json version` == `grep '^## ' CHANGES.md | head -2 | tail -1 | awk '{print $$2}'` ]]

.PHONY: cutarelease
cutarelease: check-version
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
	    git tag -a "v$$ver" -m "version $$ver ($$date)" && \
	    git push origin "v$$ver" && \
	    npm publish
