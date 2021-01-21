const Block = require("./block")
const Blockchain = require(".");
const cryptoHash = require("../util/crpto-hash");
const Wallet = require("../wallet");
const Transaction = require("../wallet/transaction");


describe('Blockchain', () => {
    let blockchain, newChain, originalChain,errorMock;
    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
        errorMock = jest.fn();
            global.console.error = errorMock;

    })

    it('chain is an array', () => {
        expect(blockchain.chain instanceof Array).toBe(true)
    })
    it('chain start with genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis())
    })

    it('adds a new block to the chain', () => {
        const newdata = 'foo data';
        blockchain.addblock({ data: newdata })
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newdata)
    })


    describe('isValidChain()', () => {
        describe('chain  does not start with genisis block', () => {
            it('return true', () => {
                blockchain.chain[0] = { data: "fack-genesis" }
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            })
        })
        describe('chain  start with genisis block and has multiple block', () => {
            beforeEach(() => {
                blockchain.addblock({ data: "hellp" })
                blockchain.addblock({ data: "hel" })
                blockchain.addblock({ data: "hell" })
            })
            describe('chain should not not have multiple difficulty jump', () => {
                it('return false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = "hello";
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, nonce, data, difficulty, lastBlock.hash)
                    const corruptBlock = new Block({
                        data,
                        nonce,
                        timestamp,
                        difficulty,
                        lastHash: lastBlock.hash,
                        hash
                    })
                    blockchain.chain.push(corruptBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })

            })
            describe('block lastHash changed', () => {
                it('return false', () => {

                    //blockchain.addblock({data:"h"})
                    blockchain.chain[2].lastHash = 'broken-hash'
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)

                });
            });
            describe('block hash changed', () => {
                it('return false', () => {

                    //blockchain.addblock({data:"h"})
                    blockchain.chain[2].data = 'broken-data'
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)

                })
            })
            describe('chain is valid', () => {
                it('return true', () => {

                    //blockchain.addblock({data:"h"})
                    //blockchain.chain[2].lastHash='broken-hash'
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)

                })
            })
        })
    })

    describe('replaceChain()', () => {
        let  logMock;
        beforeEach(() => {
            
            logMock = jest.fn();

            global.console.log = logMock;
        })
        describe('when the chain is not longer', () => {

            beforeEach(() => {
                newChain.chain[0] = { new: "sdsd" }

                blockchain.replaceChain(newChain.chain);
            })
            it('does not replace the chain', () => {

                expect(blockchain.chain).toEqual(originalChain);
            })
            it('log an error', () => {
                expect(errorMock).toHaveBeenCalled()
            })
        })

        describe('when the chain is  longer', () => {

            beforeEach(() => {
                newChain.addblock({ data: "Bears" });
                newChain.addblock({ data: "Beets" });
                newChain.addblock({ data: "Beats" });
            })
            describe('chain is not valid', () => {

                beforeEach(() => {
                    newChain.chain[2].hash = "fake-hash";
                    blockchain.replaceChain(newChain.chain);
                });

                it('it doesnot replace chain', () => {
                    expect(blockchain.chain).toEqual(originalChain)
                })
                it('it logs an error', () => {

                    expect(errorMock).toHaveBeenCalled();
                })
            })
            describe('chain is  valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);

                });

                it('it  replace chain', () => {

                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('it logs about chain replacement', () => {

                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
        describe('and the `validateTransaction` flag is true',()=>{
            it('calls validTransactionData()',()=>{
                const validTransactionDataMock=jest.fn();
                blockchain.validTransactionData=validTransactionDataMock;
                newChain.addblock({data:'foo'});
                blockchain.replaceChain(newChain.chain,true);
                expect(validTransactionDataMock).toHaveBeenCalled();
            })
        })
    })
    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;
        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 65 })
            rewardTransaction = Transaction.rewardTransaction({
                minnerWallet: wallet
            })
        });
        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addblock({
                    data: [transaction, rewardTransaction]
                });
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });
describe('transaction data has multiple rewards',()=>{
    it('returns false and logs an error',()=>{
        newChain.addblock({
            data: [transaction, rewardTransaction,rewardTransaction]
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
    });
});
describe('the transaction data has at least one malformed outputMap',()=>{
    describe('and the transaction is not the reward transaction',()=>{
        it('returns false and log an error',()=>{
            transaction.outputMap[wallet.publicKey]=99999;
            newChain.addblock({
                data: [transaction, rewardTransaction]
            });
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            expect(errorMock).toHaveBeenCalled();
        });
    });
    describe('and the transaction is  the reward transaction',()=>{
        it('returns false and log an error',()=>{
            rewardTransaction.outputMap[wallet.publicKey]=99999;
            newChain.addblock({
                data: [transaction, rewardTransaction]
            });
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            expect(errorMock).toHaveBeenCalled();
        });
    });
});
describe('the transaction data has at least one malformed input',()=>{
    it('returns false and log an error',()=>{
        wallet.balance=9000;
        const evilOutputMap={
            [wallet.publicKey]:8900,
            foRecipient:100
        };
        const evilTransaction={
            input:{
                timestamp:Date.now(),
                amount:wallet.balance,
                address:wallet.publicKey,
                signature:wallet.sign(evilOutputMap)
            },
            outputMap:evilOutputMap
        }
           newChain.addblock({
            data: [evilTransaction, rewardTransaction]
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
    });
})
describe('and block contains multiple identical transactions',()=>{
    it('returns false and log an error',()=>{
        newChain.addblock({
            data: [transaction,transaction,transaction, rewardTransaction]
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            expect(errorMock).toHaveBeenCalled();
    })
})
    })
})