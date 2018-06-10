# Haystack
[![npm](https://img.shields.io/npm/v/haystack-search.svg?style=flat-square)](https://www.npmjs.com/package/haystack-search)

## Overview:
Haystack is a simple search / suggestion module that doesn't require any dependencies to run. Just provide a way for your users to enter their query and the source data to search (as an array or object), and Haystack will return a list of approximate matches. The lower the `flexibility` the more strict your matches will be.

**For an easy to implement UI version which includes a pre-built search field and suggestion dropdown, see [Haystack UI](https://github.com/AlexanderLyon/Haystack-UI "Haystack UI")**

## Installation:
Add Haystack to your project:
```shell
npm i haystack-search
```

Import Haystack into your script:
```javascript
import Haystack from 'haystack-search';
```
```javascript
const haystack = new Haystack(options);
```

## Options:
`flexibility` *number* -- "Fuzziness" of search. The lower the number, the more strict your matches will be. (If set to `0`, Haystack will only look for perfect matches)

`caseSensitive` *boolean* -- Whether or not search is case sensitive

`exclusions` *string* -- Add a string or regex to ignore in query

`ignoreStopWords` *boolean* -- Ignore common stop words such as the, a, in, etc.

`stemming` *boolean* -- Experimental, only removes "s" from end of words for now


## Methods:
```javascript
haystack.search(searchTerm, source, [limit]);
```

Returns either an array of matches within your `flexibility` range, or `null` if there are no matches. If no limit is given, the default number of results will be 1.

```javascript
haystack.tokenize(searchTerm, [delimiter]);
```

By default this splits on whitespaces, but you can define a custom delimiter to use instead.

## Contributions:

Contributions and suggestions for improvement are always welcome! Some features planned for future versions include:

- Recursive object property searching

- Improved stemming

## License

MIT
