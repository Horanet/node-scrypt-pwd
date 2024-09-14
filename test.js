const { hash, verify, looksGood, parse, opts } = require('./index');
const assert = require('assert');

// Test password and options
const password = 'supersecret';
const options = { pepper: 'pepper123', blockSize: 8 };

// Set default options
opts(options);

// Test hashing
(async () => {
  console.log('Running tests...');

  try {
    // Hash password
    const hashedPassword = await hash(password);
    console.log('Password hashed:', hashedPassword);

    // Verify correct password
    const isVerified = await verify(password, hashedPassword);
    assert.strictEqual(isVerified, true, 'Password should be verified correctly');
    console.log('Password verified successfully');

    // Verify wrong password
    const isNotVerified = await verify('wrongpassword', hashedPassword);
    assert.strictEqual(isNotVerified, false, 'Wrong password should not be verified');
    console.log('Wrong password failed verification as expected');

    // Verify wrong hash
    const isInvalidHash = await verify(password, 'invalidhash');
    assert.strictEqual(isInvalidHash, false, 'Invalid hash should not be verified');
    console.log('Invalid hash failed verification as expected');

    // Test looksGood function
    const hashGood = looksGood(hashedPassword);
    assert.strictEqual(hashGood, true, 'Hash should look good');
    console.log('Hash passed looksGood check');

    // Test parse function
    const parsed = parse(hashedPassword);
    assert.strictEqual(parsed.hashedPassword.length > 0, true, 'Hash should be parsed correctly');
    console.log('Hash parsed successfully:', parsed);

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
})();

