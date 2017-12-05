/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 1.1
 */

(function() {

  this.Haystack = function() {
    this.caseSensitive = null;    // Does capitalization matter?
    this.flexibility = null;      // How strict search matches are
    this.levDistance = null;      // How similar suggestions are to original query
    this.exclusions = null;       // Which characters are omitted from search queries

    // Default options:
    var defaults = {
      caseSensitive: false,
      flexibility: 0,
      levDistance: 2,
      exclusions: null
    }

    // Override defaults with passed in options:
    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = extendDefaults(defaults, arguments[0]);
    } else {
      this.options = defaults;
    }
  }




  /********** Public methods: **********/

  Haystack.prototype.search = function( query, source ) {
    /* -------------------------------------------------------
      Returns an array of matches, or null if no matches are found
      The accuracy of these results is determined by the value set for 'flexibility'
     ------------------------------------------------------- */
    var caseSensitive = this.options.caseSensitive;
    var flexibility = this.options.flexibility;
    var exclusions = this.options.exclusions;
    var results = [];

    if( !caseSensitive ){
      query = query.trim().toLowerCase();
    } else {
      query = query.trim();
    }

    if( exclusions != null){
      query = query.replace(exclusions, "");
    }


    // First check for exact match of entire query:
    if( source.indexOf(query) != -1 ){
      results = query;
    }

    // If no results, tokenize and check for a similar match for each word:
    else if( flexibility > 0 ){
      var tokens = this.tokenize(query);
      for (let i = 0; i < tokens.length; i++) {
        results.push( this.getSuggestions(tokens[i], source, 1, flexibility) );
      }
    }

    // Still no matches, return null:
    else {
      results = null;
    }

    return results;
  }



  Haystack.prototype.getSuggestions = function( query, source, limit, threshold=this.options.levDistance ) {
    /* -------------------------------------------------------
      Returns an array of similar words
      The accuracy of these suggestions is determined by the threshold set for 'levDistance'
      Threshold is also an optional parameter for use by search()
     ------------------------------------------------------- */
    var suggestionSet = [];
    query = query.trim().toLowerCase();

    var suggestions = filter(
      function(word) {
        var levDist = levenshtein(query, word);
        if ( levDist >= 0 && levDist <= threshold ) {
          return word;
        }
      }, source);

    sortResults(suggestions, query);

    for(let i=0; i<limit; i++){
      suggestionSet.push( suggestions[i] );
    }

    return suggestionSet;
  }



  Haystack.prototype.tokenize = function( input, delimiter = " " ) {
    /* -------------------------------------------------------
      Splits string into tokens based on specified delimiter
     ------------------------------------------------------- */
    return input.split(delimiter);
  }





  /********** Private methods: **********/

  // Extends defaults with user options
  function extendDefaults(source, properties) {
    var property;
    for (property in properties) {
      if ( properties.hasOwnProperty(property) ) {
        source[property] = properties[property];
      }
    }
    return source;
  }



  /* Returns numeric Levenshtein distance between two strings */
  function levenshtein(word1, word2) {
    var cost = new Array(),
      str1 = word1,
      str2 = word2,
      n = str1.length,
      m = word1.length,
      i, j;
    var minimum = function(a, b, c) {
      var min = a;
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
    for (var i = 0; i <= n; i++) {
      cost[i] = new Array();
    }
    for (i = 0; i <= n; i++) {
      cost[i][0] = i;
    }
    for (j = 0; j <= m; j++) {
      cost[0][j] = j;
    }
    for (i = 1; i <= n; i++) {
      var x = str1.charAt(i - 1);
      for (j = 1; j <= m; j++) {
        var y = str2.charAt(j - 1);
        if (x == y) {
          cost[i][j] = cost[i - 1][j - 1];
        } else {
          cost[i][j] = 1 + minimum(cost[i - 1][j - 1], cost[i][j - 1], cost[i - 1][j]);
        }
      }
    }
    return cost[n][m];
  };



  /* Returns an array of suggested words */
  function filter(fn, source, bind) {
    var resultSet = [];
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



  /* Sorts results in ascending order using bubble sort */
  function sortResults(results, query) {
    var swapped;
    do {
      swapped = false;
      for(var i = 0; i < results.length; i++) {
        if(results[i] && results[i+1] && levenshtein(query,results[i]) > levenshtein(query,results[i+1]) ) {
          let temp = results[i];
          results[i] = results[i+1];
          results[i+1] = temp;
          swapped = true;
        }
      }
    } while(swapped);
    return results;
  }


}());
