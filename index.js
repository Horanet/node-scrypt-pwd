const crypto = require('crypto');

// Default options
let defaultOptions = {
  hashlength: 32,
  saltlength: 16,
  pepper: '',
  cost: 16384, // CPU/memory cost (N)
  blockSize: 8, // Block size (r)
  parallelization: 1, // Parallelization (p)
  maxmem: 64 * 1024 * 1024, // Maximum memory in bytes (64 MB by default)
  permissive: false,
};

// Helper function to normalize options
function normalize(options = {}) {
  const opts = {...options};
  const shorthand = {
    cost: 'N', // CPU/memory cost
    blockSize: 'r', // Block size
    parallelization: 'p', // Parallelization
  };

  for (const opt in shorthand) {
    if (opts[shorthand[opt]]) {
      opts[opt] = opts[shorthand[opt]];
      delete opts[shorthand[opt]];
    }
  }
  return opts;
}

function getOptions(options = {}) {
  return { ...defaultOptions, ...normalize(options) };
}

// Init function to set default options
function init(options = {}) {
  defaultOptions = getOptions(options);
}

// Hash function: Generates a hash from the password
async function hash(password, options = {}) {
  const combinedOptions = getOptions(options);;
  
  const salt = crypto.randomBytes(combinedOptions.saltlength);
  const fullPassword = password + combinedOptions.pepper;

  return new Promise((resolve, reject) => {
    crypto.scrypt(fullPassword, salt, combinedOptions.hashlength, combinedOptions, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('base64')}$${salt.toString('base64')}$${combinedOptions.cost}$${combinedOptions.blockSize}$${combinedOptions.parallelization}`);
    });
  });
}

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

function looksGood(hash, options = {}) {
  try {
    parse(hash, options);
    return true;
  } catch(err) {
    return false;
  }
}

// Verify function: Checks if a given password matches a stored hash
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

module.exports = { init, hash, parse, verify, looksGood, getOptions };

