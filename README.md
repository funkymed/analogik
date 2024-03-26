# Analogik Music Disk

> **Code** by med   
> **Music** by   
    bacter - cemik - dna-groove - drax - dualtrax - edzes - ernestoaeroflot - forsaken - genuis - jashiin - keen - kenet - keyg - ks - med - nagz - poulpy - redribbon - rez - skybax - tomaes - traven - unaware - vhiiula - wayfinder - willbe - xerxes

## Install

```bash
make install
make electron-install
```

## Start dev server

```bash
make start
```

## Build the React App

```bash
make build
open build
```

The result will be available in `build/`

### Build Electron version

```bash
make build
make cp-build
make build-platform #(platform=mac|win|linux)
open electron/dist
```

#### Preview 

```bash
make electron-start
```

#### Build a release

```bash
make build-all
open electron/dist
```