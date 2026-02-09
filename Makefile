SHELL=/bin/bash

.DEFAULT_GOAL := help
.SILENT :

URed=\033[4;31m
BIYellow = \033[1;93m
BCyan=\033[1;36m
GREEN = \033[0;32m
BIGreen = \033[1;92m
NC = \033[0m
DC=docker compose
DCR=${DC} run
DCE=${DC} exec
DCEP=${DCE} php
CONSOLE=${DCEP} bin/console

## Display this help dialog
help:

	echo -e "This Makefile help you using your local development environment."
	echo -e "Usage: make <action>"
	awk '/^[a-zA-Z\-\_0-9]+:/ { \
		separator = match(lastLine, /^## --/); \
		if (separator) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			printf "${BIYellow}= %s =${NC}\n", helpCommand; \
		} \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			if(helpMessage!="--") { \
				printf "${GREEN}%-20s${NC} %s\n", helpCommand, helpMessage; \
			} \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
.PHONY: help

## --
React:

## Install 
install:
	yarn

## Watch
start:
	yarn start

## Build
build-react:
	rm -rf build
	yarn build

## --
Electron:

## Install Electron
electron-install:
	cd electron && yarn 

## Copy build React
cp-build:
	rm -rf electron/build
	cp -r build electron
	sed -i.bak 's#"/assets/#"./assets/#g' electron/build/index.html
	sed -i.bak 's#"/fonts/#"./fonts/#g' electron/build/index.html
	sed -i.bak 's#"/favicon.ico#"./favicon.ico#g' electron/build/index.html
	sed -i.bak 's#"/logo512.png#"./logo512.png#g' electron/build/index.html
	sed -i.bak 's#src="/chiptune2.js#src="./chiptune2.js#g' electron/build/index.html
	sed -i.bak 's#src="/libopenmpt.js#src="./libopenmpt.js#g' electron/build/index.html
	rm -f electron/build/index.html.bak

## Test Electron App
electron-start:
	cd electron && yarn start

## Build All
build-all:
	cd electron && yarn build

## Build Mac (Intel + Silicon)
build-mac:
	cd electron && yarn build-mac

## Build Mac Intel (x64)
build-mac-intel:
	cd electron && yarn build-mac-intel

## Build Mac Silicon (arm64)
build-mac-silicon:
	cd electron && yarn build-mac-silicon

## Build Windows
build-win:
	cd electron && yarn build-win

## Build Linux
build-linux:
	cd electron && yarn build-linux

## Copy nfo into zip files
cp-nfo:
	cd nfo && ./copy.sh

## --
Extra:

## Do All
all:
	$(MAKE) install
	$(MAKE) build-react
	$(MAKE) electron-install
	$(MAKE) cp-build
	$(MAKE) build-all
	
