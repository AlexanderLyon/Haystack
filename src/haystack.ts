/*
 * Haystack.js
 * By Alexander Lyon
 * https://github.com/AlexanderLyon/Haystack
 */

const stemmer = require('stemmer');

interface IOptions {
  caseSensitive: boolean;
  flexibility: number;
  stemming: boolean;
  exclusions: string[];
  ignoreStopWords: boolean;
}

type SearchPool = string[] | object;

class Haystack {
  private options: IOptions;

  constructor(...args: any[]) {
    // Default options:
    const defaults = {
      caseSensitive: false,
      flexibility: 2,
      stemming: false,
      exclusions: [],
      ignoreStopWords: false,
    };

    // Override defaults with passed in options:
    if (args[0] && typeof args[0] === 'object') {
      this.options = extendDefaults(defaults, args[0]);
    } else {
      this.options = defaults;
    }
  }

  /**
   * Returns an array of matches
   * @param {string} query phrase to search for
   * @param {string[]|Object} source data to search
   * @param {number} [limit=1] maximum number of results returned
   * @return {Array} Sorted array of matches
   */
  public search(query: string, source: SearchPool, limit: number = 1): string[] {
    const results: string[] = [];
    const sourceDataType = getDataType(source);

    try {
      if (typeof query !== 'string' || !query.trim().length) {
        throw new Error('Invalid search query');
      } else if (sourceDataType !== 'array' && sourceDataType !== 'object') {
        throw new Error('Invalid source type: ' + typeof source);
      }
    } catch (e) {
      console.error(e.message);
      return results;
    }

    query = prepareQuery(query, this.options);
    const tokens = this.tokenize(query);

    /* Search */
    let searchResults: string[] = [];
    if (sourceDataType === 'array') {
      searchResults = searchArray(source, query, tokens, this.options);
    } else if (sourceDataType === 'object') {
      searchResults = searchObject(source, query, tokens, this.options);
    }

    if (searchResults.length > 0) {
      const sorted = sortResults(createUniqueArray(searchResults), query).slice(0, limit);
      results.push(...sorted);
    }

    return results;
  }

  /**
   * Splits a string into tokens based on specified delimiter
   * @param {string} input text to tokenize
   * @param {string} delimiter the points where the split should occur
   * @return {Array} array of tokens
   */
  public tokenize(input: string, delimiter: string = ' '): string[] {
    return input.split(delimiter);
  }
}

/** Extends defaults with user options */
function extendDefaults(defaults: IOptions, properties: object): IOptions {
  for (let property in properties) {
    if (properties.hasOwnProperty(property)) {
      defaults[property] = properties[property];
    }
  }
  return defaults;
}

/**
 * Cleans and formats query based on defined options
 * @param {string} query phrase to search for
 * @param {Object} options user-defined options
 * @return {string} new query
 */
function prepareQuery(query: string, options: IOptions): string {
  let tokens;

  if (options.ignoreStopWords) {
    query = removeStopWords(query);
  }

  if (options.exclusions?.length) {
    options.exclusions.forEach((item) => {
      query = query.replace(item, '');
    });
  }

  if (options.caseSensitive) {
    query = query.trim();
    tokens = query.split(' ');
  } else {
    query = query.trim().toLowerCase();
    tokens = query.split(' ');
  }

  if (options.stemming) {
    for (let i = 0; i < tokens.length; i++) {
      tokens[i] = stemmer(tokens[i]);
    }
    query = tokens.join(' ');
  }

  return query;
}

/**
 * Searches an array for token matches
 * @param {Array} source data to search
 * @param {string} query phrase to search for
 * @param {Array} tokens tokenized query
 * @param {Object} options user-defined options
 * @return {Array} results
 */
function searchArray(source: string[], query: string, tokens: string[], options: IOptions): string[] {
  let currentResults = [];

  for (let i = 0; i < source.length; i++) {
    // Make sure value is a string:
    source[i] = options.caseSensitive ? String(source[i]) : String(source[i]).toLowerCase();

    // Test if every token is found:
    let allTokensFound = true;
    for (let j = 0; j < tokens.length; j++) {
      if (source[i].indexOf(tokens[j]) === -1) {
        allTokensFound = false;
        break;
      }
    }

    if (allTokensFound) {
      // Exact match
      currentResults.push(source[i]);
    } else if (
      options.flexibility > 0 &&
      levenshtein(query.toLowerCase(), source[i].toLowerCase()) <= options.flexibility
    ) {
      // Flexibility is set, and this value is within acceptable range
      currentResults.push(source[i]);
    }
  }

  return currentResults;
}

/**
 * Recursively searches an object for token matches
 * @param {Object} obj data to search
 * @param {string} query phrase to search for
 * @param {Array} tokens tokenized query
 * @param {Object} options user-defined options
 * @param {Array} currentResults results saved between recursions
 * @return {Array} results
 */
function searchObject(
  obj: object,
  query: string,
  tokens: string[],
  options: IOptions,
  currentResults: string[] = []
): string[] {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value: object | string = obj[key];

      if (getDataType(value) === 'object') {
        currentResults = searchObject(value, query, tokens, options, currentResults);
      } else {
        // Make sure value is a string:
        value = options.caseSensitive ? String(value) : String(value).toLowerCase();

        // Test if every token is found:
        let allTokensFound = true;
        for (let i = 0; i < tokens.length; i++) {
          if (value.indexOf(tokens[i]) === -1) {
            allTokensFound = false;
            break;
          }
        }

        if (allTokensFound) {
          // Exact match
          currentResults.push(value);
        } else if (
          options.flexibility > 0 &&
          levenshtein(query.toLowerCase(), value.toLowerCase()) <= options.flexibility
        ) {
          // Flexibility is set, and this value is within acceptable range
          currentResults.push(value);
        }
      }
    }
  }

  return currentResults;
}

/**
 * Returns numeric Levenshtein distance between two strings
 * @param {string} word1 first word
 * @param {string} word2 second word
 * @return {number} Levenshtein distance
 */
function levenshtein(word1: string, word2: string): number | void {
  /* Returns numeric Levenshtein distance between two strings */
  let cost = [];
  let n = word1.length;
  let m = word1.length;
  let i;
  let j;
  const minimum = (a, b, c) => {
    let min = a;
    if (b < min) {
      min = b;
    }
    if (c < min) {
      min = c;
    }
    return min;
  };
  if (n == 0) {
    return;
  }
  if (m == 0) {
    return;
  }
  for (let i = 0; i <= n; i++) {
    cost[i] = [];
  }
  for (i = 0; i <= n; i++) {
    cost[i][0] = i;
  }
  for (j = 0; j <= m; j++) {
    cost[0][j] = j;
  }
  for (i = 1; i <= n; i++) {
    let x = word1.charAt(i - 1);
    for (j = 1; j <= m; j++) {
      let y = word2.charAt(j - 1);
      if (x == y) {
        cost[i][j] = cost[i - 1][j - 1];
      } else {
        cost[i][j] = 1 + minimum(cost[i - 1][j - 1], cost[i][j - 1], cost[i - 1][j]);
      }
    }
  }
  return cost[n][m];
}

/** Sorts results in ascending order */
function sortResults(results: string[], query: string): string[] {
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < results.length; i++) {
      if (results[i] && results[i + 1] && levenshtein(query, results[i]) > levenshtein(query, results[i + 1])) {
        let temp = results[i];
        results[i] = results[i + 1];
        results[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return results;
}

/** Removes duplicates from an array */
function createUniqueArray(arr: any[]) {
  return arr.filter((item, i) => arr.indexOf(item) === i);
}

/** Returns a more specific data type */
function getDataType(source: any): string {
  if (source) {
    if (Array.isArray(source)) {
      return 'array';
    } else if (typeof source === 'object' && source.constructor === Object) {
      return 'object';
    } else if (typeof source === typeof 'string' && source.constructor === String) {
      return 'string';
    }
  }

  return 'undefined';
}

/** Filters out common stop words from the query */
function removeStopWords(query: string): string {
  const stopWords: string[] = ['the', 'a', 'to', 'on', 'in', 'is', 'of', 'and'];
  const words: string[] = query.split(' ').filter((word) => !stopWords.includes(word));
  return words.join(' ');
}

module.exports = Haystack;
