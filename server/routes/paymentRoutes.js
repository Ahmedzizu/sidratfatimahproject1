const router = require('express').Router()
const payments = require('../controller/paymentController');

router.post("/addpayment",payments.addPayment)
router.get('/paypal/clientid',payments.getClientId)

module.exports=router