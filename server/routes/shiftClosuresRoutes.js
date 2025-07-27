// routes/shiftClosuresRoutes.js

console.log("✅ shiftClosuresRoutes تم تحميله");
const express = require("express");
const router = express.Router();

// ✅ 1. استورد الدالة الجديدة هنا
const { 
  closeShift, 
  getAllClosures, 
  markAsReceived, 
  getLatestClosure,
   // <-- استيراد 
    getTransactionsForShift,
    applyCarryover // <-- استيراد الدالة الجديدة
} = require("../controller/shiftClosuresController");

router.post("/", closeShift);
router.get("/", getAllClosures);
router.patch('/mark-received/:id', markAsReceived);
router.get("/:id/transactions", getTransactionsForShift);

router.post('/apply-carryover', applyCarryover);
// ✅ 2. قم بتعديل المسار ليستخدم الدالة من الـ controller
router.get('/latest', getLatestClosure);

module.exports = router;