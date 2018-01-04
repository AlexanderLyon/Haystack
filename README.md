# Haystack
A Lightweight search plugin for JavaScript with zero dependencies

Just provide the input form and the source data to search (as an array or object)

## To initialize Haystack:

`var haystack = new Haystack({
  caseSensitive: false,
  flexibility: 2,
  stemming: false,
  exclusions: /[0-9]+/g,
  ignoreStopWords: true
});`

## Methods:

`haystack.search(searchTerm, source, [limit]);`

`haystack.tokenize(searchTerm, [delimiter]);`

## Features coming soon:

- Recursive object property searching

- Improved stemming
