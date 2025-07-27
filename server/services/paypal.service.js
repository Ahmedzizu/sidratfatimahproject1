var paypal = require('paypal-rest-sdk');
require('dotenv').config()

paypal.configure({
    'mode': process.env.PAYPAL_MODE, //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
  });

  // createPayment= async(payment)=>{
  //   return new Promise((resolve,reject)=>{
  //       payment.payment.create(payment,(err,pay)=>{
  //         if(err) return reject(err)
  //         resolve(pay);
  //       })
  //   })
  // }
  
  module.exports=paypal