# scrypt-password

`scrypt-password` is a simple yet powerful password hashing and verification library that wraps around the native `crypto.scrypt` implementation.

## 🌟 Features

- **Flexible Configuration**: Supports all `crypto.scrypt` options, allowing fine-tuned customization, yet default values are optimized for convenience.
- **PHC-Formatted Hashes**: Password hashes follow the [Password Hashing Competition (PHC) format](https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md)
- **Lightweight Dependency**: Only one external dependency, `@phc/format`.
- **Strict and Permissive Modes**: With the `strict` option, enforce consistent hashing parameters or allow some flexibility when verifying hashes.
- **Rehash Detection**: Use `needsRehash` to identify if a password hash needs rehashing due to updated hashing parameters.

## Usage
```js
const { opts, hash, verify, needsRehash, parse } = require('scrypt-password');

const password = 'supersecret';

// Basic operations
const hash1 = await hash(password); // Generates a different value each time due to random salt
await verify(password, hash1); // true
await verify(password, 'badhash'); // false
await verify('badsecret', hash1); // false
await verify(password, '$scrypt$n=16384,r=8,p=1$uCmebOheGtvRJlgxowQ0Uw$/hQO0hGE9owhDsxcNIuSqLY96uU58b9AsfSD4u59NBU'); // true
await verify(password, '$scrypt$n=16384,r=8,p=1$uCmebOheGtvRJlgxowQ0Uw$/hQO0hGE9owhDsxcNIuSqLY96uU58b9AsfSD4u59NXX'); // false, hash tampered

// Setting a pepper for added security
const options = { pepper: 'pepper123' };
const hash2 = await hash(password, options);
await verify(password, hash2, options); // true
await verify(password, hash1, options); // false, different pepper used
needsRehash(hash1, options); // false: Pepper is not included in the hash, so hash appears correct

// Changing `crypto.scrypt()` options, such as `blockSize`
options.blockSize = 16;
opts(options);
const hash3 = await hash(password);
await verify(password, hash3); // true
await verify(password, hash2); // false, differing blockSize values
needsRehash(hash2); // true, blockSize appears in hash, but is now different
await verify(password, hash2, { strict: false }); // true, valid despite different blockSize
needsRehash(hash2, { strict: false }); // false

// Shorthand for crypto.scrypt() options
options.r = undefined; // Reset blockSize to default value
opts(options);
const hash4 = await hash(password);
needsRehash(hash4); // false
await verify(password, hash4); // true
```

## API Reference
### `opts([options])`
Add or get scrypt options.  
To reset an option to its default value, set it to `undefined`.

**Parameters:**
  * `options` (object, optional): Options to add or modify, which may include:
    * `hashlength` (int, default 32): Hash length in bytes.
    * `saltlength` (int, default 16): Salt length in bytes.
    * `pepper` (string, optional): A secret to increase security, default is an empty string (no pepper used).
    * Any `crypto.scrypt()` option: `cost`|`N`, `blockSize`|`r`, `parallelization`|`p`, `maxmem`.
    * `strict` (boolean, default false): Enforces strict matching of hashing parameters during verification.

**Returns:** The resulting scrypt options.

### `hash(password [, options])`
Generate a salted hash of a password.

**Parameters:**

  * `password` (string): The password to hash.
  * `options` (object, optional): Overrides for current options.

**Returns:** a PHC-formatted string

### `verify(password, hash [, options])`

Verify if a password matches a salted hash.

**Parameters:**

  * password (string): The password to verify.
  * hash (string): The PHC-formatted salted hash to compare against.
  * options (object, optional): Overrides for current options.

**Returns:** true if the password matches the hash, otherwise false.

### `needsRehash(hash [, options])`

Check if a hash is compliant to the format returned by `hash()` toward scrypt options: if not, it should be rehashed.

**Parameters:**

  * hash (string): The salted hash to check.
  * options (object, optional): Overrides for current options.

**Returns:** true if the hash needs rehashing, false otherwise.

### `parse(hash, [options])`
Parse and validate a salted hash against current or provided options.

**Parameters:**

  * hash (string): The salted hash to parse.
  * options (object, optional): Overrides for current options.

**Returns:** An object containing:
  * hashedPassword (Buffer): The base64-decoded hashed password.
  * salt (Buffer): The base64-decoded salt.
  * cost (int): Cost factor (N).
  * blockSize (int): Block size (r).
  * parallelization (int): Parallelization factor (p).

Throws: An error if the hash format is invalid or (if `strict` option is set to true) fails validation.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Contributions are welcome! Please submit issues or pull requests for bug fixes or new features.
