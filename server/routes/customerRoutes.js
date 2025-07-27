// F:\ractprojects\New folder (2)\ggg\Server\1818server\routes\customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController'); // تأكد من استيراد الكنترولر الصحيح
const middleware = require('../middlewares/middleware'); // استيراد الـ middleware للـ authorization

router.route('/customer')
    .post(middleware.adminAuthorization, customerController.postCustomer) // ✅ إضافة middleware للـ Admin عشان الأدمن بس اللي يضيف
    .get(middleware.adminAuthorization, customerController.getCustomer); // ✅ إضافة middleware للـ Admin عشان الأدمن بس اللي يجلب

router.delete('/customer/:id', middleware.adminAuthorization, customerController.deleteCustomer); // ✅ المسار أصبح /customer/:id و Method DELETE

router.patch('/customer/:id', middleware.adminAuthorization, customerController.updateCustomer); // ✅ المسار أصبح /customer/:id و Method PATCH

// ✅ إضافة مسارات Verify Email و Reset Password لـ CustomerController
router.patch('/customer/verify-email/:id', middleware.adminAuthorization, customerController.adminVerifyEmail);
router.patch('/customer/reset-password/:id', middleware.adminAuthorization, customerController.adminResetPassword); // ✅ المسار أصبح /customer/reset-password/:id

module.exports = router;