# Haystack

[![npm](https://img.shields.io/npm/v/haystack-search.svg?style=flat-square)](https://www.npmjs.com/package/haystack-search)
[![npm](https://img.shields.io/npm/dt/haystack-search.svg?style=flat-square)](https://www.npmjs.com/package/haystack-search)

## Overview

Haystack is a lightweight search / suggestion library that can be used to find similar matches to a word. Just provide the source data to search against (as an array or object), and Haystack will return a list of approximate matches. The lower the `flexibility` the more strict your matches will be.

## Installation

Using npm:

```shell
npm i haystack-search
```

Import Haystack into your project:

```javascript
import Haystack from 'haystack-search';
// or
const Haystack = require('haystack-search');
```

```javascript
const haystack = new Haystack(options);
```

## Options

| Option                        | Default | Description                                                                                                                                     |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `flexibility` (_number_)      | 2       | "Fuzziness" of search. The lower the number, the more strict your matches will be. (If set to `0`, Haystack will only look for perfect matches) |
| `caseSensitive` (_boolean_)   | false   | Whether or not search is case sensitive                                                                                                         |
| `exclusions` (_array_)        | []      | An array of strings or regexes to ignore in query                                                                                               |
| `ignoreStopWords` (_boolean_) | false   | Ignore common stop words such as the, a, in, etc.                                                                                               |
| `stemming` (_boolean_)        | false   | Reduces tokens in a query to their base words using [stemmer](https://github.com/words/stemmer 'stemmer')                                       |

## Methods

```javascript
haystack.search(searchTerm, source, [limit]);
```

Returns an array of matches within your `flexibility` range. If no limit is given, the default number of results will be 1.

```javascript
haystack.tokenize(searchTerm, [delimiter]);
```

Returns an array of tokens. By default this splits on whitespaces, but you can define a custom delimiter to use instead.

## Contributions

Contributions and suggestions for improvement are always welcome!

1. Fork this repo (<https://github.com/AlexanderLyon/Haystack/fork>)
2. Create your new feature branch
3. Commit changes and push
4. Create a new Pull Request

## License

[MIT](https://github.com/AlexanderLyon/Haystack/blob/master/LICENSE 'MIT License')
