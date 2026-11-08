#!/bin/sh
# screens/out/*.png -> ../branding/screenshots/*.webp (needs cwebp: `brew install webp`).
set -e
cd "$(dirname "$0")"
mkdir -p ../../branding/screenshots
for f in out/*.png; do
  cwebp -quiet -q 90 "$f" -o "../../branding/screenshots/$(basename "$f" .png).webp"
done
ls -la ../../branding/screenshots
