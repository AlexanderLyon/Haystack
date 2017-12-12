/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 1.2
 *
 */

(function() {

  this.Haystack = function() {
    this.caseSensitive = null;    // Does capitalization matter?
    this.flexibility = null;      // How strict searche matches and suggestions are
    this.exclusions = null;       // Which characters are omitted from search queries

    // Default options:
    var defaults = {
      caseSensitive: false,
      flexibility: 1,
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

  Haystack.prototype.search = function( query, source, limit=1 ) {
    /* -------------------------------------------------------
      Returns an array of matches, or null if no matches are found
      The accuracy of these results is determined by the value set for 'flexibility'
      The maximum results returned is determined by the optional 'limit' parameter
     ------------------------------------------------------- */
    var caseSensitive = this.options.caseSensitive;
    var flexibility = this.options.flexibility;
    var exclusions = this.options.exclusions;
    var results = [];

    if(query != "") {

      if( !caseSensitive ){
        query = query.trim().toLowerCase();
        source = source.map(function(e){ return e.toLowerCase(); });
      } else {
        query = query.trim();
      }

      if( exclusions ){
        query = query.replace(exclusions, "");
      }


      // First check for exact match of entire query:
      if( source.indexOf(query) != -1 ){
        results.push(query);
      }

      // If flexibility is set, run a more comprehensive search:
      if( flexibility > 0 ){
        var tokens = this.tokenize(query);

        // Are all tokens found, just in a scrambled order?
        for(let i=0; i<source.length; i++){
          let allFound = true;
          for(let j=0; j<tokens.length; j++){
            if(source[i].indexOf(tokens[j]) == -1 ){
              allFound = false;
            }
          }
          if( allFound ){ results.push(source[i]); }
        }

        // Find similar phrases within this flexibility range:
        let similarWords = getSimilarWords(query, source, null, flexibility);
        if( similarWords != null ){
          for(let i=0; i<similarWords.length; i++){
            results.push( similarWords[i] );
          }
        }

      }

      // Sort and return our results array, or return null:
      if( results == "" ){
        return null;
      } else {
        // Remove duplicates and return array:
        let uniqueResults = createUniqueArray(results);
        return sortResults(uniqueResults, query).slice(0, limit);
      }
    }
    else {
      // No query present
      return null;
    }

  }



  Haystack.prototype.getSuggestions = function( query, source, limit=1 ) {
    /* -------------------------------------------------------
      Returns an array of suggested matches
      The accuracy of these suggestions is determined by the threshold set for 'flexibility'
      The maximum suggestions returned is determined by the optional 'limit' parameter
     ------------------------------------------------------- */
    var threshold = this.options.flexibility;
    var caseSensitive = this.options.caseSensitive;

    if( !caseSensitive ){
      query = query.trim().toLowerCase();
      source = source.map(function(e){ return e.toLowerCase(); });
    } else {
      query = query.trim();
    }

    var suggestions = getSimilarWords(query, source, limit, threshold);

    if( suggestions != ""){
      return suggestions;
    }
    else {
      return null;
    }
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



  /* Returns an array of similar words, with a specified limit */
  function getSimilarWords(input, source, limit, threshold=2){
    var resultSet = [];

    // Input is within threshold of some source value:
    var matches = filter(
      function(sourceWord) {
        var levDist = levenshtein(input, sourceWord);
        if ( levDist >= 0 && levDist <= threshold ) {
          return sourceWord;
        }
      }, source);

    var matches = sortResults(matches, input);

    if( limit ){
      for(let i=0; i<limit; i++){
        resultSet.push( matches[i] );
      }
    }
    else {
      return matches;
    }

    return resultSet;
  }



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



  /* Removes duplicates from an array */
  function createUniqueArray(arr) {
    uniqueArray = arr.filter(function(item, pos) {
      return arr.indexOf(item) == pos;
    });
    return uniqueArray;
  }


}());
