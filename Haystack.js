/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 4.3.0
 * https://github.com/AlexanderLyon/Haystack
 */


class Haystack {
  constructor() {
    // Default options:
    const defaults = {
      caseSensitive: false,
      flexibility: 2,
      stemming: false,
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



  search(query, source, limit) {
    /* -------------------------------------------------------
      Returns an array of matches, or null if no matches are found
      The accuracy of these results is determined by the value set for 'flexibility'
      The maximum results returned is determined by the optional 'limit' parameter
     ------------------------------------------------------- */
    limit = (typeof limit !== 'undefined') ? limit : 1;
    const caseSensitive = this.options.caseSensitive;
    const flexibility = this.options.flexibility;
    const stemming = this.options.stemming;
    const exclusions = this.options.exclusions;
    const ignoreStopWords = this.options.ignoreStopWords;
    const sourceDataType = getDataType(source);
    source = (sourceDataType === 'string') ? this.tokenize(source) : source;
    let results = [];
    let tokens;

    if (query != "") {
      /* Prepare query */

      if (ignoreStopWords) {
        query = removeStopWords(query);
      }

      if (exclusions) {
        query = query.replace(exclusions, "");
      }

      if (caseSensitive) {
        query = query.trim();
        tokens = this.tokenize(query);
      } else {
        query = query.trim().toLowerCase();
        tokens = this.tokenize(query);
      }


      if (stemming) {
        // Removes 's' from the end of words, then rebuilds the query
        query = "";
        for (let i=0; i< tokens.length; i++) {
          let lastChar = tokens[i].substr(tokens[i].length - 1);
          if (lastChar === 's') {
            tokens[i] = tokens[i].slice(0, -1);
          }
          if (i < tokens.length - 1) {
            query = query.concat(tokens[i] + " ");
          } else {
            query = query.concat(tokens[i]);
          }
        }
      }


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
      if (results == "") {
        return null;
      } else {
        return sortResults( createUniqueArray(results), query ).slice(0, limit);
      }

    }
    else {
      // No query present
      return null;
    }
  }



  tokenize(input, delimiter) {
    /* -------------------------------------------------------
      Splits string into tokens based on specified delimiter
     ------------------------------------------------------- */
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
      currentResults.push(source[i]);
    }

    // If flexibility is set, test if this value is within acceptable range:
    if (options.flexibility > 0) {
      if (levenshtein(query.toLowerCase(), source[i].toLowerCase()) <= options.flexibility) {
        currentResults.push(source[i]);
      }
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
      if (allTokensFound) { currentResults.push(value); }

      // If flexibility is set, test if this value is within acceptable range:
      if (options.flexibility > 0) {
        if (levenshtein(query.toLowerCase(), value.toLowerCase()) <= options.flexibility) {
          currentResults.push(value);
        }
      }
    }

  }

  return currentResults;
}


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


function getSimilarWords(input, source, limit, threshold) {
  /* Returns an array of similar words, with a specified limit */
  threshold = (typeof threshold !== 'undefined') ? threshold : 2;
  let resultSet = [];

  // Input is within threshold of some source value:
  let matches = filter(
    function(sourceWord) {
      let levDist = levenshtein(input, sourceWord);
      if (levDist >= 0 && levDist <= threshold) {
        return sourceWord;
      }
    }, source);

  matches = sortResults(matches, input);

  if (limit) {
    for (let i=0; i<limit; i++) {
      resultSet.push( matches[i] );
    }
  }
  else {
    return matches;
  }

  return resultSet;
}


function sortResults(results, query) {
  /* Sorts results in ascending order using bubble sort */
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


function getDataType(source){
  /* Since arrays are technically objects, this helps to differentiate the two */
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
  /* Removes stop words from the query */
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
