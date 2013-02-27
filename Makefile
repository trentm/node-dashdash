
NODEUNIT=./node_modules/.bin/nodeunit

all $(NODEUNIT):
	npm install

.PHONY: test
test: | $(NODEUNIT)
	$(NODEUNIT) test/*.test.js
