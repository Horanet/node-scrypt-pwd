const { init, hash, parse, verify, looksGood, getOptions } = require('./index');

demo();
async function demo() {
  
  const password = 'supersecret';
  
  const hash1 = await hash(password);
  console.log(`Hashed Password for "${password}" with options ${JSON.stringify(getOptions())} is:\n${hash1}`);
  console.log(await verify(password, hash1))
  
  const options = { pepper: 'pepper123' };
  const hash2 = await hash(password, options);
  console.log(`Hashed Password for ${password} with options ${JSON.stringify(getOptions())} is:\n${hash2}`);
  
  console.log(await verify(password, hash2, options))
  console.log(await verify(password, hash1, options))
  console.log(looksGood(hash1, options))
  
  options.blockSize = 16;
  init(options);
  const hash3 = await hash(password);
  console.log(`Hashed Password for ${password} with options ${JSON.stringify(getOptions())} is:\n${hash3}`);
  
  console.log(await verify(password, hash3))
  console.log(await verify(password, hash2))
  console.log(looksGood(hash2))
  console.log(await verify(password, hash2, { permissive: true }))
  console.log(looksGood(hash2, { permissive: true }))

  options.r = 8; // r is a synonym for blockSize, reset to default value
  init(options);
  const hash4 = await hash(password);
  console.log(`Hashed Password for ${password} with options ${JSON.stringify(getOptions())} is:\n${hash3}`);
  console.log(looksGood(hash4))
  console.log(await verify(password, hash4))

}
