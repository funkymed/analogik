#!/bin/bash
FILES="../electron/dist/*.zip"
for f in $FILES
do
    echo "Processing : $f\n"
    zip $f readme.txt screenshot-pouet.gif
done