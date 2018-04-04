/*
 * Haystack.js
 * By: Alexander Lyon
 * Version 3.1
 * https://github.com/AlexanderLyon/Haystack
 */

(function() {
  'use strict';

  window.Haystack = function() {
    this.caseSensitive = null;    // Does capitalization matter?
    this.flexibility = null;      // How strict or loose search matches and suggestions are
    this.stemming = null;         // Reduces words to a more basic form
    this.exclusions = null;       // Which characters are ignored in search queries
    this.ignoreStopWords = null;  // Ignore words unimportant to query

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




  /********** Public methods: **********/

  Haystack.prototype.search = function( query, source, limit=1 ) {
    /* -------------------------------------------------------
      Returns an array of matches, or null if no matches are found
      The accuracy of these results is determined by the value set for 'flexibility'
      The maximum results returned is determined by the optional 'limit' parameter
     ------------------------------------------------------- */
    const caseSensitive = this.options.caseSensitive;
    const flexibility = this.options.flexibility;
    const stemming = this.options.stemming;
    const exclusions = this.options.exclusions;
    const ignoreStopWords = this.options.ignoreStopWords;
    let results = [];
    let tokens;

    if(query != "") {

      /* Prepare query */

      if( ignoreStopWords ){
        query = removeStopWords(query);
      }

      if( exclusions ){
        query = query.replace(exclusions, "");
      }

      if( caseSensitive ){
        query = query.trim();
        tokens = this.tokenize(query);
      } else if( getDataType(source) === 'array' ){
        query = query.trim().toLowerCase();
        tokens = this.tokenize(query);
        source = source.map(function(e){ return e.toLowerCase(); });
      } else if( getDataType(source) === 'object' ){
        query = query.trim().toLowerCase();
        tokens = this.tokenize(query);
        for(key in source){ source[key] = source[key].toLowerCase(); }
      }

      if ( stemming ){
        // Removes 's' from the end of words, then rebuilds the query
        query = "";
        for(let i=0; i< tokens.length; i++) {
          let lastChar = tokens[i].substr(tokens[i].length - 1);
          if ( lastChar === 's'){ tokens[i] = tokens[i].slice(0, -1); }
          if(i < tokens.length - 1){
            query = query.concat(tokens[i] + " ");
          } else {
            query = query.concat(tokens[i]);
          }
        }
      }


      /* Search */
      //console.log('Searching for "' + query + '"');

      if( getDataType(source) === 'array' ) {

        // Test if EVERY token is found:
        for(let i=0; i<source.length; i++){
          let allTokensFound = true;
          for(let j=0; j<tokens.length; j++){
            if(source[i].indexOf(tokens[j]) == -1 ){
              allTokensFound = false;
              break;
            }
          }
          if( allTokensFound ){ results.push(source[i]); }
        }

        // Test if SOME tokens are found:
        for(let i=0; i<source.length; i++){
          for(let j=0; j<tokens.length; j++){
            if( source[i].indexOf(tokens[j]) != -1 ){
              results.push(source[i]);
            }
          }
        }


        // If flexibility is set, find similar phrases within acceptable flexibility range:
        if( flexibility > 0 ){
          let similarWords = getSimilarWords(query, source, null, flexibility);
          if( similarWords != null ){
            for(let i=0; i<similarWords.length; i++){
              results.push( similarWords[i] );
            }
          }
        }
      }

      else if( getDataType(source) === 'object' ) {
        for( let key in source ) {
          const value = source[key];

          // Test if EVERY token is found:
          let allTokensFound = true;
          for(let i=0; i<tokens.length; i++){
            if( value.indexOf(tokens[i]) == -1 ){
              allTokensFound = false;
              break;
            }
          }
          if( allTokensFound ){ results.push(value); }

          // Test if SOME tokens are found:
          for(let i=0; i<tokens.length; i++){
            if( value.indexOf(tokens[i]) != -1 ){
              results.push(value);
            }
          }


          // If flexibility is set, test if this value is close enough to the query:
          if( flexibility > 0 ){
            if( levenshtein(query.toLowerCase(), value.toLowerCase()) <= flexibility ){
              results.push(value);
            }
          }

        }
      }

      // Sort and return either the results array, or null:
      if( results == "" ){
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





  Haystack.prototype.tokenize = function( input, delimiter = " " ) {
    /* -------------------------------------------------------
      Splits string into tokens based on specified delimiter
     ------------------------------------------------------- */
    return input.split(delimiter);
  }





  /********** Private methods: **********/

  /* Extends defaults with user options */
  function extendDefaults(defaults, properties) {
    let property;
    for(property in properties) {
      if( properties.hasOwnProperty(property) ) {
        defaults[property] = properties[property];
      }
    }
    return defaults;
  }



  /* Returns numeric Levenshtein distance between two strings */
  function levenshtein(word1, word2) {
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



  /* Returns an array of suggested words */
  function filter(fn, source, bind) {
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



  /* Returns an array of similar words, with a specified limit */
  function getSimilarWords(input, source, limit, threshold=2){
    let resultSet = [];

    // Input is within threshold of some source value:
    let matches = filter(
      function(sourceWord) {
        let levDist = levenshtein(input, sourceWord);
        if ( levDist >= 0 && levDist <= threshold ) {
          return sourceWord;
        }
      }, source);

    matches = sortResults(matches, input);

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
    let swapped;
    do {
      swapped = false;
      for(let i = 0; i < results.length; i++) {
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
    let uniqueArray = arr.filter(function(item, pos) {
      return arr.indexOf(item) == pos;
    });
    return uniqueArray;
  }



  /* Since arrays are technically objects, this helps to differentiate the two */
  function getDataType(source){
    if( source && typeof source === 'object' && source.constructor === Array ){
      return "array";
    } else if( source && typeof source === 'object' && source.constructor === Object ){
      return "object";
    } else {
      return null;
    }
  }



  /* Removes stop words from the query */
  function removeStopWords(query) {
    let words = query.split(" ");
    let newQuery = [];

    //Mark stop word tokens as 'undefined'
    for( let i=0; i<words.length; i++){
      switch( words[i].toLowerCase() ){
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

    //Only move elements that are defined to 'newQuery' array
    for(let i=0; i<words.length; i++){
      if(words[i] != undefined){
        newQuery.push(words[i])
      }
    }

    return newQuery.join(" ");
  }



}());
