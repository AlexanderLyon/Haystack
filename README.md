# Haystack
[![npm](https://img.shields.io/npm/v/haystack-search.svg?style=flat-square)](https://www.npmjs.com/package/haystack-search)

## Overview
Haystack is a lightweight search / suggestion module that can be used to find similar matches to a word. Just provide a way for your users to enter their query and the source data to search (as an array, object, or string), and Haystack will return a list of approximate matches. The lower the `flexibility` the more strict your matches will be.

Version 4.4.0 introduces Wordnik integration for stemming. One you've [signed up for an API key](https://developer.wordnik.com/ "API key") and added it to your Haystack options, this feature will become available to use. Remember to keep your API key private at all times!

**For an easy to implement UI version which includes a pre-built search field and suggestion dropdown, see [Haystack UI](https://github.com/AlexanderLyon/Haystack-UI "Haystack UI")**

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
`flexibility` *number* -- "Fuzziness" of search. The lower the number, the more strict your matches will be. (If set to `0`, Haystack will only look for perfect matches)

`caseSensitive` *boolean* -- Whether or not search is case sensitive

`exclusions` *string* -- Add a string or regex to ignore in query

`ignoreStopWords` *boolean* -- Ignore common stop words such as the, a, in, etc.

`stemming` *boolean* -- Experimental, requires a valid Wordnik API key

`wordnikAPIKey` *string* Wordnik API key used for stemming functionality


## Methods
```javascript
haystack.search(searchTerm, source, [limit]);
```

Returns a promise that resolves to either an array of matches within your `flexibility` range, or `null` if there are no matches. If no limit is given, the default number of results will be 1.

```javascript
haystack.tokenize(searchTerm, [delimiter]);
```

Returns an array of tokens. By default this splits on whitespaces, but you can define a custom delimiter to use instead.

## Contributions

Contributions and suggestions for improvement are always welcome!

## License

MIT
