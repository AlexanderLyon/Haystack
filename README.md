# Haystack
A Lightweight search plugin for JavaScript with zero dependencies

Just provide the input form and the source data to search (as an array)

## To initialize Haystack:

`var haystack = new Haystack({
  caseSensitive: false,
  flexibility: 2,
  exclusions: /[0-9]+/g
});`

## Methods:

`haystack.search(*searchTerm*, *source*, *[limit]*);`

`haystack.getSuggestions(*searchTerm*, *source*, *[limit]*);`

`haystack.tokenize(*searchTerm*, *[delimiter]*);`

## Features coming soon:

- Smarter searching (stemming, fuzzy searching, etc.)
- Ability to search object properties
