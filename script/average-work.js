const Block = require("./block");
const Blockchain = require("../blockchain");


const blockchain=new Blockchain()
let prevTimestamp ,nextTimestamp, nextBlock, timeDiff, average;

const times=[];
for(let i=0;i<1000;i++)
{
    prevTimestamp=blockchain.chain[blockchain.chain.length-1].timestamp;
    blockchain.addblock({data: `block ${i}`});
    nextBlock=blockchain.chain[blockchain.chain.length-1];
    nextTimestamp=nextBlock.timestamp;
    timeDiff=nextTimestamp-prevTimestamp;
    times.push(timeDiff);
    average=times.reduce((total,value)=> (total+value))/times.length;
    console.log(`Time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms`);
}