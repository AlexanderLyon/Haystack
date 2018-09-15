/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 4.4.0
 * https://github.com/AlexanderLyon/Haystack
 */


class Haystack {
  constructor() {
    // Default options:
    const defaults = {
      caseSensitive: false,
      flexibility: 2,
      stemming: false,
      wordnikAPIKey: null,
      exclusions: null,
      ignoreStopWords: false
    }

    // Override defaults with passed in options:
    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = extendDefaults(defaults, arguments[0]);
    } else {
      this.options = defaults;
    }
  }



  /**
   * Returns a promise that resolves with an array of matches, or null if no matches are found
   * @param {string} query user-entered query
   * @param {string[]|Object} source data to search
   * @param {number} [limit=1] maximum number of results returned
   */
  search(query, source, limit) {
    return new Promise( (resolve, reject) => {
      limit = (typeof limit !== 'undefined') ? limit : 1;
      const caseSensitive = this.options.caseSensitive;
      const stemming = this.options.stemming;
      const exclusions = this.options.exclusions;
      const ignoreStopWords = this.options.ignoreStopWords;
      const sourceDataType = getDataType(source);
      source = (sourceDataType === 'string') ? this.tokenize(source) : source;
      let results = [];
      let tokens;
      let that = this;

      if (query != "") {

        /* Prepare query */
        if (ignoreStopWords) {
          query = removeStopWords(query);
        }
        if (exclusions) {
          query = query.replace(exclusions, "");
        }

        // Perform stemming, or continue:
        checkForStemming(query, this.options).then( queryList => {

          queryList.forEach( thisQuery => {
            // Search using each possible query branch
            //console.log("Searching for: '" + thisQuery + "'");

            if (caseSensitive) {
              thisQuery = thisQuery.trim();
              tokens = that.tokenize(thisQuery);
            } else {
              thisQuery = thisQuery.trim().toLowerCase();
              tokens = this.tokenize(thisQuery);
            }

            /* Search */
            let searchResults;
            switch (sourceDataType) {
              case 'array':
              case 'string':
                searchResults = searchArray(source, thisQuery, tokens, this.options);
                break;
              case 'object':
                searchResults = searchObject(source, thisQuery, tokens, this.options);
                break;
            }

            if (searchResults.length > 0) {
              for (let i=0; i<searchResults.length; i++) {
                results.push(searchResults[i]);
              }
            }
          });
        })
        .then( () => {
          // Sort and return either the results array, or null:
          if (results == "") {
            resolve(null);
          } else {
            resolve( sortResults( createUniqueArray(results), query ).slice(0, limit) );
          }
        })
        .catch( err => {
          console.error(err);
        });

      }
      else {
        // No query present
        resolve(null);
      }

    });
  }



  /**
   * Splits a string into tokens based on specified delimiter
   * @param {string} input text to tokenize
   * @param {string} delimiter the points where the split should occur
   */
  tokenize(input, delimiter) {
    delimiter = (typeof delimiter !== 'undefined') ? delimiter : " ";
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

  return currentResults;
}


function checkForStemming(query, options) {
  return new Promise( (resolve, reject) => {
    let queryList = [query]; // A list of possible query branches

    if (options.stemming) {
      if (options.wordnikAPIKey) {
        let promises = [];
        let tempTokens = query.split(" ");

        for (let i=0; i<tempTokens.length; i++) {
          let getWords = getRelatedWords(tempTokens[i], options.wordnikAPIKey).then( relatedWords => {
            if (relatedWords.length) {
              for (let j=0; j<relatedWords.length; j++) {
                let newTokens = tempTokens;
                newTokens[i] = relatedWords[j];
                queryList.push(newTokens.join(" "));
              }
            }
          }).catch( err => {
            resolve(queryList);
          });

          promises.push(getWords);
        }

        Promise.all(promises).then(() => {
          resolve(queryList);
        });

      }
      else {
        console.error("Please supply a Wordnik API key to use stemming functionality");
        resolve(queryList);
      }
    }

    else {
      // Skip stemming
      resolve(queryList);
    }
  });
}


/**
 * Uses Wordnik API to fetch similar words
 * @param {string} word original word
 * @param {string} apiKey Wordnik API key
 */
function getRelatedWords(word, apiKey) {
  /* Returns 5 relatedWords for chosen word */
  return new Promise((resolve, reject) => {
    const http = require('https');

    http.get('https://api.wordnik.com/v4/word.json/' + word + '/relatedWords?useCanonical=false&limitPerRelationshipType=5&api_key=' + apiKey, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => {
        result = JSON.parse(data);
        if (result.length) {
          let relatedWords = [];
          result.forEach(i => {
            switch (i.relationshipType) {
              case "variant":
              case "verb-form":
              case "same-context":
                relatedWords = relatedWords.concat(i.words);
                break;
            }
          });
          resolve(relatedWords);
        }
        else {
          reject();
        }

      });

    });
  });

}


/**
 * Returns numeric Levenshtein distance between two strings
 * @param {string} word1 first word
 * @param {string} word2 second word
 */
function levenshtein(word1, word2) {
  /* Returns numeric Levenshtein distance between two strings */
  let cost = new Array(),
    str1 = word1,
    str2 = word2,
    n = str1.length,
    m = word1.length,
    i, j;
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
    cost[i] = new Array();
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
      } else {
        cost[i][j] = 1 + minimum(cost[i - 1][j - 1], cost[i][j - 1], cost[i - 1][j]);
      }
    }
  }
  return cost[n][m];
};


function filter(fn, source, bind) {
  /* Returns an array of suggested words */
  let resultSet = [];
  for (let i = 0, word; i < source.length; i++) {
    if (i in source) {
      word = source[i];
      if (fn.call(bind, word, i, source)) {
        resultSet.push(word);
      }
    }
  }
  return resultSet;
};


function sortResults(results, query) {
  /* Sorts results in ascending order */
  let swapped;
  do {
    swapped = false;
    for (let i = 0; i < results.length; i++) {
      if (results[i] && results[i+1] && levenshtein(query,results[i]) > levenshtein(query,results[i+1])) {
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
      return "array";
    } else if (typeof source === 'object' && source.constructor === Object) {
      return "object";
    } else if (typeof source === 'string' && source.constructor === String) {
      return "string";
    }
  }
   else {
    return null;
  }
}


function removeStopWords(query) {
  /* Removes common stop words from the query */
  let words = query.split(" ");
  let newQuery = [];

  // Mark stop word tokens as 'undefined'
  for (let i=0; i<words.length; i++) {
    switch (words[i].toLowerCase()) {
      case "the":
      case "a":
      case "to":
      case "on":
      case "in":
      case "is":
      case "of":
      case "and":
        words[i] = undefined;
        break;
    }
  }

  // Only move elements that are defined to 'newQuery' array
  for (let i=0; i<words.length; i++) {
    if (words[i] != undefined) {
      newQuery.push(words[i])
    }
  }

  return newQuery.join(" ");
}



module.exports = Haystack;
