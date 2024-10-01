const { hash, verify, needsRehash, parse, opts } = require('./index');
const assert = require('assert');

// Test password and options
const password = 'supersecret';

// Test hashing
(async () => {
  console.log('Running tests...');

  try {
    // Hash password
    const hashedPassword1 = await hash(password);
    console.log('Password hashed:', hashedPassword1);

    /* default params, no pepper */
    console.log('default params, no pepper');

    // Verify correct password
    assert.strictEqual(await verify(password, hashedPassword1), true, 'Password should be verified correctly');
    console.log('Password verified successfully');

    // Verify wrong password
    assert.strictEqual(await verify('wrongpassword', hashedPassword1), false, 'Wrong password should not be verified');
    console.log('Wrong password failed verification as expected');

    // Verify wrong hash
    assert.strictEqual(await verify(password, 'invalidhash'), false, 'Invalid hash should not be verified');
    console.log('Invalid hash failed verification as expected');

    /* custom params, no pepper */
    console.log('custom params, no pepper')

    // Verify correct password hashed with different parameters
    const hashedPassword2 = await hash(password, { cost: opts().cost/2 });
    assert.strictEqual(await verify(password, hashedPassword2), true, 'Password verification should success if hashed with custom params and strict let to false');
    console.log('Password verified successfully');

    assert.strictEqual(await verify(password, hashedPassword2, {strict: true}), false, 'Password verification should fail if hashed with custom params and strict set to true');
    console.log('Password verified successfully');

    // Test needsRehash function
    assert.strictEqual(needsRehash(hashedPassword2), true, 'Hash should be rehashed to comply with parameters');
    console.log('Hash passed needsRehash check');

    /* default params, pepper */
    console.log('default params, pepper');
    opts({ pepper: 'pepper' });
    const hashedPassword3 = await hash(password);

    assert.strictEqual(await verify(password, hashedPassword3), true, 'Password should be verified correctly');
    console.log('Password verified successfully');

    assert.strictEqual(await verify(password, hashedPassword1), false, 'hashedPassword1 was computed without pepper');

    console.log('reset pepper to default value');
    opts({ pepper: undefined });
    assert.strictEqual(await verify(password, hashedPassword1), true, 'hashedPassword1 was computed without pepper');
    assert.strictEqual(await verify(password, hashedPassword3), false, 'hashedPassword3 was computed with pepper');

    // Verify wrong password
    assert.strictEqual(await verify('wrongpassword', hashedPassword1), false, 'Wrong password should not be verified');
    console.log('Wrong password failed verification as expected');

    // Verify wrong hash
    const isInvalidHash = await verify(password, 'invalidhash');
    assert.strictEqual(isInvalidHash, false, 'Invalid hash should not be verified');
    console.log('Invalid hash failed verification as expected');


    // Test parse function
    const parsed = parse(hashedPassword1);
    assert.strictEqual(parsed.hash.length > 0, true, 'Hash should be parsed correctly');
    console.log('Hash parsed successfully:', parsed);

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
})();

