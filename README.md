# scrypt-password
A simple but powerful password hashing and verification library wrapping over the scrypt implementation available in the Node.js crypto module.

## Introduction
In Node.js projects, using `crypto.scrypt()` is a great alternative to bcrypt for hashing passwords, as bcrypt depends on many modules (introducing compatibility and security concerns), whereas the `crypto` library is native to JavaScript.

The bcrypt module provides convenient functions to generate and check hashed passwords. This module aims to provide similar functionality using `crypto.scrypt()`.

### Highlights
* powerful: can apply any crypto.scrypt option, but default values are convenient, can also introduce pepper
* works on any node version from xx
* password hash are PHC-formatted
* only one dependency, @phc/format, which is quite light
* option 'strict': if let to false, a password hash can be valid even if its parameters differ from current hashing parameters
* function needsRehash: to determine if a password hash parameters differ from current hashing parameters, and thus the password should be re-hashed

None of the similar libraries I could test was compliant with all these points.

## Usage
```
const { opts, hash, verify, needsRehash, parse } = require('scrypt-password');

const password = 'supersecret';

// Basic operations
const hash1 = await hash(password); // returns each time a different value, since salt is random
await verify(password, hash1); // true
await verify(password, 'badhash'); // false
await verify('badsecret', hash1); // false
await verify(password, '$scrypt$n=16384,r=8,p=1$uCmebOheGtvRJlgxowQ0Uw$/hQO0hGE9owhDsxcNIuSqLY96uU58b9AsfSD4u59NBU'); // true
await verify(password, '$scrypt$n=16384,r=8,p=1$uCmebOheGtvRJlgxowQ0Uw$/hQO0hGE9owhDsxcNIuSqLY96uU58b9AsfSD4u59NXX'); // false, the hash has been tampered

// Setting some pepper
const options = { pepper: 'pepper123' };
const hash2 = await hash(password, options);
await verify(password, hash2, options); // true
await verify(password, hash1, options); // false, since a pepper has been set
needsRehash(hash1, options); // false: pepper does not appear in the hash, so the hash looks correct

// Changing a `crypto.scrypt()` option such as `blockSize`
options.blockSize = 16;
opts(options);
const hash3 = await hash(password);
await verify(password, hash3); // true
await verify(password, hash2); // false, since blockSize in hash2 differ from expected value
needsRehash(hash2); // true, since blockSize appears in the hash
await verify(password, hash2, { strict: false }); // true: despite blockSize differ from expected values, the hash is valid
needsRehash(hash2, { strict: false }); // false
// note that options can be set persistantly with `opts`, or they can be passed in arguments

// `crypto.scrypt()` options can also be set with shorthands
options.r = undefined; // r is a synonym for blockSize, reset to default value
opts(options);
const hash4 = await hash(password);
needsRehash(hash4); // false
await verify(password, hash4); // true

```

## APIs

This module exposes the following functions:

### `opts([options])`
Add or get scrypt options

**Parameters:**
  * `options` (JSON object, optional): options to add, may contain
    * `hashlength` (int, default 32): hash length in bytes
    * `saltlength` (int, default 16): salt length in bytes
    * `pepper` (string): to make it harder to retrieve a password from its hash and salt, default is empty string, meaning that no pepper is used
    * any `crypto.scrypt()`option : `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`, `maxmem`
    * `strict` (boolean, default false): if set to true, a hashed password verification fails if parameters (`hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`) differ from current options values

**Returns:** an object containing the resulting scrypt options

### `hash(password [, options])`

computes a salted hashed password

**Parameters:**
  * `password` (string)
  * `options` (JSON object): to override any option

**Returns:** a string formatted as `<base64(hash)>$<base64(salt)>$<cost>$<blockSize>$<parallelization>`

### `verify(password, hash [, options])`

checks if a password matches with a salted hash

**Parameters:**
  * `password` (string)
  * `hash` (string): the salted hash as returned by `hash`
  * `options` (JSON object): to override any options

**Returns:** a boolean, false if the password does not match the hash or if the hash is in a wrong format

### `needsRehash(hash [, options])`

checks if a salted hash is compliant to the format returned by `hash()`: if not, it should be re-hashed

**Parameters:**
  * `hash` (string): the salted hash to check
  * `options`: to override any option 

**Returns:** a boolean, `true` if the hash seems to be compliant, `false` if it is not,  
if `strict` is set to `true`, the value of parameters `hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p` is checked

### `parse(hash, [options])`
Parses a salted hash and validates it against the current or provided options.

**Parameters:**
* hash (string): The salted hash to parse.
* options (JSON object): Optional object to override any option.

**Returns:** An object containing the following fields:
* hashedPassword (Buffer): The base64-decoded hashed password.
* salt (Buffer): The base64-decoded salt.
* cost (int): The cost factor (N).
* blockSize (int): The block size (r).
* parallelization (int): The parallelization factor (p).

Throws: An error if the hash format is invalid or the hash fails validation.


