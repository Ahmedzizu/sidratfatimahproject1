// F:\ractprojects\New folder (2)\ggg\Server\1818server\routes\userRoutes.js

const express = require('express');
const usersController = require('../controller/usersController'); // ✅ تم تغيير الاسم ليكون أوضح
const middleware = require('../middlewares/middleware'); // ✅ تم تصحيح الاسم
const router = express.Router();
const deleteFile = require('../middlewares/deleteFile');
const reservationController = require('../controller/reservationController'); // ✅ تم تغيير الاسم ليكون أوضح
const customerController = require('../controller/customerController'); // ✅ استيراد كنترولر العملاء

// مسارات المستخدمين العاديين (Authentication & Profile)
router.post('/signup', usersController.signup);
router.post('/signin', usersController.signin);
router.post('/verify-email', usersController.verifyEmail);
router.post('/resend-email-verification', usersController.resendEmailVerification);
router.post('/forgot-password', usersController.forgotPassword);
router.patch('/reset-password/:token', usersController.resetPassword);
router.post('/phoneVirefy', middleware.authorization, usersController.phoneVirefy);
router.get('/sendOtb', middleware.authorization, usersController.sendOtb);
router.get('/data', middleware.authorization, usersController.getUser);
router.get('/reservation', middleware.authorization, usersController.getUserReservations);
router.delete('/reservation/cancel/:id', middleware.authorization, usersController.cancelUserReservation, reservationController.postNotification); // ✅ تم تصحيح الاسم
router.patch('/updateDate', middleware.authorization, deleteFile.user, usersController.updateUserData);
router.patch('/updatePassword', middleware.authorization, usersController.updateUserPassword);

// تحديث بيانات عميل (Admin)
router.patch('/admin/customers/:id', middleware.adminAuthorization, usersController.adminUpdateUser);

// حذف عميل (Admin)
router.delete('/admin/customers/:id', middleware.adminAuthorization, usersController.adminDeleteUser);

// تغيير حالة التحقق من البريد الإلكتروني لعميل (Admin)
router.patch('/admin/customers/verify-email/:id', middleware.adminAuthorization, usersController.adminVerifyEmail);

// إعادة تعيين كلمة مرور العميل إلى رقم هويته (Admin)
router.patch('/admin/customers/reset-password-to-idnumber/:id', middleware.adminAuthorization, usersController.adminResetPasswordToIdNumber); // مسار أوضح


module.exports = router;