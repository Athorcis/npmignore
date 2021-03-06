'use strict';

/**
 * Module dependencies
 */

var uniq = require('array-uniq');
var comment = [
  '# npmignore - content above this line is automatically generated and modifications may be omitted',
  '# see npmjs.com/npmignore for more details.'
].join('\n');
var re = /#\s*npmignore/;

/**
 * Create or update a .npmignore file.
 *
 * @param  {String} `npm` String, from `.npmignore`
 * @param  {String} `git` String, from `.gitignore`
 * @param  {Object} `options`
 * @return {String}
 */

module.exports = function npmignore(npm, git, options) {
  if (typeof git !== 'string' && typeof options !== 'object') {
    options = git;
    git = '';
  }

  options = options || {};

  if (git.hasOwnProperty('ignore') && git.hasOwnProperty('attributes')) {
    if (typeof git.ignore === 'string') {
      git.ignore = split(git.ignore);
    }

    if (typeof git.attributes === 'string') {
      git.attributes = parseGitAttributes(git.attributes);
    }

    git = [].concat(git.ignore, git.attributes);
  } else if (typeof git === 'string') {
    git = split(git);
  }

  // get the relevant lines from `.npmignore`
  if (typeof npm === 'string') {
    npm = extract(npm, {npmignored: options.keepdest});
  }

  if (options.unignore) {
    git = diff(git, arrayify(options.unignore));
    npm = diff(npm, arrayify(options.unignore));
  }

  // Remove the comment, we re-add later
  npm = diff(npm, comment.concat('#npmignore # npmignore'));
  npm = diff(npm, git);

  if (options.ignore) {
    npm = npm.concat(arrayify(options.ignore));
  }

  return format(git, uniq(npm));
}

/**
 * Extract relevant lines from `.npmignore`
 *
 * @param  {String} `npmignore` string
 * @return {Array} Array of lines
 */

function extract(npmignore, options) {
  if (npmignore == null) {
    throw new Error('npmignore expects a string.');
  }

  var lines = split(npmignore);
  var len = lines.length;
  var npmignored = options.npmignored || false;
  var git = [];
  var npm = [];
  var i = 0;

  while (i < len) {
    var line = lines[i++];
    if (!npmignored && re.test(line)) {
      npmignored = true;
    }

    if (npmignored) {
      npm.push(line);
    } else {
      git.push(line);
    }
  }

  return npm;
}

/**
 * Expose `extract` function
 */

module.exports.extract = extract;

/**
 * Rebuild array back into newline delimited,
 * merging .gitignore, .npmignore extras &
 * comments (expcted output).
 *
 * @param  {String} `str`
 * @return {Array}
 * @api private
 */

function format(git, npm) {
  git = Array.isArray(git) ? git.join('\n') : git;
  npm = Array.isArray(npm) ? npm.join('\n') : npm;

  var res = '';

  if (git) {
    res += git;
  }

  res += '\n\n' + comment + '\n';

  if (npm) {
    res += npm;
  }

  return res;
}

/**
 * Normalize newlines and split the string
 * into an array.
 *
 * @param  {String} `str`
 * @return {Array}
 * @api private
 */

function split(str) {
  return (str || '\n\n')
    .replace(/\r/g, '')
    .split('\n');
}

function parseGitAttributes(str) {
  var result = [];
  var lines = split(str);
  var rIgnore = /^(\s*(.+?)\s+export-ignore\s*)$/;
  var rComments = /^(# Rules from:.+)$/;

  lines.forEach(function (line) {
    if (rIgnore.test(line)) {
      result.push(line.replace(rIgnore, '$2'));
    } else if (rComments.test(line)) {
      result.push(line);
    }
  });

  return result;
}

/**
 * Remove unwanted elements and uniquify the
 * given `array`.
 *
 * @param  {Array} `array` The array to uniquify
 * @return {Array} `remove` Array of elements to remove
 * @api private
 */

function diff(arr, remove) {
  if (arr == null) {
    return [];
  }

  if (remove == null) {
    return arr;
  }

  var res = [];
  var len = arr.length;
  var i = 0;

  while (i < len) {
    var ele = arr[i++];

    if (remove.indexOf(ele) === -1) {
      res.push(ele);
    }
  }

  return res;
}

/**
 * Coerce the value to an array.
 *
 * @param  {*} val
 * @return {Array}
 * @api private
 */

function arrayify(val) {
  return Array.isArray(val) ? val : [val];
}
