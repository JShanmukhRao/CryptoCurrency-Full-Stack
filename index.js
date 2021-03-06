const bodyParser = require('body-parser')
const express = require('express')
const request = require('request')
const PubSub = require('./app/pubsub')
const Blockchain = require('./blockchain')
const TransactionPool=require('./wallet/transaction-pool')
const Wallet=require('./wallet')
const TransactionMiner=require('./app/transaction-miner')
const DEFAULT_PORT = 3000;
const app = express();
const path=require('path');
const blockchain = new Blockchain();

const transactionPool=new TransactionPool()
const pubsub = new PubSub({ blockchain,transactionPool });
const wallet=new Wallet();
const transactionMiner=new TransactionMiner({blockchain,transactionPool,pubsub,wallet});
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'client/dist')));
app.get('/api/blocks', (req, res) => {

    res.json(blockchain.chain);
});
app.post('/api/mine', (req, res) => {

    const { data } = req.body;
    blockchain.addblock({ data })
    pubsub.broadcastChain();
    res.redirect('/api/blocks')

});
app.post('/api/transact',(req,res)=>{
    const {recipient,amount}=req.body;
    let transaction=transactionPool.existingTransaction({inputAddress:wallet.publicKey})
    try{
        if(transaction)
        {
            transaction.update({
                senderWallet:wallet,address:recipient,amount
            })
        }
        else{        
        transaction=wallet.createTransaction({
            recipient,
            chain:blockchain.chain, 
            amount 
        });
        }
    }
    catch(error)
    {
        return res.status(400).json({type:'error',message:error.message})
    }
    transactionPool.setTransaction(transaction);
pubsub.broadcastTransaction(transaction)
    res.json({type:'success',transaction})
});
app.get('/api/transaction-pool-map',(req,res)=>{
    res.status(200).json(transactionPool.transactionMap)
})
app.get('/api/mine-transaction',(req,res)=>{
    transactionMiner.mineTransaction();
    res.redirect('/api/blocks')
});
app.get('/api/wallet-info',(req,res)=>{
res.json({
    address:wallet.publicKey,
    balance:Wallet.calculateBalance({chain:blockchain.chain,address:wallet.publicKey})
})
});
app.get('*',(req,res)=>{
   res.sendFile(path.join(__dirname,'client/dist/index.html'));
})
const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, responce, body) => {
        if (!error && responce.statusCode === 200) {
            const requestedData = JSON.parse(body);
            console.log('replace chain on sync with', requestedData);
            blockchain.replaceChain(requestedData);
        }

    });
    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, responce, body) => {
        if (!error && responce.statusCode === 200) {
            const requestedData = JSON.parse(body);
            console.log('replace chain on sync with', requestedData);
            transactionPool.setMap(requestedData);
        }

    })
}

let PEER_PORT;
if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}
const PORT = PEER_PORT || DEFAULT_PORT;


app.listen(PORT, () => {
    console.log(`App is running in localhost:${PORT}`);
    if(PORT!==DEFAULT_PORT)
    {
        syncWithRootState();

    }
})