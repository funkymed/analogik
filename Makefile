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
build:
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
	sed -i 's#/static#./static#g' electron/build/index.html

## Test Electron App
electron-start:
	cd electron && yarn start

## Build All
build-all:
	cd electron && yarn build

## Build MacOsx
build-mac:
	cd electron && yarn build-mac

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
	$(MAKE) electron-install
	$(MAKE) cp-build
	$(MAKE) build-all
	$(MAKE) build
