// server/routes/expensesRoutes.js

const express = require('express');
const router = express.Router();
const expensesController = require('../controller/expensesController');
const { adminAuthorization } = require('../middlewares/middleware');

// الخطوة 1: استيراد middleware رفع الملفات المخصص
const expensesFileUpload = require('../middlewares/expensesUpload');
// الخطوة 2: استيراد مكتبة express-fileupload نفسها
const upload = require('express-fileupload');

// حماية كل المسارات والتأكد من وجود req.user
router.use(adminAuthorization);

router.route('/')
  .get(expensesController.getAllExpenses)
  // الخطوة 3: تطبيق الـ middlewares بالترتيب الصحيح
  .post(
    upload(),                 // أولاً: شغل المحلل الرئيسي ليملأ req.body و req.files
    expensesFileUpload,       // ثانياً: شغل الكود المخصص لحفظ الملف
    expensesController.createNewExpense // ثالثاً: شغل المتحكم الذي سيجد كل البيانات جاهزة
  );

router.route('/:id')
  .put(expensesController.updateExistingExpense)
  .delete(expensesController.deleteExistingExpense);

module.exports = router;