const paypalService=require("../services/paypal.service")
require('dotenv').config()

const paymentController={
    addPayment:async (req,res)=>{
        var create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://return.url",
                "cancel_url": "http://cancel.url"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "item",
                        "sku": "item",
                        "price": "1.00",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": "1.00"
                },
                "description": "This is the payment description."
            }]
        };
        paypalService.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                res.status(403).send(error.message)
            } else {
                console.log("Create Payment Response ------------");
                console.log(payment);
                res.send(payment)
            }
        });
    },
    getClientId:(req,res)=>{
        try {
            res.send({id:process.env.PAYPAL_CLIENT_ID || "sb"})
        } catch (error) {
            console.log(error.message);
            res.status(400).send(error.message)
        }
    }
}

module.exports=paymentController