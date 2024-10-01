const crypto = require('crypto');
const phc = require('@phc/format');

// Default options
const defaultOptions = {
  hashlength: 32,
  saltlength: 16,
  pepper: '',
  cost: 16384, // CPU/memory cost (N)
  blockSize: 8, // Block size (r)
  parallelization: 1, // Parallelization (p)
  maxmem: 64 * 1024 * 1024, // Maximum memory in bytes (64 MB by default)
  strict: false,
};

const shorthand = {
  cost: 'N', // CPU/memory cost
  blockSize: 'r', // Block size
  parallelization: 'p', // Parallelization
};

let currentOptions = { ...defaultOptions };

/**
 * Normalize the options, allowing shorthand values ('N', 'r', 'p')
 * and merging with default options.
 *
 * @param {Object} [options={}] - The options to normalize.
 * @returns {Object} - The normalized options merged with defaults.
 */
function normalize(options = {}) {
  const opts = {...options};

  for (const opt in shorthand) {
    if (shorthand[opt] in opts) {
      opts[opt] = opts[shorthand[opt]];
      delete opts[shorthand[opt]];
    }
  }

  for (const opt in opts) {
    if (opts[opt] === undefined) {
      opts[opt] = defaultOptions[opt];
    }
  }
  return opts;
}

/**
 * Get options by combining default options and user-provided ones.
 *
 * @param {Object} [options={}] - The user-provided options.
 * @returns {Object} - The combined options.
 */
function getOptions(options = {}) {
  return { ...currentOptions, ...normalize(options) };
}

/**
 * Complement or get the current options.
 *
 * @param {Object} [options] - The new options to set.
 * @returns {Object} - The current options.
 */
function opts(options) {
  if (options) {
    currentOptions = getOptions(options);
  }
  return currentOptions;
}

/**
 * Hash a password using scrypt with a random salt.
 *
 * @param {string} password - The password to hash.
 * @param {Object} [options={}] - Options to override defaults.
 * @returns {Promise<string>} - The hashed password in format:
 * `<base64(hash)>$<base64(salt)>$<cost>$<blockSize>$<parallelization>`.
 */
async function hash(password, options = {}) {
  const combinedOptions = getOptions(options);
  
  const salt = crypto.randomBytes(combinedOptions.saltlength);
  const fullPassword = password + combinedOptions.pepper;

  return new Promise((resolve, reject) => {
    crypto.scrypt(fullPassword, salt, combinedOptions.hashlength, combinedOptions, (err, derivedKey) => {
      if (err) reject(err);
      resolve(phc.serialize({
        id: 'scrypt',
        hash: derivedKey,
        salt: salt,
        params: {
          n: combinedOptions.cost,
          r: combinedOptions.blockSize,
          p: combinedOptions.parallelization
        }
      }));
    });
  });
}

/**
 * Parse a hashed password string into its components.
 *
 * @param {string} hash - The hashed password.
 * @param {Object} [options={}] - Options to override defaults.
 * @returns {Object} - An object with `hashedPassword`, `salt`, `cost`, `blockSize`, and `parallelization`.
 * @throws Will throw an error if the hash format is invalid.
 */
function parse(hash, options) {
  const combinedOptions = getOptions(options);
  const parsedHash = phc.deserialize(hash);
  parsedHash.params.N = parsedHash.params.n

  // parameters checks
  if (combinedOptions.strict) {
    if (parsedHash.hash.length !== combinedOptions.hashlength) {
      throw new Error('Hash length does not match');
    }
    if (parsedHash.salt.length !== combinedOptions.saltlength) {
      throw new Error('Salt length does not match');
    }
    for (const param in shorthand) {
      if (parsedHash.params[shorthand[param]] !== combinedOptions[param]) {
        throw new Error(`Parameter ${param}/${shorthand[param]} does not match`);
      }
    }
  }

  return parsedHash;
}

/**
 * Check if a hash has the correct format and parameters.
 *
 * @param {string} hash - The hashed password.
 * @param {Object} [options={}] - Options to override defaults.
 * @returns {boolean} - Returns `true` if the hash looks valid, otherwise `false`.
 */
function needsRehash(hash, options = {}) {
  try {
    parse(hash, { ...options, strict: true });
    return false;
  } catch(err) {
    return true;
  }
}

/**
 * Verify if a password matches a given hash.
 *
 * @param {string} password - The password to verify.
 * @param {string} hash - The hash to compare with.
 * @param {Object} [options={}] - Options to override defaults.
 * @returns {Promise<boolean>} - Returns `true` if the password matches the hash, otherwise `false`.
 */
async function verify(password, hash, options = {}) {
  const combinedOptions = getOptions(options);
  try {
    const parsedHash = parse(hash, options);
    const fullPassword = password + combinedOptions.pepper;

    return new Promise((resolve, reject) => {
      crypto.scrypt(fullPassword, parsedHash.salt, parsedHash.hash.length, {
        ...parsedHash.params,
        maxmem: combinedOptions.maxmem
      }, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey.equals(parsedHash.hash));
      });
    });
  } catch(err) {
    return Promise.resolve(false);
  }
}

module.exports = { opts, hash, verify, needsRehash, parse };

