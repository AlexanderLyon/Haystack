/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 4.3.4
 * https://github.com/AlexanderLyon/Haystack
 */


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
   * @param {string} query user-entered query
   * @param {string[]|Object} source data to search
   * @param {number} [limit=1] maximum number of results returned
   * @return {Array} Sorted array of matches
   */
  search(query, source, limit) {
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



function extendDefaults(defaults, properties) {
  /* Extends defaults with user options */
  for (let property in properties) {
    if (properties.hasOwnProperty(property)) {
      defaults[property] = properties[property];
    }
  }
  return defaults;
}


function prepareQuery(query, options) {
  /* Cleans and formats query based on defined options */
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
    // Removes 's' from the end of words, then rebuilds the query
    query = '';
    for (let i=0; i< tokens.length; i++) {
      if (/s$/i.test(tokens[i])) {
        tokens[i] = tokens[i].slice(0, -1);
      }
      if (i < tokens.length - 1) {
        query = query.concat(tokens[i] + ' ');
      }
      else {
        query = query.concat(tokens[i]);
      }
    }
  }

  return query;
}


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


function searchObject(obj, query, tokens, options, currentResults) {
  /* Recursively searches an object for token matches */
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


function sortResults(results, query) {
  /* Sorts results in ascending order */
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


function createUniqueArray(arr) {
  /* Removes duplicates from an array */
  let uniqueArray = arr.filter(function(item, pos) {
    return arr.indexOf(item) == pos;
  });
  return uniqueArray;
}


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


function removeStopWords(query) {
  /* Removes common stop words from the query */
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
