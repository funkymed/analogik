# Analogik Music Disk

> **Code** by med
> **Music** by
    bacter - cemik - dna-groove - drax - dualtrax - edzes - ernestoaeroflot - forsaken - genuis - jashiin - keen - kenet - keyg - ks - med - nagz - poulpy - redribbon - rez - skybax - tomaes - traven - unaware - vhiiula - wayfinder - willbe - xerxes

## Install

```bash
yarn
```

## Start dev server

```bash
yarn start
```

## Build

```bash
yarn build
```

The result will be available in `dist/`

### Build Electron version

```bash
$ yarn build
$ cp -r build/* electron
```

edit the index.html and replace `/static` by `./static`   
edit the css file, replace `/static/` by `../`

#### Preview 

```bash
$ cd electron
$ yarn start
```

#### Build a release

```bash
$ cd electron
$ yarn build-mac # build-win or build-linux
```