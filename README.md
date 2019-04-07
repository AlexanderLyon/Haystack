# Haystack
[![npm](https://img.shields.io/npm/v/haystack-search.svg?style=flat-square)](https://www.npmjs.com/package/haystack-search)

[![npm](https://img.shields.io/npm/dt/:haystack-search.svg?style=flat-square](https://www.npmjs.com/package/haystack-search)

## Overview
Haystack is a lightweight search / suggestion module that can be used to find similar matches to a word. Just provide a way for your users to enter their query and the source data to search (as an array, object, or string), and Haystack will return a list of approximate matches. The lower the `flexibility` the more strict your matches will be.

**For the UI React component version which includes a pre-built search field and suggestion dropdown, see [Haystack UI](https://github.com/AlexanderLyon/Haystack-UI "Haystack UI")**

## Installation
Using npm:
```shell
npm i haystack-search
```

Require Haystack in your Node project:
```javascript
const Haystack = require('haystack-search');
```
```javascript
const haystack = new Haystack(options);
```

## Options
| Option      | Default     | Description |
| ----------- | ----------- | ----------- |
| `flexibility` (*number*)      | 2       | "Fuzziness" of search. The lower the number, the more strict your matches will be. (If set to `0`, Haystack will only look for perfect matches) |
| `caseSensitive` (*boolean*)   | false        | Whether or not search is case sensitive |
| `exclusions` (*string*)   | null        | Add a string or regex to ignore in query |
| `ignoreStopWords` (*boolean*)   | false        | Ignore common stop words such as the, a, in, etc. |
| `stemming` (*boolean*)   | false        | Reduces tokens in a query to their base words using [stemmer](https://github.com/words/stemmer "stemmer") |


## Methods
```javascript
haystack.search(searchTerm, source, [limit]);
```

Returns either an array of matches within your `flexibility` range, or `null` if there are no matches. If no limit is given, the default number of results will be 1.

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

[MIT](https://github.com/AlexanderLyon/Haystack/blob/master/LICENSE "MIT License")
