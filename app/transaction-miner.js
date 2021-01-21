const Transaction = require("../wallet/transaction");

class TransactionMiner{

    constructor({blockchain,transactionPool,wallet,pubsub}){
        this.blockchain=blockchain,
        this.transactionPool=transactionPool,
        this.wallet=wallet,
        this.pubsub=pubsub
    }

    mineTransaction()
    {
        //get the transactionPool valid transaction
        const validTransactions=this.transactionPool.validTransaction();

        //generate miner's reward
        validTransactions.push(
        Transaction.rewardTransaction({minnerWallet:this.wallet})
        );
        //add a block consisting of there transaction to the blockchain
        this.blockchain.addblock({data:validTransactions});
        //broadcast the updated blockchain
        this.pubsub.broadcastChain();
        //clear transaction
        this.transactionPool.clear();


    }
}
module.exports=TransactionMiner