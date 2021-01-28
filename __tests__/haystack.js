const Haystack = require('../dist/haystack');

describe('Array search', () => {
  const haystack = new Haystack({
    flexibility: 3,
    caseSensitive: false,
    exclusions: null,
    ignoreStopWords: true,
    stemming: false,
  });

  test('successfully completes search', () => {
    const result = haystack.search('jan', ['January', 'February', 'March'], 1);
    expect(result).toEqual(['january']);
  });

  test('lower flexibility yields more strict search results', () => {
    const moreStrictHaystack = new Haystack({
      flexibility: 0,
    });

    const result = moreStrictHaystack.search('jun', ['June', 'July', 'August'], 2);
    expect(result).toEqual(['june']);
  });

  test('higher flexibility yields less strict search results', () => {
    const lessStrictHaystack = new Haystack({
      flexibility: 2,
    });

    const result = lessStrictHaystack.search('jun', ['June', 'July', 'August'], 2);
    expect(result).toEqual(['june', 'july']);
  });

  test('respects case-sensitivity', () => {
    const caseSensitiveHaystack = new Haystack({
      caseSensitive: true,
    });

    const result = caseSensitiveHaystack.search('May', ['April', 'May']);
    expect(result).toEqual(['May']);
  });
});

describe('Object search', () => {
  const haystack = new Haystack({
    flexibility: 3,
    caseSensitive: false,
    exclusions: null,
    ignoreStopWords: true,
    stemming: false,
  });

  test('successfully completes search', () => {
    const sampleObj = {
      name: 'Joe',
      location: 'NY',
    };

    const result = haystack.search('joe', sampleObj, 1);
    expect(result).toEqual(['joe']);
  });
});

describe('Tokenization', () => {
  test('successfully tokenizes string', () => {
    const haystack = new Haystack({
      flexibility: 3,
      caseSensitive: false,
      exclusions: null,
      ignoreStopWords: true,
      stemming: false,
    });

    const tokens = haystack.tokenize('sample_sentence', '_');
    expect(tokens).toEqual(['sample', 'sentence']);
  });
});

describe('Error handling', () => {
  let consoleError;
  const haystack = new Haystack({
    flexibility: 3,
    caseSensitive: false,
    exclusions: null,
    ignoreStopWords: true,
    stemming: false,
  });

  beforeEach(() => {
    consoleError = jest.spyOn(global.console, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    consoleError.mockClear();
  });

  test('handles empty search query', () => {
    const result = haystack.search('', ['one', 'two']);
    expect(result).toEqual([]);
    expect(consoleError).toBeCalledTimes(1);
  });

  test('handles invalid source type', () => {
    const result = haystack.search('January', 5);
    expect(result).toEqual([]);
    expect(consoleError).toBeCalledTimes(1);
  });
});
