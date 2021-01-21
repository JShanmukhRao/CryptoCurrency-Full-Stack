const crypto=require('./crpto-hash')
describe('hash',()=>{

it('hash is same in any order',()=>{
    expect(crypto('one','two','three')).toEqual(crypto('two','one','three'))
})
it('produce unique hash when properties have changed on an input',()=>{
    const foo={};
    const originalHash=crypto(foo);
    foo['a']='a';
    expect(crypto(foo)).not.toEqual(originalHash)
})
})
// "scripts": {
//     "test": "jest --watchAll",
//     "start": "npm run build-client && node index.js",
//     "dev": "nodemon index.js",
//     "dev-peer": "cross-env GENERATE_PEER_PORT='true' nodemon index.js",
//     "build-client": "parcel build client/src/index.html --out-dir client/dist",
//     "dev-client": "parcel client/src/index.html --out-dir client/dist",
//     "clean": "del -rf .cache client/dist"
//   }