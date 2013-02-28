
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
testall: test09 test08
.PHONY: test09
test09:
	@echo "# Test node 0.9.x (with node `$(NODEOPT)/node-0.9/bin/node --version`)"
	@$(NODEOPT)/node-0.9/bin/node --version
	PATH="$(NODEOPT)/node-0.9/bin:$(PATH)" make test
.PHONY: test08
test08:
	@echo "# Test node 0.8.x (with node `$(NODEOPT)/node-0.8/bin/node --version`)"
	@$(NODEOPT)/node-0.8/bin/node --version
	PATH="$(NODEOPT)/node-0.8/bin:$(PATH)" make test


.PHONY: check-jsstyle
check-jsstyle: $(JSSTYLE_FILES)
	./tools/jsstyle -o indent=4,doxygen,unparenthesized-return=0,blank-after-start-comment=0,leading-right-paren-ok $(JSSTYLE_FILES)

.PHONY: check
check: check-jsstyle
	@echo "Check ok."


.PHONY: cutarelease
cutarelease:
	[[ `git status | tail -n1` == "nothing to commit (working directory clean)" ]]
	./tools/cutarelease.py -p dashdash -f package.json

