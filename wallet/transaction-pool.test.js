const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index');
const Blockchain = require('../blockchain');

describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: 'fake-recipent',
            amount: 50
        });
        
    });
        describe('setTransaction()', () => {
            it('add a transaction', () => {
                transactionPool.setTransaction(transaction);
                expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
            });
        });
        describe('existingTransaction()', () => {
            it('returns an existing transaction given an input address', () => {
                transactionPool.setTransaction(transaction);
                expect(transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })).toBe(transaction);
            });
        });
    
    describe('validTransaction()', () => {
        let validTransaction,errorMock;;
        beforeEach(() => {
            validTransaction = [];
            errorMock=jest.fn();
            global.console.error=errorMock
            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'new-recipient',
                    amount: 30
                });
                if (i % 3 == 0) {
                    transaction.input.amount = 999999;
                }
                else if (i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign('foo');
                }
                else {
                    validTransaction.push(transaction);
                }
                transactionPool.setTransaction(transaction);
            }
        });
        it('returns valid Transaction', () => {
            expect(transactionPool.validTransaction()).toEqual(validTransaction);
        })
        it('logs error for invalid transaction', () => {
        transactionPool.validTransaction();
        expect(errorMock).toHaveBeenCalled();
        })
    });
    describe('clear',()=>{
        it('clear the transactions ',()=>{
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});
        })
    });
    describe('clear blockchain transactions',()=>{
        it('clears the pool of any existing blockchain transactions',()=>{
            const blockchain=new Blockchain();
            const expectedTransactionMap={};
            for(let i=0;i<6;i++)
            {
                const transaction=new Wallet().createTransaction({
                    recipient:'foo',amount:20
                });
                transactionPool.setTransaction(transaction);
                if(i%2===0)
                {
                    blockchain.addblock({data:[transaction]});
                }
                else{
                    expectedTransactionMap[transaction.id]=transaction;
                }
            }
           transactionPool.clearBlockchainTransaction({chain:blockchain.chain});
           expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
       
    })
})