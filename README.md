# scrypt-utils
NPM module providing utilities around hashing passwords with scrypt

## Introduction
In node projects, using `crypto.scrypt()` is a nice alternative to bcrypt for hashing passwords, since bcrypt depends on 50~ modules (bringing compatibility and security issues), whereas `crypto` library is js-native.

But brcypt module provides some convenient functions to generate and check hashed passwords.

This module aims at providing such functions with `crypto.scrypt()`.

## Usage
```
const { init, hash, verify } = require('scrypt-utils');
```

## APIs

This module exposes the following functions:

`init(options)`
* parameters:
  * `options` (JSON object): may contain
    * `hashlength` (int, default 32): hash length in bytes
    * `saltlength` (int, default 16): salt length in bytes
    * `pepper` (string): to make it harder to retrieve a password from its hash and salt, default is empty string, meaning that no pepper is used
    * any `crypto.scrypt()`option : `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`, `maxmem`
    * `permissive` (boolean, default False): use these parameters (`hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`) to hash passwords, but may validate passwords hashed with other parameters

`hash(password [, options])` returns a hash password with its salt
* parameters:
  * `password` (string)
  * `options` (JSON object): to override any init option
* returns: a string formatted as `<base64(hash)>$<base64(salt)>$<cost>$<blockSize>$<parallelization>`

`verify(password, hash [, options])`: check that a password matches with a salted hash
* parameters:
  * `password` (string)
  * `hash` (string): the salted hash as returned by `hash`
  * `options` (JSON object): to override init options `maxmem` and `permissive` (overriding other options has no sense since parameters are read in the salted hash)
* returns: a boolean, or an error in case of incorrect format for `hash`

`looksGood(hash [, options])`: check that a salted hash is compliant to the format returned by `hash`
* parameters:
  * `hash` (string): the salted hash to check
  * `options`: to override any init option 
* returns: a boolean, `true` if the hash seems to be compliant, `false` if it is not,  
if `permissive` is set to `false`, the value of parameters `hashlength`, `saltlength`, `cost`|`N`, `blockSize`|`r`, `parallelization`|`p` is checked

