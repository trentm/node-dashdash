
NODEUNIT = ./node_modules/.bin/nodeunit
JSSTYLE_FILES := $(shell find lib test -name "*.js")
NODEOPT ?= $(HOME)/opt


all $(NODEUNIT):
	npm install

.PHONY: distclean
distclean:
	rm -rf node_modules


.PHONY: test
test: | $(NODEUNIT)
	$(NODEUNIT) test/*.test.js

.PHONY: testall
testall: test6 test5 test4 test012 test010
.PHONY: test6
test6:
	@echo "# Test node 6.x (with node `$(NODEOPT)/node-6/bin/node --version`)"
	@$(NODEOPT)/node-6/bin/node --version
	PATH="$(NODEOPT)/node-6/bin:$(PATH)" make test
.PHONY: test5
test5:
	@echo "# Test node 5.x (with node `$(NODEOPT)/node-5/bin/node --version`)"
	@$(NODEOPT)/node-5/bin/node --version
	PATH="$(NODEOPT)/node-5/bin:$(PATH)" make test
.PHONY: test4
test4:
	@echo "# Test node 4.x (with node `$(NODEOPT)/node-4/bin/node --version`)"
	@$(NODEOPT)/node-4/bin/node --version
	PATH="$(NODEOPT)/node-4/bin:$(PATH)" make test
.PHONY: test012
test012:
	@echo "# Test node 0.12.x (with node `$(NODEOPT)/node-0.12/bin/node --version`)"
	@$(NODEOPT)/node-0.12/bin/node --version
	PATH="$(NODEOPT)/node-0.12/bin:$(PATH)" make test
.PHONY: test010
test010:
	@echo "# Test node 0.10.x (with node `$(NODEOPT)/node-0.10/bin/node --version`)"
	@$(NODEOPT)/node-0.10/bin/node --version
	PATH="$(NODEOPT)/node-0.10/bin:$(PATH)" make test

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
	[[ `cat package.json | json version` == `grep '^## ' CHANGES.md | head -1 | awk '{print $$2}'` ]]

.PHONY: cutarelease
cutarelease: versioncheck
	[[ `git status | tail -n1` == "nothing to commit, working directory clean" ]]
	./tools/cutarelease.py -p dashdash -f package.json
