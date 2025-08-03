// F:\ractprojects\New folder (2)\ggg\Server\1818server\server\routes\reservationRoutes.js

const express = require('express');
const reservationController = require('../controller/reservationController');
const router = express.Router();
// ✅ تأكد من استيراد validReservation كاملاً، بما في ذلك getDailyPeriodsStatus
const validReservation = require("../middlewares/validReservation");
const middleware = require('../middlewares/middleware'); 
const twilo = require("../services/twillo");
const upload = require("../middlewares/resetUpoad"); // تأكد من استخدامه لو كان ضروريًا

// ✅ استيراد موديلات الكيانات: هذا ضروري لـ /admin/reservations/get-daily-availability
const Hall = require("../model/hall"); // تأكد أن الاسم مطابق لاسم الموديل المصدر
const Chalet = require("../model/chalet"); // تأكد أن الاسم مطابق لاسم الموديل المصدر
const Resort = require("../model/resort"); // تأكد أن الاسم مطابق لاسم الموديل المصدر

// ✅ استيراد موديل Reservation (ضروري لـ find و findById في المسارات)
const Reservation = require("../model/reservation"); // تأكد من أن اسم الموديل المصدر Reservation وليس reservations

// --- 1. مسارات المستخدم (User Routes) ---
router.post('/user/reservation', validReservation.checkPeriod, reservationController.postUserUnconfirmedReservation, reservationController.postNotification);
router.get('/user/reservations/:id', reservationController.getUserReservations);
router.post('/user/reservation/rate', reservationController.postEntityRate, reservationController.rateReservation);
router.get('/user/reservation/rate', reservationController.getRates);

// ✅ مسار التحقق الصريح من التوفر قبل الإرسال الفعلي (لـ Frontend)
router.post('/user/reservation/check-for-conflict', validReservation.checkPeriod, (req, res) => {
    // إذا وصل الكود هنا، فهذا يعني أن validReservation.checkPeriod لم يجد أي تعارض.
    res.status(200).json({ message: "الفترة متاحة للحجز." });
});

// --- 2. مسارات الإدارة (Admin Routes) ---

// ✅ هذا هو المسار الذي يطلبه الـ Frontend الآن
router.post('/admin/reservations/get-daily-availability', async (req, res) => {
    try {
        const { entityId, date } = req.body; // تاريخ اليوم المطلوب (ISO string)

        if (!entityId || !date) {
            return res.status(400).send({ error: "Entity ID and date are required." });
        }

        let entity;
        // البحث عن الكيان حسب نوعه (Hall, Chalet, Resort)
        // تأكد أن أسماء الموديلات (Hall, Chalet, Resort) مطابقة للاستيرادات أعلاه
        if (!(entity = await Hall.findById(entityId)) &&
            !(entity = await Chalet.findById(entityId)) &&
            !(entity = await Resort.findById(entityId))) {
            return res.status(404).send({ error: "الكيان (Hall/Chalet/Resort) غير موجود." });
        }

        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0); // لتوحيد اليوم فقط (UTC Midnight)

        // جلب الحجوزات النشطة لهذا الكيان في هذا اليوم
        // status: { $in: ['confirmed', 'unConfirmed'] } لتشمل الحجوزات قيد التأكيد
        const existingReservations = await Reservation.find({
            "entity.id": entityId, // استخدام "entity.id" كما هو في الـ Reservation Model
            status: { $in: ['confirmed', 'unConfirmed'] }, // الحالات التي تعتبر "محجوزة" فعليًا
            completed: { $ne: true }, // استبعاد الحجوزات المكتملة
            // فلترة التواريخ لـ MongoDB: تقارن سلاسل نصية 'YYYY-MM-DD'
            "period.startDate": { $lte: targetDate.toISOString().split('T')[0] },
            "period.endDate": { $gte: targetDate.toISOString().split('T')[0] },
        }).lean(); // .lean() لتحسين الأداء

        // استخدام الدالة getDailyPeriodsStatus المستوردة من validReservation
        // هذه هي الدالة التي تحسب التوفر لليوم الواحد
        const dailyAvailability = await validReservation.getDailyPeriodsStatus(entity, targetDate, existingReservations);

        res.status(200).json({
            entityId,
            date: date,
            availability: dailyAvailability // { morning: 'available', night: 'unavailable', wholeDay: 'unavailable' }
        });

    } catch (error) {
        console.error("🔥 Error in /admin/reservations/get-daily-availability:", error.message, error.stack);
        res.status(500).json({ error: "حدث خطأ في الخادم أثناء جلب التوفر اليومي: " + error.message });
    }
});


router.post(
    "/admin/reservations/admin-reservation",
    // ✅ تم استخدام اسم الدالة الصحيح من ملف middleware.js
    middleware.adminAuthorization, 
    validReservation.checkPeriod, 
    reservationController.postAdminReservation
);
// مسارات التعديل الشاملة
router.post('/admin/reservations/update-advanced',reservationController.updateAdvancedReservation);
router.post('/admin/reservations/postpone-start', reservationController.postponeReservationStart);
router.post('/admin/reservations/extend', reservationController.extendReservation);

// مسارات عامة لجلب البيانات (لا تحتاج لـ validPeriod)
router.get('/admin/reservations/all', reservationController.getAllReservations);
router.get('/admin/reservations/getReservationCountsByType', reservationController.getReservationByType);
router.get("/admin/reservations/new", reservationController.getNewReservations);
router.get('/admin/reservations/canceled', reservationController.getCanceledReservations);
router.get("/admin/reservations/unpaid-clients", reservationController.getUnpaidClients);
router.get('/admin/reservations-with-remaining', reservationController.getReservationsWithRemaining);

// مسارات الإلغاء والتأكيد والانتهاء
router.post('/admin/reservation/cancel', reservationController.cancelReservation);
router.patch("/admin/reservation/confirm", validReservation.checkPeriod, reservationController.confirmOrder, reservationController.postNotification);// مسارات التأمين (Insurance)
router.patch('/admin/insurance', reservationController.retriveInsurance);
router.patch("/admin/insurance/finance", reservationController.insuranceFinance);

// مسارات تأجيل الحجز (Deferred)
router.post('/admin/reservation/confirmed/deferred', validReservation.checkPeriod, reservationController.deferreReservation);

// مسار تحديث الخصم (Discount)
router.post('/admin/reservation/discount', reservationController.updateReservationDiscount);

// مسار حذف الحجز (تغيير الحالة إلى canceled)
router.delete('/admin/reservation/delete/:id', reservationController.deleteAdminReservation);

// مسار تحديث الحجز القديم (لو لازالت مستخدمة)
// router.post('/admin/reservation/update', validReservation.checkPeriod, reservationController.updateAdminReservation);

// مسار إكمال الحجز
router.patch('/admin/reservation/:id/complete', reservationController.completeReservation);
// مسار إضافة حجز عام (لو لازال مستخدمًا، يحتاج checkPeriod)
router.post("/admin/addReservation", validReservation.checkPeriod, reservationController.addReservation);

// مسارات الإشعارات
router.route("/admin/notification")
    .get(reservationController.getNotification)
    .patch(reservationController.deleteNotifiaction);

// مسار الـ reset
router.post("/admin/resert", upload.single("reset"), twilo.sendWhatsappReset);


module.exports = router;