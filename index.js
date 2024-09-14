const crypto = require('crypto');

// Default options
const defaultOptions = {
  hashlength: 32,
  saltlength: 16,
  pepper: '',
  cost: 16384, // CPU/memory cost (N)
  blockSize: 8, // Block size (r)
  parallelization: 1, // Parallelization (p)
  maxmem: 64 * 1024 * 1024, // Maximum memory in bytes (64 MB by default)
  permissive: false,
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
      resolve(`${derivedKey.toString('base64')}$${salt.toString('base64')}$${combinedOptions.cost}$${combinedOptions.blockSize}$${combinedOptions.parallelization}`);
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
  const parts = hash.split('$');
  
  if (parts.length !== 5) {
    throw new Error('Invalid hash format');
  }

  const parsedHash = {
    hashedPassword: parts[0],
    salt: parts[1],
    cost: parts[2],
    blockSize: parts[3],
    parallelization: parts[4],
  }

  // Check if the hashedPassword and salt are valid base64 strings
  for (const param of ['hashedPassword', 'salt']) {
    try {
      parsedHash[param] = Buffer.from(parsedHash[param], 'base64');
    } catch (e) {
      throw new Error(`Invalid base64 encoding for ${param}`);
    }
  }

  // Convert parameters to numbers and check if they are valid positive integers
  for (const param of ['cost', 'blockSize', 'parallelization']) {
    parsedHash[param] = parseInt(parsedHash[param]);
    if (!(parsedHash[param] > 0)) {
      throw new Error(`Invalid parameter ${param}`);
    }
  }

  // Non-permissive checks
  if (!combinedOptions.permissive) {
    if (parsedHash.hashedPassword.length !== combinedOptions.hashlength) {
      throw new Error('Hash length does not match');
    }
    if (parsedHash.salt.length !== combinedOptions.saltlength) {
      throw new Error('Salt length does not match');
    }
    for (const param of ['cost', 'blockSize', 'parallelization']) {
      if (parsedHash[param] !== combinedOptions[param]) {
        throw new Error(`Parameter ${param} does not match`);
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
function looksGood(hash, options = {}) {
  try {
    parse(hash, options);
    return true;
  } catch(err) {
    return false;
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
      crypto.scrypt(fullPassword, parsedHash.salt, parsedHash.hashedPassword.length, {
        cost: parsedHash.cost,
        blockSize: parsedHash.blockSize,
        parallelization: parsedHash.parallelization,
        maxmem: combinedOptions.maxmem
      }, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey.equals(parsedHash.hashedPassword));
      });
    });
  } catch(err) {
    return Promise.resolve(false);
  }
}

module.exports = { opts, hash, verify, looksGood, parse };

