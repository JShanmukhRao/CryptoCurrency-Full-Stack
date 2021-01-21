const EC=require('elliptic').ec;

const ec=new EC('secp256k1');
const verify_signature=({publicKey,data,signature})=>{
    return ec.keyFromPublic(publicKey,'hex').verify(data,signature);
}
module.exports={ec,verify_signature}