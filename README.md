<p align="center">
  <img src="https://raw.githubusercontent.com/AlexanderLyon/Haystack/Development/assets/header.png" alt="Haystack"/>
</p>

## Overview:

Haystack is a simple search / suggestion plugin that doesn't require any dependencies to run. Just provide a way for your users to enter their query and the source data to search (as an array or object), and Haystack will return a list of approximate matches. The lower the `flexibility` the more strict your matches will be.

## To initialize Haystack:

```javascript
const haystack = new Haystack({
  caseSensitive: false,
  flexibility: 2,
  stemming: false,
  exclusions: /[0-9]+/g,
  ignoreStopWords: true
});
```

## Methods:

```javascript
haystack.search(searchTerm, source, [limit]);
```

Returns either an array of matches within your `flexibility` range, or `null` if there are no matches. If no limit is given, the default number of results will be 1.

```javascript
haystack.tokenize(searchTerm, [delimiter]);
```

By default this splits on whitespaces, but you can define a custom delimiter to use instead.

## Features coming soon:

Contributions and suggestions for improvement are always welcome! Some features planned for future versions include:

- Recursive object property searching

- Improved stemming

## License

MIT
