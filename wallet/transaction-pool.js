const Transaction = require('./transaction')
class TransactionPool {
    constructor() {
        this.transactionMap = {};
    }
    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }
    setMap(transaction) {
        this.transactionMap = transaction
    }
    existingTransaction({ inputAddress }) {
        let transactions = Object.values(this.transactionMap)
        return transactions.find(transaction => transaction.input.address === inputAddress)
    }
    validTransaction() {
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)

        )
    }
    clear(){
        this.transactionMap={};
    }
    clearBlockchainTransaction({chain})
    {
        for(let i=0;i<chain.length;i++)
        {
            const block=chain[i];
            for(let transaction of block.data)
            {
                if(this.transactionMap[transaction.id])
                {
                    delete this.transactionMap[transaction.id];
                }
            }
        }

    }
}
module.exports = TransactionPool