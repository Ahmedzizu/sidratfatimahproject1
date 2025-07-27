const express = require("express");
const router = express.Router();
const financeController = require("../controller/financeController");
const expensesUpload = require("../middlewares/expensesUpload"); // ✅ استخدم middleware الصحيح
const middlwares = require("../middlewares/middleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/expenses/" }); // ✅ ضبط التخزين الصحيح




router.route('/draws')
.post(financeController.postDraws)
.get(financeController.getDraws)
router.delete('/draws/delete/:id',financeController.deleteDraws)
router.post('/draws/update',financeController.updateDraws)

router.route('/paypal')
.post(financeController.postPaypal)
.get(financeController.getPaypal)
router.delete('/paypal/delete/:id',financeController.deletePaypal)
router.post('/paypal/update',financeController.updatePaypal)

router.route('/onlinepayment')
.post(financeController.postOnlinePayment)
.get(financeController.getOnlinePayment)
router.delete('/onlinepayment/delete/:id',financeController.deleteOnlinePayment)
router.post('/onlinepayment/update',financeController.updateOnlinePayment)

router.route('/banktransaction')
.post(financeController.postBankTransaction)
.get(financeController.getBankTransaction)
router.delete('/banktransaction/delete/:id',financeController.deleteBankTransaction)
router.post('/banktransaction/update',financeController.updateBankTransaction)

module.exports = router;