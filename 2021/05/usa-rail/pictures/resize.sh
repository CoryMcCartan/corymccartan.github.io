#!/usr/bin/env bash
for f in *.jpeg; do
    convert $f -resize 1856x1200\> $f
done

