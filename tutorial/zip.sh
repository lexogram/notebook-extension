for entry in *
do
  if [[ ! $entry == *"zip"* ]]; then
    zip -r zips/"$entry".zip "$entry" -x "*.DS_Store"
    echo "$entry"
  fi
done

# zip -r zips/13-toggle.zip 13-toggle -x "*.DS_Store"