const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');
const { verify_signature } = require('../util');
const Wallet =require('./index');
const { rewardTransaction } = require('./transaction');
const Transaction = require('./transaction');

describe('Wallet',()=>{
let wallet;
    beforeEach(()=>{
        wallet=new Wallet();
    });
    it('has a `balance`',()=>{
      expect(wallet).toHaveProperty('balance');
    });
    it('has a `publicKey`',()=>{
        expect(wallet).toHaveProperty('publicKey');
      });
    describe('Signature',()=>{
      const data="foo-data";
      it('valid signature return true',()=>{
        verify_signature({
          publicKey:wallet.publicKey,
          data,
          signature:wallet.sign(data)
        });
      });
      it('Invalid signature return false',()=>{
        verify_signature({
          publicKey:wallet.publicKey,
          data,
          signature:wallet.sign(data)
        });
      });
    })
    describe('createTransaction()',()=>{
      describe('the amount exceeds the balance',()=>{
        it('throws an error',()=>{
          expect(()=>wallet.createTransaction({amount:99999,recipient:'foo-recipient'})).toThrow('Amount exceeds balance');
        });
      });
      describe('the amount is valid',()=>{
        let amount,transaction,recipient;
        beforeEach(()=>{
          amount=50,
          recipient='foo-recipient',
          transaction=wallet.createTransaction({amount,recipient});
        });
        it('creates an instance of transaction',()=>{
          expect(transaction instanceof Transaction).toBe(true);
        });
        it('maches transaction input with wallet',()=>{
          expect(transaction.input.address).toEqual(wallet.publicKey);
        });
        it('creates an instance of transaction',()=>{
          expect(transaction.outputMap[recipient]).toEqual(amount);
        });
      });
      describe('and a chain is passed',()=>{
        it('calls `Wallet.calculateBalance()`',()=>{
          const calculateBalanceMock=jest.fn();
          const originalCalculateBalance=Wallet.calculateBalance
          Wallet.calculateBalance=calculateBalanceMock;

          wallet.createTransaction({
            recipient:'foo',
            amount:10,
            chain:new Blockchain().chain
          });
          expect(calculateBalanceMock).toHaveBeenCalled();
          Wallet.calculateBalance=originalCalculateBalance
        })
      })
    });

    describe('calculateBalance()',()=>{
      let blockchain;
      beforeEach(()=>{
         blockchain=new Blockchain();
      });
      describe('and there are no output foe the wallet',()=>{
           it('returns `STARTING_BALANCE `',()=>{
             expect(Wallet.calculateBalance({
               chain:blockchain.chain,
               address:wallet.publicKey
             })).toEqual(STARTING_BALANCE);
           })
      });
      describe('and there are output for wallet',()=>{
        let transaction1,transaction2;
        beforeEach(()=>{
          transaction1=new Wallet().createTransaction({
            recipient:wallet.publicKey,
            amount:50
          });
          transaction2=new Wallet().createTransaction({
            recipient:wallet.publicKey,
            amount:60
          });
          blockchain.addblock({data:[transaction1,transaction2]});
        });
        it('adds the sum of all outputs to the wallet balance',()=>{
          
          expect(Wallet.calculateBalance({
            chain:blockchain.chain,
            address:wallet.publicKey
          })).toEqual(STARTING_BALANCE+
            transaction1.outputMap[wallet.publicKey]+
            transaction2.outputMap[wallet.publicKey])
        });
        describe('and the wallet has made a transaction',()=>{
          let recentTransaction;

          beforeEach(()=>{
            recentTransaction=wallet.createTransaction({
              recipient:'fo',
              amount:30
            });
            blockchain.addblock({
              data:[recentTransaction]
            });
          });
          it('returns the output amount of the recent transaction',()=>{
            expect(
              Wallet.calculateBalance({
                chain:blockchain.chain,
                address:wallet.publicKey
              })
            ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
          });
          describe('and there are output next to and after the recent transaction',()=>{
            let sameBlockTransaction, nextBlockTransaction;
            beforeEach(()=>{
              recentTransaction=wallet.createTransaction({
                recipient:'later-foo',
                amount:30
              });
              sameBlockTransaction=Transaction.rewardTransaction({minnerWallet:wallet});
              blockchain.addblock({
                data:[recentTransaction, sameBlockTransaction]
              });
              nextBlockTransaction= new Wallet().createTransaction({
                recipient:wallet.publicKey,
                amount:75
              });
              blockchain.addblock({data:[nextBlockTransaction]});
            });
            it('include the output amount in the returned balance',()=>{
              expect(
                Wallet.calculateBalance({
                  chain:blockchain.chain,
                  address:wallet.publicKey
                })
              ).toEqual(recentTransaction.outputMap[wallet.publicKey]+
                sameBlockTransaction.outputMap[wallet.publicKey]+
                nextBlockTransaction.outputMap[wallet.publicKey])
            })

          })
        })
      });
    });
});