# scrypt-utils
NPM module providing utilities around hashing passwords with scrypt

## Introduction
In node projects, using `crypto.scrypt()` is a nice alternative to bcrypt for hashing passwords, since bcrypt depends on 50~ modules (bringing compatibility and security issues), whereas `crypto` library is js-native.

But brcypt module provides some convenient functions to generate and check hashed passwords.

This module aims at providing such functions with `crypto.scrypt()`.

## Usage
```
const { init, hash, parse, verify, looksGood } = require('scrypt-utils');

const password = 'supersecret';

// Basic operations
const hash1 = await hash(password); // returns each time a different value, since salt is random
await verify(password, hash1); // true
await verify(password, 'badhash'); // false
await verify('badsecret', hash1); // false
await verify(password, 'NAiwS8ZCQibTx5ynog037kyq37vTUnnUx99MyjxZiNA=$23NP/wU8OMukXuroV4h6rg==$16384$8$1'); // true
await verify(password, 'TAiwS8ZCQibTx5ynog037kyq37vTUnnUx99MyjxZiNA=$23NP/wU8OMukXuroV4h6rg==$16384$8$1'); // false, the hash has been tampered

// Setting some pepper
const options = { pepper: 'pepper123' };
const hash2 = await hash(password, options);
await verify(password, hash2, options); // true
await verify(password, hash1, options); // false, since a pepper has been set
looksGood(hash1, options); // but pepper does not appear in the hash, so the hash looks correct

// Changing a `crypto.scrypt()` option such as `blockSize`
options.blockSize = 16;
init(options);
const hash3 = await hash(password);
await verify(password, hash3); // true
await verify(password, hash2); // false, since blockSize in hash2 differ from expected value
looksGood(hash2); // false, since blockSize appears in the hash
await verify(password, hash2, { permissive: true }); // true: despite blockSize differ from expected values, the hash is valid
looksGood(hash2, { permissive: true }); // true
// note that options can be set persistantly with `init`, or they can be passed in arguments

// `crypto.scrypt()` options can also be set with shorthands
options.r = 8; // r is a synonym for blockSize, reset to default value
init(options);
const hash4 = await hash(password);
looksGood(hash4); // true
await verify(password, hash4); // true

```

## APIs

This module exposes the following functions:

### `init(options)`
Set the default values for scrypt options

parameters:
  * `options` (JSON object): may contain
    * `hashlength` (int, default 32): hash length in bytes
    * `saltlength` (int, default 16): salt length in bytes
    * `pepper` (string): to make it harder to retrieve a password from its hash and salt, default is empty string, meaning that no pepper is used
    * any `crypto.scrypt()`option : `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`, `maxmem`
    * `permissive` (boolean, default false): use these parameters (`hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`) to hash passwords, but may validate passwords hashed with other parameters

### `hash(password [, options])`

computes a salted hashed password

parameters:
  * `password` (string)
  * `options` (JSON object): to override any init option

returns: a string formatted as `<base64(hash)>$<base64(salt)>$<cost>$<blockSize>$<parallelization>`

### `verify(password, hash [, options])`

checks if a password matches with a salted hash

parameters:
  * `password` (string)
  * `hash` (string): the salted hash as returned by `hash`
  * `options` (JSON object): to override any init options


returns: a boolean, false if the password does not match the hash or if the hash is in a wrong format

### `looksGood(hash [, options])`

checks if a salted hash is compliant to the format returned by `hash()`

parameters:
  * `hash` (string): the salted hash to check
  * `options`: to override any init option 

returns: a boolean, `true` if the hash seems to be compliant, `false` if it is not,  
if `permissive` is set to `false`, the value of parameters `hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p` is checked

