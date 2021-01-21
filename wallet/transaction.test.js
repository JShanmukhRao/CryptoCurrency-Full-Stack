const Wallet = require('.');
const Transaction = require('./transaction');
const {REWARD_INPUT, MINING_REWARD}=require('../config')
describe('Transaction', () => {

    let amount, recipient, senderWallet, transaction;
    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-publicKey'
        amount = 50;

        transaction = new Transaction({ amount, recipient, senderWallet });
    });

    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });
    describe('outputMap', () => {
        it('has `outputMap` ', () => {
            expect(transaction).toHaveProperty('outputMap');
        });
        it('output the amount to recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });
        it('outputs the remaining balance for the `senderWallet` ', () => {

            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });
    describe('validTransaction()', () => {
        let errorMock;
        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        })
        describe('when Transaction is valid', () => {

            it('return true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });
        describe('when transaction is invalid', () => {
            describe('and transaction output value is invalid', () => {

                it('return false and log an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999;

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and transaction input signature is invalid', () => {

                it('return false and log an error', () => {
                    transaction.input.signature = new Wallet().sign('data');

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();

                });
            });
        })
    })
    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;
        describe('amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet,
                        recipient: 'foo',
                        amount: 99999
                    })
                }).toThrow('Amount exceeds balance');
            });

        });
        describe('amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = "next-Recipient";
                nextAmount = 50;
                transaction.update({ amount: nextAmount, address: nextRecipient, senderWallet });
            })
            it('outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });
            it('subtract the amount from the original sender output amount', () => {
                
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });
            it('maintain a total output that matches the input amount', () => {
                expect(Object.values(transaction.outputMap).reduce((total, outAmount) => total + outAmount)).toEqual(transaction.input.amount);
            });
            it('re-sign the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });
            describe('and another update for same recipient', () => {
                let addAmount
                beforeEach(() => {
                   addAmount=50
                    transaction.update({ amount: addAmount, address: nextRecipient, senderWallet });
                })
                it('add to recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount+addAmount);
                });
                it('subtract the amount from the original sender output amount', () => {
                    
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount-addAmount);
                });
            });
        });
       
    });
    describe('rewardTransaction()',()=>{
        let rewardTransaction, minnerWallet;
        beforeEach(()=>{
            minnerWallet=new Wallet();
            rewardTransaction=Transaction.rewardTransaction({minnerWallet});
        });
        it('create a transaction with reward input',()=>{
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });
        it('create a transaction for the miner with `MINING_REWARD`',()=>{
            expect(rewardTransaction.outputMap[minnerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    })

});