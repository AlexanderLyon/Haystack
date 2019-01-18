/*
 * Haystack.js
 * By Alexander Lyon
 * Version 4.4.3
 * https://github.com/AlexanderLyon/Haystack
 */

const stemmer = require('stemmer');

class Haystack {
  constructor(...args) {
    // Default options:
    const defaults = {
      caseSensitive: false,
      flexibility: 2,
      stemming: false,
      exclusions: null,
      ignoreStopWords: false
    };

    // Override defaults with passed in options:
    if (args[0] && typeof args[0] === 'object') {
      this.options = extendDefaults(defaults, args[0]);
    }
    else {
      this.options = defaults;
    }
  }



  /**
   * Returns an array of matches, or null if no matches are found
   * @param {string} query phrase to search for
   * @param {string[]|Object} source data to search
   * @param {number} [limit=1] maximum number of results returned
   * @return {Array} Sorted array of matches
   */
  search(query, source, limit) {
    try {
      if (typeof query !== 'string') {
        throw new Error('Invalid search query');
      }
      else if ((typeof source === 'undefined') || (typeof source === 'number')) {
        throw new Error('Invalid source type: ' + typeof source);
      }
    }
    catch (e) {
      console.error(e);
      return;
    }

    limit = (typeof limit !== 'undefined') ? limit : 1;
    const sourceDataType = getDataType(source);
    source = (sourceDataType === 'string') ? this.tokenize(source) : source;
    let results = [];
    let tokens;

    if (query != '') {
      query = prepareQuery(query, this.options);
      tokens = this.tokenize(query);

      /* Search */
      let searchResults;
      switch (sourceDataType) {
        case 'array':
        case 'string':
          searchResults = searchArray(source, query, tokens, this.options);
          break;
        case 'object':
          searchResults = searchObject(source, query, tokens, this.options);
          break;
      }

      if (searchResults.length > 0) {
        for (let i=0; i<searchResults.length; i++) {
          results.push(searchResults[i]);
        }
      }

      // Sort and return either the results array, or null:
      if (results == '') {
        return null;
      }
      else {
        return sortResults( createUniqueArray(results), query ).slice(0, limit);
      }
    }
    else {
      // No query present
      return null;
    }
  }



  /**
   * Splits a string into tokens based on specified delimiter
   * @param {string} input text to tokenize
   * @param {string} delimiter the points where the split should occur
   * @return {Array} array of tokens
   */
  tokenize(input, delimiter) {
    delimiter = (typeof delimiter !== 'undefined') ? delimiter : ' ';
    return input.split(delimiter);
  }
}



/** Extends defaults with user options */
function extendDefaults(defaults, properties) {
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
function prepareQuery(query, options) {
  let tokens;

  if (options.ignoreStopWords) {
    query = removeStopWords(query);
  }

  if (options.exclusions) {
    query = query.replace(options.exclusions, '');
  }

  if (options.caseSensitive) {
    query = query.trim();
    tokens = query.split(' ');
  }
  else {
    query = query.trim().toLowerCase();
    tokens = query.split(' ');
  }

  if (options.stemming) {
    for (let i=0; i<tokens.length; i++) {
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
function searchArray(source, query, tokens, options) {
  let currentResults = [];

  for (let i=0; i<source.length; i++) {
    // Make sure value is a string:
    source[i] = options.caseSensitive ? String(source[i]) : String(source[i]).toLowerCase();

    // Test if every token is found:
    let allTokensFound = true;
    for (let j=0; j<tokens.length; j++) {
      if (source[i].indexOf(tokens[j]) === -1) {
        allTokensFound = false;
        break;
      }
    }

    if (allTokensFound) {
      // Exact match
      currentResults.push(source[i]);
    }
    else if ((options.flexibility > 0) && (levenshtein(query.toLowerCase(), source[i].toLowerCase()) <= options.flexibility)) {
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
function searchObject(obj, query, tokens, options, currentResults) {
  currentResults = (typeof currentResults !== 'undefined') ? currentResults : [];

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];

      if (getDataType(value) === 'object') {
        currentResults = searchObject(value, query, tokens, options, currentResults);
      }
      else {
        // Make sure value is a string:
        value = options.caseSensitive ? String(value) : String(value).toLowerCase();

        // Test if every token is found:
        let allTokensFound = true;
        for (let i=0; i<tokens.length; i++) {
          if (value.indexOf(tokens[i]) === -1) {
            allTokensFound = false;
            break;
          }
        }

        if (allTokensFound) {
          // Exact match
          currentResults.push(value);
        }
        else if ((options.flexibility > 0) && (levenshtein(query.toLowerCase(), value.toLowerCase()) <= options.flexibility)) {
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
function levenshtein(word1, word2) {
  /* Returns numeric Levenshtein distance between two strings */
  let cost = [];
  let str1 = word1;
  let str2 = word2;
  let n = str1.length;
  let m = word1.length;
  let i;
  let j;
  let minimum = function(a, b, c) {
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
    let x = str1.charAt(i - 1);
    for (j = 1; j <= m; j++) {
      let y = str2.charAt(j - 1);
      if (x == y) {
        cost[i][j] = cost[i - 1][j - 1];
      }
      else {
        cost[i][j] = 1 + minimum(cost[i - 1][j - 1], cost[i][j - 1], cost[i - 1][j]);
      }
    }
  }
  return cost[n][m];
}


/** Sorts results in ascending order */
function sortResults(results, query) {
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < results.length; i++) {
      if (results[i] && results[i+1] && levenshtein(query, results[i]) > levenshtein(query, results[i+1])) {
        let temp = results[i];
        results[i] = results[i+1];
        results[i+1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return results;
}


/** Removes duplicates from an array */
function createUniqueArray(arr) {
  let uniqueArray = arr.filter(function(item, pos) {
    return arr.indexOf(item) == pos;
  });
  return uniqueArray;
}


/** Returns a more specific data type */
function getDataType(source) {
  if (source) {
    if (typeof source === 'object' && source.constructor === Array) {
      return 'array';
    }
    else if (typeof source === 'object' && source.constructor === Object) {
      return 'object';
    }
    else if (typeof source === 'string' && source.constructor === String) {
      return 'string';
    }
  }
  else {
    return null;
  }
}


/** Removes common stop words from the query */
function removeStopWords(query) {
  let words = query.split(' ');
  let newQuery = [];

  // Mark stop word tokens as 'undefined'
  for (let i=0; i<words.length; i++) {
    switch (words[i].toLowerCase()) {
      case 'the':
      case 'a':
      case 'to':
      case 'on':
      case 'in':
      case 'is':
      case 'of':
      case 'and':
        words[i] = undefined;
        break;
    }
  }

  // Only move elements that are defined to 'newQuery' array
  for (let i=0; i<words.length; i++) {
    if (words[i] != undefined) {
      newQuery.push(words[i]);
    }
  }

  return newQuery.join(' ');
}


module.exports = Haystack;
