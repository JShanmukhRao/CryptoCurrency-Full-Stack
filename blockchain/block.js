const { GENESIS_DATA, MINE_RATE } = require('../config')
const cryptoHash = require('../util/crpto-hash')
const hextobinary= require('hex-to-binary')

class Block {
  constructor({ timestamp, data, lastHash, hash, nonce, difficulty }) {
    this.timestamp = timestamp
    this.data = data
    this.lastHash = lastHash
    this.hash = hash
    this.nonce = nonce;
    this.difficulty = difficulty
  }
  static genesis() {
    return new this(GENESIS_DATA)
  }
  static mineblock({ lastBlock, data }) {
    let hash, timestamp;
    let difficulty;
    let nonce = 0
    do {
      timestamp = Date.now();
      difficulty=Block.addDifficulty({originalBlock:lastBlock,timestamp})
      nonce++;
      hash = cryptoHash(timestamp, lastBlock.hash, data, nonce, difficulty)
      
    } while (hextobinary(hash).substring(0, difficulty) != '0'.repeat(difficulty))
    return new this({
      timestamp,
      lastHash: lastBlock.hash,
      data,
      nonce,
      difficulty,
      hash
    })
  }
  static addDifficulty({originalBlock,timestamp})
  {
let {difficulty}=originalBlock;
if(difficulty<1) return 1;
if((timestamp- originalBlock.timestamp>MINE_RATE)) return difficulty-1;
    return difficulty+1
  }
}
module.exports = Block;
//console.log(new Block({data:"Shubham",timestamp:'09/01/2021',lastHash:'4178',hash:'5698'}));