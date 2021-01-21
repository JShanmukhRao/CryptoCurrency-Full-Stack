const Block = require('./block');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const cryptoHash = require('../util/crpto-hash');
const hextobinary= require('hex-to-binary')

describe('Block', () => {
    const timestamp = 2000;
    const lastHash = '4178';
    const hash = '5698';
    const data = "Shubham";
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({ data, timestamp, lastHash, hash, nonce, difficulty });

    it('has timestamp,lasthash,hash,data,nonce,difficulty', () => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.hash).toEqual(hash);
        expect(block.data).toEqual(data);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    })
   
   describe('addjustDifficulty',()=>{
    it('difficulty level increase', () => {
        expect(Block.addDifficulty({ originalBlock: block, timestamp: block.timestamp + MINE_RATE - 100 })).toEqual(block.difficulty + 1)
    })
    it('difficulty level decrease', () => {
        expect(Block.addDifficulty({ originalBlock: block, timestamp: block.timestamp + MINE_RATE + 100 })).toEqual(block.difficulty - 1)
    })
    it('if difficulty less than zero return 1',()=>{
           block.difficulty=-1;
        expect(Block.addDifficulty({ originalBlock: block, timestamp: block.timestamp + MINE_RATE - 100 })).toEqual(1)
    })
   })
})
describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('return instance of Block', () => {
        expect(genesisBlock instanceof Block).toBe(true);
    })
    it('returns genesis data', () => {
        expect(genesisBlock).toEqual(GENESIS_DATA);
    })
})
describe('mineblock()', () => {
    const lastBlock = Block.genesis();
    const data = "mined-data"
    const nonce = 1
    const difficulty = 1
    const minedBlock = Block.mineblock({ lastBlock, data, nonce, difficulty });

    it("return instance of Block", () => {
        expect(minedBlock instanceof Block).toBe(true);
    })
    it("set lasthash equal to hash of lastblock", () => {
        expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    })
    it("set data", () => {
        expect(minedBlock.data).toEqual(data);
    })
    it("set timestamp", () => {
        expect(minedBlock.timestamp).not.toEqual(undefined);
    })
    it("create sha256 with proper inputs", () => {
        expect(minedBlock.hash).toEqual(
            cryptoHash(
                data,
                minedBlock.timestamp,
                lastBlock.hash,
                minedBlock.difficulty,
                minedBlock.nonce
            ));
    })
    it("set `hash` that match difficulty criteria", () => {
        expect(hextobinary(minedBlock.hash).substring(0, minedBlock.difficulty)).toEqual('0'.repeat(minedBlock.difficulty));
    })
    it('adjust the difficulty',()=>{
        let possibleResult= [lastBlock.difficulty+1,lastBlock.difficulty-1]
       
        expect(possibleResult.includes(minedBlock.difficulty)).toBe(true)
    })
   

})