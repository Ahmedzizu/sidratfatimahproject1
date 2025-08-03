const router = require("express").Router()
const middlwares=require("../middlewares/middleware");
const paymentCtl = require("../controller/reservation_payments.control");
const { adminAuthorization } = require('../middlewares/middleware');

router.post('/add-payment', adminAuthorization, paymentCtl.addPayment);
router.post("/update" , paymentCtl.updatePayment )
router.delete("/:id" , paymentCtl.deletePayment )
router.get("/get-all-payment" , paymentCtl.getAllPayments )
router.get("/get-payment/:id"  , paymentCtl.getPayments )
router.post("/discounts/add", paymentCtl.addDiscount); // 🔹 إضافة كود خصم جديد
router.get("/discounts", paymentCtl.getAllDiscounts);
router.put("/discounts/update/:id", paymentCtl.updateDiscount);
router.delete("/discounts/delete/:id", paymentCtl.deleteDiscount);
router.get("/sources/all", adminAuthorization, paymentCtl.getSources);

// The correct route includes the ID parameter
router.get('/reservation-payments/:id', paymentCtl.getPayments);

module.exports = router