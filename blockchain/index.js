const Block = require("./block");
const cryptoHash = require("../util/crpto-hash");
const { REWARD_INPUT, MINING_REWARD } = require("../config");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");

class Blockchain {

    constructor() {
        this.chain = [Block.genesis()]
    }
    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) { return false; }
        for (var i = 1; i < chain.length; i++) {
            var lastBlockHash = chain[i - 1].hash;
            var lastBlockDifficulty = chain[i - 1].difficulty;

            const { timestamp, hash, lastHash, data, nonce, difficulty } = chain[i];
            if (lastHash !== lastBlockHash) { return false; }
            if (Math.abs(lastBlockDifficulty - difficulty) > 1) { return false; }

            const newHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
            if (hash != newHash) return false
        }
        return true;
    }
    addblock({ data }) {
        const lastBlock = this.chain[this.chain.length - 1];
        const newBlock = Block.mineblock({ lastBlock, data })
        this.chain.push(newBlock)
    }
    replaceChain(chain,validTransaction ,onSucess) {
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain mush be longer');
            return;
        }

        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain mush be valid');
            return
        }
        if(validTransaction &&!this.validTransactionData({chain}))
        {
            console.error('The incoming chain has invalid data');
            return;
        }
        if (onSucess) {
            onSucess();
        }
        console.error('replacing with the chain', chain);

        this.chain = chain;
    }
    validTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            let rewardTransactionCount = 0;
            const transactionSet = new Set();
            for (let transaction of block.data) {
                if (transaction.input.address == REWARD_INPUT.address) {
                    rewardTransactionCount = rewardTransactionCount + 1;

                    if (rewardTransactionCount > 1) {
                        console.error('MIner reward exceeds the limit');
                        return false;
                    }
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner mining reward is in valid');
                        return false
                    }
                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid Transaction');
                        return false
                    }
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });
                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }
                    if (transactionSet.has(transaction)) {
                        console.error('Itdentical transaction appears more than once in the block');
                        return false
                    }
                    else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        return true;
    }

}


module.exports = Blockchain