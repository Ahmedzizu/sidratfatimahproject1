const express = require('express');
const router = express.Router();

// --- ✅ استدعاء كل الدوال الخمسة من الكنترولر ---
const { 
    getTreasuryTransactions, 
    addCashTransaction, 
    getEmployeeTreasury,
    reviewShiftClosure,
    confirmShiftHandover
} = require('../controller/treasuryController');

// المسار الأول: جلب كل حركات الخزنة الرئيسية
router.get('/transactions', getTreasuryTransactions);

// المسار الثاني: إضافة حركة جديدة
router.post('/', addCashTransaction);

// المسار الثالث: جلب بيانات خزنة موظف معين
router.get('/employee-treasury/:employeeId', getEmployeeTreasury);

// --- ✅ المسارات الجديدة للعمليات الهامة ---

// المسار الرابع: مراجعة وردية (للمدير)
router.put('/review-shift/:shiftId', reviewShiftClosure);

// المسار الخامس: تأكيد استلام وردية من موظف آخر
router.post('/confirm-handover', confirmShiftHandover);

module.exports = router;