const uuid = require('uuid/v1');
const { verify_signature } = require('../util');
const cryptoHash = require('../util/crpto-hash');
const {REWARD_INPUT,MINING_REWARD}=require('../config')
class Transaction {

    constructor({ amount, recipient, senderWallet ,outputMap,input}) {
        this.id = uuid();
        this.outputMap =outputMap|| this.createOutputMap({ amount, recipient, senderWallet });
        this.input =input || this.createInput({ senderWallet, outputMap: this.outputMap });

    }

    createOutputMap({ amount, recipient, senderWallet }) {
        let outputMap = {}
        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }
    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
         
    }
    update({senderWallet,address,amount}){

        if(amount>this.outputMap[senderWallet.publicKey])
        {
            throw new Error('Amount exceeds balance');
        }
        if(!this.outputMap[address])
        {
            this.outputMap[address]=amount;
        }
        else{
            this.outputMap[address]=this.outputMap[address]+amount;
        }
     // this.outputMap[address]=amount;
      this.outputMap[senderWallet.publicKey]=this.outputMap[senderWallet.publicKey]-amount;

      this.input=this.createInput({senderWallet,outputMap:this.outputMap})


    }
    static validTransaction(transaction) {
        const { input, outputMap } = transaction;
        const { address, amount, signature } = input;
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        if (!verify_signature({ publicKey: address, data:cryptoHash(outputMap), signature })) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        return true;
    }
    static rewardTransaction({minnerWallet})
    {
        return new this({
            input:REWARD_INPUT,
            outputMap:{[minnerWallet.publicKey]:MINING_REWARD}
        });
    }
}
module.exports = Transaction