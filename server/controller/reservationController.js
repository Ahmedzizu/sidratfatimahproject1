const Reservation = require("../model/reservation");
const ReservationPayments = require("../model/reservationPayments");
const Expenses = require("../model/expenses");
const Draws = require("../model/draws");
const BankTransactions = require("../model/banktransactions");
const Discount = require("../model/Discount"); // ✅ استيراد مودل كود الخصم
const User = require("../model/user");
const Customer = require("../model/user");
const Payments = require("../model/reservationPayments");

const { format, parseISO, addDays, isToday } = require("date-fns");
const dateToday = require("../middlewares/dateToday");
const Insurence = require("../model/insurance");
const Hall = require("../model/hall");
const Chalet = require("../model/chalet");
const Rating = require("../model/rating");
const Notification = require("../model/notification");
const loggerEvent = require("../services/logger");
const logger = loggerEvent("reservations");
const mongoose = require("mongoose");
const { sendWhatsappMsg } = require('../services/twillo'); 
const ReservationServices = require("../model/reservationServices");// <== تأكد من صحة المسار
const axios = require('axios');
// تأكد من صحة المسار

// ✅ دالة مساعدة لتحويل الوقت إلى دقائق من منتصف الليل (لتسهيل المقارنة)
const timeToMinutes = (timeString) => { // e.g., "09:00" -> 540
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};
function getDayName(dateString) {
  const date = new Date(dateString);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

// ✨ دالة جديدة لتنسيق الوقت بنظام 12 ساعة
function formatTime12Hour(timeString) {
  if (!timeString || !timeString.includes(':')) {
    return ''; // إرجاع قيمة فارغة إذا كان التنسيق غير صالح
  }
  const [hour24, minute] = timeString.split(':').map(Number);
  const period = hour24 >= 12 ? 'مساءً' : 'صباحًا';
  let hour12 = hour24 % 12;
  hour12 = hour12 ? hour12 : 12; // التعامل مع منتصف الليل (0 يصبح 12)
  const minuteStr = String(minute).padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}
// ✅ دالة للتحقق من تداخل الفترات الزمنية
// hallPrices: كائن يحتوي على أسعار القاعة (dayStartHour, nightEndHour, etc.)
// existingReservations: مصفوفة من كائنات الحجوزات من الـ DB
// requestedPeriod: الكائن period المرسل من الـ frontend
async function checkPeriodOverlap(hallPrices, existingReservations, requestedPeriod) {
    const requestedStartDate = new Date(requestedPeriod.startDate);
    const requestedEndDate = new Date(requestedPeriod.endDate);

    // توحيد التواريخ لمنتصف الليل بتوقيت UTC لتجنب مشاكل المنطقة الزمنية
    requestedStartDate.setUTCHours(0, 0, 0, 0);
    requestedEndDate.setUTCHours(0, 0, 0, 0);

    // تحديد أوقات الدخول والخروج المطلوبة بالدقائق
    let requestedCheckInMinutes;
    let requestedCheckOutMinutes;

    if (requestedPeriod.type === 'dayPeriod') { // حجز لفترة ثابتة في يوم واحد
        const period = requestedPeriod.dayPeriod; // "صباحية", "مسائية", "كامل اليوم"
        const specificPeriod = periodButtons.find(p => p.value === period); // استخدم نفس الـ periodButtons من الـ frontend

        if (specificPeriod) {
            requestedCheckInMinutes = timeToMinutes(specificPeriod.checkInTime);
            requestedCheckOutMinutes = timeToMinutes(specificPeriod.checkOutTime);
        } else if (period === 'كامل اليوم') {
            requestedCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
            requestedCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
        } else if (period === 'صباحية') {
            requestedCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
            requestedCheckOutMinutes = timeToMinutes(hallPrices.dayEndHour);
        } else if (period === 'مسائية') {
            requestedCheckInMinutes = timeToMinutes(hallPrices.nightStartHour);
            requestedCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
        } else {
             // fallback for safety, assume whole day if period not found
            requestedCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
            requestedCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
        }
        
        // Ensure same-day booking for dayPeriod
        requestedEndDate.setUTCHours(0,0,0,0); // Ensure end date is same as start date for fixed period
    } else { // حجز لعدة أيام
        requestedCheckInMinutes = timeToMinutes(requestedPeriod.checkIn.time);
        requestedCheckOutMinutes = timeToMinutes(requestedPeriod.checkOut.time);
    }
    
    // حالة التوفر التفصيلية (لليوم الواحد فقط)
    const detailedAvailability = { morning: 'available', night: 'available', wholeDay: 'available' };
    let isOverallAvailable = true;

    // Iterate through each day in the requested range
    let currentDate = new Date(requestedStartDate);
    while (currentDate.getTime() <= requestedEndDate.getTime()) {
        const currentDayUTC = new Date(currentDate).setUTCHours(0, 0, 0, 0);

        for (const existingRes of existingReservations) {
            // تجاهل الحجوزات الملغاة
            if (existingRes.status === 'canceled') continue;

            const existingStartDate = new Date(existingRes.period.startDate);
            const existingEndDate = new Date(existingRes.period.endDate);

            existingStartDate.setUTCHours(0, 0, 0, 0);
            existingEndDate.setUTCHours(0, 0, 0, 0);

            // تحقق من تداخل التواريخ على مستوى اليوم
            if (currentDayUTC >= existingStartDate.getTime() && currentDayUTC <= existingEndDate.getTime()) {
                // يوجد تداخل في الأيام، الآن تحقق من تداخل الفترات داخل اليوم
                let existingCheckInMinutes;
                let existingCheckOutMinutes;

                // تحديد أوقات الدخول والخروج للحجز الموجود بالدقائق
                if (existingRes.period.type === 'dayPeriod') {
                    const period = existingRes.period.dayPeriod;
                    const specificPeriod = periodButtons.find(p => p.value === period);
                    
                    if (specificPeriod) {
                        existingCheckInMinutes = timeToMinutes(specificPeriod.checkInTime);
                        existingCheckOutMinutes = timeToMinutes(specificPeriod.checkOutTime);
                    } else if (period === 'كامل اليوم') {
                         existingCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
                         existingCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
                    } else if (period === 'صباحية') {
                        existingCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
                        existingCheckOutMinutes = timeToMinutes(hallPrices.dayEndHour);
                    } else if (period === 'مسائية') {
                        existingCheckInMinutes = timeToMinutes(hallPrices.nightStartHour);
                        existingCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
                    }
                } else { // Multiple days booking
                    existingCheckInMinutes = timeToMinutes(existingRes.period.checkIn.time);
                    existingCheckOutMinutes = timeToMinutes(existingRes.period.checkOut.time);
                }

                // 🚨 المنطق الحاسم لتحديد التعارضات الدقيقة
                // للحجز الحالي (currentDate)
                const currentDayCheckInMinutes = requestedCheckInMinutes;
                const currentDayCheckOutMinutes = requestedCheckOutMinutes;

                // حالة خاصة: إذا كان الحجز الحالي متعدد الأيام، ولكننا نتحقق من اليوم الأول أو الأخير
                if (requestedPeriod.type === 'days') {
                    if (currentDayUTC === requestedStartDate.getTime()) { // اليوم الأول من حجز عدة أيام
                        // يجب أن يكون الدخول في هذا اليوم متاحًا من وقت الدخول المطلوب حتى نهاية اليوم
                        // أو حسب فترة الدخول المحددة للحجز المتعدد الأيام
                        // نستخدم checkInSelection من الواجهة الأمامية
                        if (requestedPeriod.checkIn.name === 'مسائية') {
                            // إذا كان الدخول مساءً، فإن الفترة الصباحية لهذا اليوم تعتبر متاحة للحجوزات الأخرى
                            // لكن الفترة المسائية ستتعارض مع أي حجز مسائي أو كامل اليوم في نفس اليوم
                            currentDayCheckInMinutes = timeToMinutes(hallPrices.nightStartHour);
                        } else { // صباحية أو كامل اليوم
                            currentDayCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
                        }
                    } else if (currentDayUTC === requestedEndDate.getTime()) { // اليوم الأخير من حجز عدة أيام
                        // يجب أن يكون الخروج في هذا اليوم متاحًا من بداية اليوم حتى وقت الخروج المطلوب
                        // أو حسب فترة الخروج المحددة للحجز المتعدد الأيام
                        // نستخدم checkOutSelection من الواجهة الأمامية
                        if (requestedPeriod.checkOut.name === 'صباحية') {
                            // إذا كان الخروج صباحًا، فإن الفترة المسائية لهذا اليوم تعتبر متاحة للحجوزات الأخرى
                            // لكن الفترة الصباحية ستتعارض مع أي حجز صباحي أو كامل اليوم في نفس اليوم
                            currentDayCheckOutMinutes = timeToMinutes(hallPrices.dayEndHour);
                        } else { // مسائية أو كامل اليوم
                            currentDayCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
                        }
                    } else { // أيام في المنتصف من حجز عدة أيام
                        // هذه الأيام تكون محجوزة بالكامل
                        currentDayCheckInMinutes = timeToMinutes(hallPrices.dayStartHour);
                        currentDayCheckOutMinutes = timeToMinutes(hallPrices.nightEndHour);
                    }
                }


                // المنطق الأساسي للتعارض:
                // يحدث تداخل إذا:
                // (بداية الحجز الحالي < نهاية الحجز الموجود) AND (نهاية الحجز الحالي > بداية الحجز الموجود)
                // هذا ينطبق على الفترات الزمنية داخل اليوم
                const hasTimeOverlap = (
                    currentDayCheckInMinutes < existingCheckOutMinutes &&
                    currentDayCheckOutMinutes > existingCheckInMinutes
                );

                if (hasTimeOverlap) {
                    isOverallAvailable = false;
                    // إذا كان الحجز ليوم واحد، يمكننا تحديد الفترة المحددة غير المتاحة
                    if (requestedPeriod.type === 'dayPeriod' && requestedStartDate.getTime() === requestedEndDate.getTime()) {
                        // هنا نحدد أي الفترات تتعارض
                        const morningStart = timeToMinutes(hallPrices.dayStartHour);
                        const morningEnd = timeToMinutes(hallPrices.dayEndHour);
                        const nightStart = timeToMinutes(hallPrices.nightStartHour);
                        const nightEnd = timeToMinutes(hallPrices.nightEndHour);

                        // تحقق من التعارض مع الفترة الصباحية
                        if ((existingCheckInMinutes < morningEnd && existingCheckOutMinutes > morningStart) ||
                            (currentDayCheckInMinutes < morningEnd && currentDayCheckOutMinutes > morningStart)
                        ) {
                            detailedAvailability.morning = 'unavailable';
                        }
                        // تحقق من التعارض مع الفترة المسائية
                        if ((existingCheckInMinutes < nightEnd && existingCheckOutMinutes > nightStart) ||
                            (currentDayCheckInMinutes < nightEnd && currentDayCheckOutMinutes > nightStart)
                        ) {
                            detailedAvailability.night = 'unavailable';
                        }
                        // إذا تعارضت أي فترة مع "كامل اليوم"، يكون كامل اليوم غير متاح
                        if (detailedAvailability.morning === 'unavailable' && detailedAvailability.night === 'unavailable') {
                            detailedAvailability.wholeDay = 'unavailable';
                        } else if (detailedAvailability.morning === 'unavailable') {
                            detailedAvailability.wholeDay = 'partial-unavailable'; // أو أي حالة أخرى تشير لتعارض جزئي
                        } else if (detailedAvailability.night === 'unavailable') {
                            detailedAvailability.wholeDay = 'partial-unavailable';
                        }
                    }
                    // لا تتوقف هنا، أكمل التحقق لتحديد جميع التعارضات وتحديث detailedAvailability
                }
            }
        }
        currentDate.setDate(currentDate.getDate() + 1); // انتقل إلى اليوم التالي
    }

    return {
        available: isOverallAvailable,
        message: isOverallAvailable ? 'متاح' : 'غير متاح في الفترة المطلوبة.',
        detailedAvailability: detailedAvailability // يعود بحالة كل فترة (صباحية/مسائية/كامل اليوم)
    };
}
const reservation = {

   postUserUnconfirmedReservation: async (req, res, next) => {
        try {
            const {
                clientName,
                phone,
                address,
                nationality,
                idNumber,
                email,
                password,
                entityId,
                // discountCode, // ❌ لن نستقبلها كـ discountAmount مباشرة
                couponCode, // ✅ سنستقبلها كـ couponCode
                paymentMethod,
                paidAmount = 0,
                bankName = null,
                paymentProof = null,
                period
            } = req.body;

            // ... (باقي كود التحقق من period ونوع entity وتحديد finalClient) ...
            if (!period || !period.startDate || !period.endDate || !period.type || !period.checkIn || !period.checkOut) {
                return res.status(400).json({ error: "بيانات الفترة (period) غير كاملة أو غير صحيحة. يجب توفير startDate, endDate, type, checkIn, checkOut." });
            }

            const objectId = new mongoose.Types.ObjectId(entityId);
            let entity;
            let type; 

            if ((entity = await Hall.findById(objectId))) type = "hall";
            else if ((entity = await Chalet.findById(objectId))) type = "chalet";
            else if ((entity = await Resort.findById(objectId))) type = "resort"; // تأكد من استيراد Resort
            else return res.status(404).json({ error: "الكيان (Hall/Chalet/Resort) غير موجود." });

            let finalClient;
            const clientPhoneExists = await User.findOne({ phone: phone });

            if (clientPhoneExists) {
                finalClient = clientPhoneExists;
                let needsUpdate = false;
                if (!finalClient.nationality && nationality) { finalClient.nationality = nationality; needsUpdate = true; }
                if (!finalClient.idNumber && idNumber) { finalClient.idNumber = idNumber; needsUpdate = true; }
                if (!finalClient.address && address) { finalClient.address = address; needsUpdate = true; }
                if (needsUpdate) {
                    await finalClient.save({ validateBeforeSave: false });
                }
            } else {
                const newCustomerData = { 
                    name: clientName, 
                    phone, 
                    address, 
                    nationality, 
                    idNumber,
                    email: email || `${phone}@example.com`,
                    password: password || String(idNumber || 'defaultpassword') 
                };
                finalClient = new User(newCustomerData);
                await finalClient.save();
            }

            // --- حساب التكلفة الإجمالية الأولية (قبل الخصم) ---
            let totalCost = 0;
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);

            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(0, 0, 0, 0);

            const isSingleDayBooking = start.getTime() === end.getTime();

            if (isSingleDayBooking) {
                if (period.dayPeriod === 'كامل اليوم') {
                    totalCost = entity.price.wholeDay;
                } else if (period.dayPeriod === 'صباحية') {
                    totalCost = entity.price.morning;
                } else if (period.dayPeriod === 'مسائية') {
                    totalCost = entity.price.night;
                } else {
                    totalCost = entity.price.wholeDay; 
                }
            } else { // حجز لعدة أيام
                let currentDate = new Date(start);
                while (currentDate <= end) {
                    let dayCost = 0;
                    const tempCurrentDateUTC = new Date(currentDate).setUTCHours(0, 0, 0, 0);

                    if (tempCurrentDateUTC === start.getTime()) {
                        dayCost = period.checkIn.name === 'صباحية' ? entity.price.wholeDay : entity.price.night;
                    } else if (tempCurrentDateUTC === end.getTime()) {
                        dayCost = period.checkOut.name === 'صباحية' ? entity.price.morning : entity.price.wholeDay;
                    } else {
                        dayCost = entity.price.wholeDay;
                    }
                    totalCost += dayCost;
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            
            const originalCost = totalCost;
            let finalDiscountAmount = 0;
            let appliedCouponCode = null; // لتخزين الكود الذي تم تطبيقه

            // ✅ منطق تطبيق الكوبون
      if (couponCode) {
    console.log("Attempting to use coupon:", couponCode); // ✅ أضف هذا السطر

    const discountCoupon = await Discount.findOne({ code: couponCode });

    if (!discountCoupon) {
        console.log("Coupon not found for code:", couponCode); // ✅ أضف هذا السطر
        return res.status(400).json({ error: "كود الكوبون غير صالح." });
    }

    console.log("Found coupon:", discountCoupon); // ✅ أضف هذا السطر
    console.log("Current date:", new Date());
    console.log("Expiry date:", discountCoupon.expiryDate);

    if (new Date() > discountCoupon.expiryDate) {
        console.log("Coupon expired."); // ✅ أضف هذا السطر
        return res.status(400).json({ error: "كود الكوبون منتهي الصلاحية." });
    }

    console.log("Max users:", discountCoupon.maxUsers);
    console.log("Used by count:", discountCoupon.usedBy.length);

    if (discountCoupon.maxUsers <= discountCoupon.usedBy.length) {
        console.log("Coupon reached max usage."); // ✅ أضف هذا السطر
        return res.status(400).json({ error: "تم استخدام هذا الكوبون الحد الأقصى من المرات." });
    }

    console.log("Client ID:", finalClient._id.toString());
    console.log("Used by array:", discountCoupon.usedBy.map(id => id.toString())); // ✅ أضف هذا السطر

    if (discountCoupon.usedBy.includes(finalClient._id.toString())) {
        console.log("Client already used this coupon."); // ✅ أضف هذا السطر
        return res.status(400).json({ error: "لقد استخدمت هذا الكوبون من قبل." });
    }

                
                // تطبيق الخصم (نسبة مئوية)
                finalDiscountAmount = (originalCost * discountCoupon.discount) / 100;
                totalCost -= finalDiscountAmount;

                // تسجيل استخدام الكوبون
                discountCoupon.usedBy.push(finalClient._id);
                await discountCoupon.save();
                appliedCouponCode = couponCode;
            }

            // ... (باقي كود إنشاء الحجز) ...
            const contractNumber = await Reservation.generateContractID(type);
            const newReservation = new Reservation({
                type,
                client: {
                    id: finalClient._id,
                    name: finalClient.name,
                    phone: finalClient.phone,
                    address: finalClient.address,
                    nationality: finalClient.nationality,
                    idNumber: finalClient.idNumber
                },
                entity: { id: entityId, name: entity.name },
                originalCost: originalCost,
                cost: totalCost,
                discountAmount: finalDiscountAmount, // سيتم تخزين مبلغ الخصم الفعلي
                period: period,
                status: "unConfirmed",
                date: new Date().toISOString().split('T')[0],
                notes: "",
                payment: {
                    method: paymentMethod,
                    paidAmount: parseFloat(paidAmount || 0),
                    remainingAmount: totalCost - parseFloat(paidAmount || 0),
                    bankName: paymentMethod === "bank" ? bankName : null,
                    paymentProof: paymentMethod === "bank" ? paymentProof : null
                },
                contractNumber,
                discountCode: appliedCouponCode, // ✅ هنا سنحفظ كود الكوبون النصي إذا تم تطبيقه
            });
            
            await newReservation.save();
 

            res.status(201).json({
                message: "User reservation created successfully. Please wait for admin confirmation.",
                totalCost,
                discountAmount: finalDiscountAmount,
                remainingAmount: totalCost - parseFloat(paidAmount || 0),
                reservationId: newReservation._id
            });
        } catch (error) {
            console.error("🔥 Error in postUserUnconfirmedReservation:", error.message, error);
            if (error.code === 11000) {
                return res.status(409).json({ error: "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل." });
            }
            if (error.name === 'ValidationError') {
                const errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }
                return res.status(400).json({ message: "Validation error: " + Object.values(errors).join(', '), errors: errors });
            }
            next(error);
        }
    },

  getUserReservations: async (req, res) => {
    try {
      const { id } = req.params;
      const reservations = await Reservation.find({
        "client.id": id,
        status: "unConfirmed",
      });
      res.send(reservations);
    } catch (error) {
      logger.error(error.message);
      res.status(500).send(error.message);
    }
  },
  getAllReservations: async (req, res) => {
    try {
      let reservations = await Reservation.find({});
      res.send(reservations);
    } catch (error) {
      logger.error(error.message);
      res.status(500).send({ eror: error.message });
    }
  },

 
// في ملف controller الحجوزات بالباك-اند

getReservationByType: async (req, res) => {
  try {
    const types = ["hall", "chalet", "resort"];

    // --- حساب الإحصائيات القديمة (عدد الحجوزات المؤكدة لكل نوع) ---
    const confirmedCountsPromise = Reservation.aggregate([
      { $match: { type: { $in: types }, status: "confirmed" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    
    // --- حساب الإحصائيات الأخرى ---
    const unconfirmedCountPromise = Reservation.countDocuments({ status: "unConfirmed" });
    const unpaidClientsPromise = Reservation.find({ status: { $ne: "canceled" } }).lean(); // سنقوم بحساب العدد لاحقاً

    // ✅✅✅  بداية الجزء الجديد: حساب حجوزات اليوم  ✅✅✅

    // 1. تحديد تاريخ اليوم (بدايته ونهايته)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. إنشاء الاستعلامات لحساب الأعداد الجديدة
    const hallsStartingTodayPromise = Reservation.countDocuments({
        type: 'hall',
        status: 'confirmed',
        'period.startDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const hallsEndingTodayPromise = Reservation.countDocuments({
        type: 'hall',
        status: 'confirmed',
        'period.endDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const chaletsStartingTodayPromise = Reservation.countDocuments({
        type: 'chalet',
        status: 'confirmed',
        'period.startDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const chaletsEndingTodayPromise = Reservation.countDocuments({
        type: 'chalet',
        status: 'confirmed',
        'period.endDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
const expensesPromise = Expenses.aggregate([
    { $addFields: { dateAsDate: { $toDate: "$date" } } },
    { $match: { dateAsDate: dateFilter } },
    { 
      $group: { 
        // ✅ التعديل هنا: استخدام billType بدلاً من paymentMethod
        _id: { type: "$type", paymentMethod: "$billType" }, 
        totalAmount: { $sum: "$amount" } 
      } 
    },
]);
    // --- تنفيذ كل الاستعلامات معًا لتحسين الأداء ---
    const [
        reservationCounts,
        unconfirmedReservationsCount,
        reservationsForUnpaid,
        hallsStartingToday,
        hallsEndingToday,
        chaletsStartingToday,
        chaletsEndingToday
    ] = await Promise.all([
        confirmedCountsPromise,
        unconfirmedCountPromise,
        unpaidClientsPromise,
        hallsStartingTodayPromise,
        hallsEndingTodayPromise,
        chaletsStartingTodayPromise,
        chaletsEndingTodayPromise
    ]);
    
    // --- معالجة النتائج ---
    // (نفس الكود السابق لمعالجة reservationCounts و unpaidClients)
    const countsMap = types.reduce((acc, type) => ({...acc, [type]: 0}), {});
    reservationCounts.forEach(item => { countsMap[item._id] = item.count; });
    const finalReservationCounts = Object.entries(countsMap).map(([type, count]) => ({ type, count }));

    const unpaidClients = new Set();
    for (const reservation of reservationsForUnpaid) {
        const payments = await ReservationPayments.find({ reservation: reservation._id }).lean();
        const totalPaid = payments.reduce((sum, payment) => sum + payment.paid, 0);
        if (totalPaid < reservation.cost) unpaidClients.add(reservation.client.id);
    }
    
    // --- إرسال الاستجابة النهائية مع كل البيانات الجديدة ---
    res.send({
      reservationCounts: finalReservationCounts,
      unpaidClientsCount: unpaidClients.size,
      unconfirmedReservationsCount,
      // ✅✅✅  إضافة القيم الجديدة هنا  ✅✅✅
      hallsStartingToday,
      hallsEndingToday,
      chaletsStartingToday,
      chaletsEndingToday
    });

  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ error: error.message });
  }
},


getReservationsWithRemaining: async (req, res) => {
  try {
    const reservations = await Reservation.aggregate([
      // ... مراحل الفلترة والربط مع الدفعات والخدمات تبقى كما هي ...
      { $match: { type: { $in: ['hall', 'chalet'] } } },
      { $lookup: { from: 'reservation-payments', localField: '_id', foreignField: 'reservation', as: 'payments' }},
      { $lookup: { from: 'reservationservices', localField: '_id', foreignField: 'reservationId', as: 'services' }},
      
      // ✅✅✅ --- بداية الجزء الجديد والمهم: جلب أسماء الموظفين --- ✅✅✅
      {
        $unwind: { path: "$modificationHistory", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "employees", // ❗️ تأكد أن هذا هو اسم جدول الموظفين الصحيح
          localField: "modificationHistory.modifiedBy",
          foreignField: "_id",
          as: "modificationHistory.modifiedBy"
        }
      },
      {
        $unwind: { path: "$modificationHistory.modifiedBy", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: "$_id",
          doc: { "$first": "$$ROOT" },
          modificationHistory: { "$push": "$modificationHistory" }
        }
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$doc", { modificationHistory: "$modificationHistory" }] }
        }
      },
      // ✅✅✅ --- نهاية الجزء الجديد --- ✅✅✅

      // --- باقي المراحل لحساب المبلغ المتبقي (تم تصحيحها سابقًا) ---
      {
        $addFields: {
          totalPaid: { $sum: '$payments.paid' },
          totalServices: { $sum: '$services.price' },
        }
      },
      {
        $addFields: {
          remainingAmount: {
            $subtract: [
              { $add: [ { $ifNull: ['$cost', 0] }, { $ifNull: ['$totalServices', 0] } ]},
              { $ifNull: ['$totalPaid', 0] }
            ]
          }
        }
      },
      {
        $project: {
          payments: 0,
          services: 0,
          "modificationHistory.modifiedBy.password": 0,
          "modificationHistory.modifiedBy.permissions": 0
        }
      }
    ]);

    res.status(200).json(reservations);

  } catch (error) {
    console.error("🔥 Error fetching reservations with remaining amount:", error);
    res.status(500).json({ message: "Server error while fetching reservations.", error: error.message });
  }
},




//  updateAdminReservation: async (req, res) => {
//   try {
//     logger.info(req.body);
//     let {
//       clientName,
//       startDate,
//       endDate,
//       cost,
//       entityId,
//       dayPeriod,
//       _id,
//       entityName,
//       phone,
//       clientId,
//       modifiedBy, // 👈 يجب إرساله من الواجهة (هو الموظف اللي عدل)
//     } = req.body;

//     let reservation = await Reservation.findById(_id);
//     if (!reservation) return res.status(404).send("Reservation not found");

//     let modifications = [];

//     if (reservation.client.name !== clientName) {
//       modifications.push(`تعديل اسم العميل من ${reservation.client.name} إلى ${clientName}`);
//     }

//     if (reservation.client.phone !== phone) {
//       modifications.push(`تعديل رقم الهاتف من ${reservation.client.phone} إلى ${phone}`);
//     }

//     if (reservation.period.startDate.toISOString().slice(0,10) !== startDate) {
//       modifications.push(`تعديل تاريخ البداية من ${reservation.period.startDate.toISOString().slice(0,10)} إلى ${startDate}`);
//     }

//     if (reservation.period.endDate.toISOString().slice(0,10) !== endDate) {
//       modifications.push(`تعديل تاريخ النهاية من ${reservation.period.endDate.toISOString().slice(0,10)} إلى ${endDate}`);
//     }

//     if (reservation.period.dayPeriod !== dayPeriod) {
//       modifications.push(`تعديل الفترة من ${reservation.period.dayPeriod} إلى ${dayPeriod}`);
//     }

//     if (reservation.cost !== cost) {
//       modifications.push(`تعديل السعر من ${reservation.cost} إلى ${cost}`);
//     }

//     if (reservation.entity.name !== entityName) {
//       modifications.push(`تعديل اسم القاعة/الشاليه من ${reservation.entity.name} إلى ${entityName}`);
//     }

//     if (reservation.entity.id.toString() !== entityId) {
//       modifications.push(`تعديل القاعة/الشاليه`);
//     }

//     let type = startDate == endDate ? "dayPeriod" : "days";

//     // ✅ تنفيذ التعديل
//     await Reservation.findByIdAndUpdate(_id, {
//       "client.name": clientName,
//       "client.phone": phone,
//       "client.id": clientId,
//       "entity.name": entityName,
//       "entity.id": entityId,
//       cost: cost,
//       "period.startDate": startDate,
//       "period.endDate": endDate,
//       "period.dayPeriod": dayPeriod,
//       "period.type": type,
//       // ✅ إضافة سجل التعديلات
//       $push: modifications.length > 0
//         ? {
//             modificationHistory: {
//               modifiedBy,
//               modifiedAt: new Date(),
//               changes: modifications.join(" | "),
//             },
//           }
//         : {},
//     });

//     res.send("done");
//   } catch (error) {
//     logger.error(error.message);
//     res.status(500).send({ error: error.message });
//   }
// },

  deleteAdminReservation: async (req, res) => {
    try {
      let { id } = req.params;
      await Reservation.findByIdAndUpdate(id, {
        status: "canceled",
        cancelRequest: false,
      })
        .then(() => res.send())
        .catch((error) => {
          logger.error(error.message);
          res.status(500).send({ error: error.message });
        });
    } catch (error) {
      logger.error(error.message);
      res.status(500).send({ error: error.message });
    }
  },

// في أعلى ملف reservationController.js، تأكد من إضافة هذا السطر


// ...

/// في ملف reservationController.js

confirmOrder: async (req, res, nxt) => {
  try {
    const { _id, confirmRequest } = req.body;

    if (!confirmRequest) {
      return res.status(400).json({ error: "❌ لا يمكن تأكيد الحجز بدون إجراء صريح." });
    }

    // ================================================================
    // ✨✨ هذا هو السطر الذي تم إصلاحه ✨✨
    // ================================================================
    const reservation = await Reservation.findById(_id).populate('client.id');
    console.log("DEBUG: بيانات الحجز بعد عملية populate:", JSON.stringify(reservation, null, 2));

    if (!reservation) {
      return res.status(404).json({ error: "❌ الحجز غير موجود." });
    }

    const paidAmount = reservation.payment?.paidAmount || 0;
    if (paidAmount <= 0) {
      return res.status(400).json({ error: "❌ يجب دفع مبلغ قبل تأكيد الحجز." });
    }

    // 1. تحديث حالة الحجز
    await Reservation.findByIdAndUpdate(_id, { status: "confirmed" });

    // 2. إرسال رسالة الواتساب عبر البوت
    try {
      // الآن، reservation.client.id.phone سيحتوي على الرقم الصحيح
      const clientPhoneNumber = reservation.client.id.phone.replace('+', '');
      
      const whatsappPayload = {
        phone: clientPhoneNumber,
                 message: `مجموعة سدرة فاطمة

مضيفنا العزيز: ${existingReservation.client.name}
نبارك لك حجزك المؤكد
يوم ${existingReservation.period.startDate}

--------------
تفاصيل الحجز
--------------
${existingReservation.entity.name}

من تاريخ: ${existingReservation.period.startDate}
وحتى تاريخ: ${existingReservation.period.endDate}
دخول: ${existingReservation.period.checkIn.name} (${existingReservation.period.checkIn.time})
خروج: ${existingReservation.period.checkOut.name} (${existingReservation.period.checkOut.time})

الاجمالي: ${existingReservation.cost.toFixed(2)}
اجمالي الخدمات: 0.00
الخصم: ${existingReservation.discountAmount.toFixed(2)}
المدفوع: ${totalPaid.toFixed(2)}
المتبقي: ${remainingAmount.toFixed(2)}

نتمنى لك إقامة سعيدة!

--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991

اللوكيشن: https://maps.app.goo.gl/bUvZp5cDYiSevgSo6`
          };

 axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload);
      
      console.log('✅ تم إرسال طلب رسالة التأكيد إلى بوت الواتساب.');

    } catch (error) {
      console.error('❌ فشل إرسال الطلب إلى بوت الواتساب:', error.message);
    }

    // 3. تمرير التحكم للدالة التالية
    req.type = "confirmed";
    nxt();

  } catch (error) {
    console.error("Error in confirmOrder:", error);
    res.status(500).send(error.message);
  }
},

   postConfirmedReservations: async (req, res, nxt) => {
     try {
       logger.info(req.body);
       let {
         clientName,
         phone,
         entityId,
         entityName,
         startDate,
         endDate,
         cost,
         originalCost,
         dayPeriod,
         tax,
         paid,
         contractNumber,
       } = req.body;
       let newOne = new Reservation({
         client: { name: clientName, phone },
         entity: { name: entityName, id: entityId },
         finance: { cost, paid, tax, remain: paid - tax },
         period: { startDate, endDate, dayPeriod },
         status: "confirmed",
         contractNumber,
         date: dateToday(),
         employee: req.user.name,
         contractNumber: await Reservation.generateContractID(),
       });
       await newOne
         .save()
         .then(() => {
           req.type = "confirmed";
           nxt();
         })
         .catch((err) => {
           throw new Error(err.message);
         });
     } catch (error) {
       logger.error(error.message);
       res.status(400).send({ error: error.message });
     }
   },
  getConfirmedReservatioms: async (req, res) => {
    try {
      let reservations = await Reservation.find({ status: "Confirmed" });
      res.send(reservations);
    } catch (error) {
      logger.error(error.message);
      res.status(400).send({ error: error.message });
    }
  },

// داله تعديل علي الحجز 
// في ملف reservationController.js

updateAdvancedReservation: async (req, res) => {
  try {
    // 1. استلام وتحويل البيانات من الواجهة
    const { _id, clientName, clientPhone, entityId, discountPercentage, modifiedBy, additionalCharge } = req.body;

    if (!_id || !modifiedBy) {
      return res.status(400).send({ error: "بيانات الحجز أو الموظف غير موجودة" });
    }
    
    const numericDiscountPercentage = parseFloat(discountPercentage || 0);
    const numericAdditionalCharge = parseFloat(additionalCharge || 0);

    // 2. جلب البيانات الأصلية
 const originalReservation = await Reservation.findById(_id).populate('client.id');
     if (!originalReservation) {
      return res.status(404).send({ error: "الحجز غير موجود" });
    }
        // --- ✨ تعديل رقم 1: تحديد النوع والجهة معًا ---
        const finalEntityId = entityId || originalReservation.entity.id.toString();

        let entity;
    let newType;
    if ((entity = await Hall.findById(finalEntityId))) {
        newType = "hall";
    } else if ((entity = await Chalet.findById(finalEntityId))) {
        newType = "chalet";
    } else if ((entity = await Resort.findById(finalEntityId))) {
        newType = "resort";
    }
    if (!entity) return res.status(404).send({ error: "Entity not found" });
  
    // 3. ✅ إعادة حساب السعر بالكامل (باستخدام المنطق الدقيق)
    let newOriginalCost = 0;
    const start = new Date(originalReservation.period.startDate);
    const end = new Date(originalReservation.period.endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const checkInSelection = originalReservation.period.checkIn.name;
    const checkOutSelection = originalReservation.period.checkOut.name;
    const isSingleDayBooking = start.getTime() === end.getTime();

    if (isSingleDayBooking) {
      if (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
        newOriginalCost = entity.price.wholeDay;
      } else if (checkInSelection === 'صباحية' && checkOutSelection === 'صباحية') {
        newOriginalCost = entity.price.morning;
      } else if (checkInSelection === 'مسائية' && checkOutSelection === 'مسائية') {
        newOriginalCost = entity.price.night;
      } else {
        newOriginalCost = entity.price.wholeDay;
      }
    } else {
      let currentDate = new Date(start);
      while (currentDate <= end) {
        let dayCost = 0;
        if (currentDate.getTime() === start.getTime()) {
          dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
        } else if (currentDate.getTime() === end.getTime()) {
          dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
        } else {
          dayCost = entity.price.wholeDay;
        }
        newOriginalCost += dayCost;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    // نهاية منطق الحساب الدقيق

    const newDiscountAmount = newOriginalCost * (numericDiscountPercentage / 100);
    const finalCost = (newOriginalCost - newDiscountAmount) + numericAdditionalCharge;

    // 4. التحقق من التعارض
    if (finalEntityId !== originalReservation.entity.id.toString()) {
      const conflictingReservation = await Reservation.findOne({
        "entity.id": finalEntityId,
        _id: { $ne: _id },
        "period.startDate": { $lte: originalReservation.period.endDate },
        "period.endDate": { $gte: originalReservation.period.startDate },
      });
      if (conflictingReservation) {
        return res.status(409).send({ error: "هذه القاعة محجوزة بالفعل في الفترة المحددة." });
      }
    }

    // 5. بناء سجل التعديلات
    const changes = [];
    if (newType !== originalReservation.type) changes.push(`تغيير النوع من '${originalReservation.type}' إلى '${newType}'`);
    if (clientName && originalReservation.client.name !== clientName) changes.push(`تغيير اسم العميل إلى '${clientName}'`);
    if (clientPhone && originalReservation.client.phone !== clientPhone) changes.push(`تغيير الهاتف إلى '${clientPhone}'`);
    if (finalEntityId !== originalReservation.entity.id.toString()) changes.push(`تغيير الجهة من '${originalReservation.entity.name}' إلى '${entity.name}'`);
    if (originalReservation.discountPercentage !== numericDiscountPercentage) changes.push(`تغيير نسبة الخصم إلى ${numericDiscountPercentage}%`);
    if (originalReservation.additionalCharge !== numericAdditionalCharge) changes.push(`تعديل المبلغ الإضافي إلى ${numericAdditionalCharge}`);
    if (originalReservation.cost !== finalCost) changes.push(`تغيير السعر الإجمالي من ${originalReservation.cost} إلى ${finalCost}`);

  if (changes.length === 0) {
      return res.status(200).send({ success: true, message: "لم يتم إجراء أي تغييرات." });
    }
    
    // ================================================================
    // ✨✨ تم تحديث منطق الحسابات هنا ✨✨
    // ================================================================
  // 1. جلب كل الدفعات السابقة والخدمات
    const allPayments = await Payments.find({ reservation: _id });
    const services = await ReservationServices.find({ reservationId: _id });
    
    // 2. حساب إجمالي المدفوعات وتكلفة الخدمات
    const totalPaidAmount = allPayments.reduce((sum, payment) => sum + (payment.paid || 0), 0);
  const totalServicesCost = services.reduce((sum, service) => sum + (service.price || 0), 0);
      // 3. حساب المبلغ الإجمالي الصحيح (تكلفة الحجز + تكلفة الخدمات)
// السطر الصحيح
const finalTotalCost = finalCost + totalServicesCost;
    // 4. حساب المبلغ المتبقي الصحيح والنهائي
    const newRemainingAmount = finalTotalCost - totalPaidAmount;
    
    // 6. بناء كائن التحديث النهائي
    const updateData = {
       type: newType,
      "client.name": clientName,
      "client.phone": clientPhone,
      "entity.id": finalEntityId,
      "entity.name": entity.name,
      originalCost: newOriginalCost,
      cost: finalCost,
      discountPercentage: numericDiscountPercentage,
      discountAmount: newDiscountAmount,
      additionalCharge: numericAdditionalCharge,
      "payment.paidAmount": totalPaidAmount, // تحديث إجمالي المدفوع
       "payment.remainingAmount": newRemainingAmount,
    };
    
    const updatePayload = { $set: updateData };

    if (changes.length > 0) {
      updatePayload.$push = {
        modificationHistory: { modifiedBy, modifiedAt: new Date(), changes: changes.join(" | ") },
      };
    } else {
        return res.status(200).send({ success: true, message: "لم يتم إجراء أي تغييرات." });
    }

    // ================================================================
    // ✨✨ الخطوة 2: إضافة منطق إرسال رسالة الواتساب هنا ✨✨
    // ================================================================
    try {
      if (originalReservation.client && originalReservation.client.id && originalReservation.client.id.phone) {
        const clientPhoneNumber = originalReservation.client.id.phone.replace('+', '');
        
        // تجهيز نص التعديلات للرسالة
        const changesText = changes.join('\n- ');

     const messageText = `مجموعة سدرة فاطمة

مضيفنا العزيز: ${originalReservation.client.name}
تم تعديل حجزك رقم ${originalReservation.contractNumber} بنجاح.

التعديلات التي تمت:
- ${changesText}

---
الحالة المالية الجديدة:
- مبلغ الحجز الجديد: ${finalCost.toFixed(2)}
- إجمالي الخدمات: ${totalServicesCost.toFixed(2)}
- إجمالي المدفوع: ${totalPaidAmount.toFixed(2)}
- المبلغ المتبقي الجديد: ${newRemainingAmount.toFixed(2)}

إذا كانت لديك أي استفسارات، يرجى التواصل معنا.
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991`;
        const whatsappPayload = {
          phone: clientPhoneNumber,
          message: messageText
        };

 axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload);
        console.log('✅ تم إرسال إشعار تعديل الحجز عبر الواتساب.');
      } else {
        console.error('❌ فشل إرسال واتساب التعديل: بيانات العميل أو رقم الهاتف غير موجودة.');
      }
    } catch (error) {
      console.error('❌ فشل إرسال طلب إشعار التعديل إلى بوت الواتساب:', error.message);
    }
    // 7. تنفيذ التحديث
    await Reservation.findByIdAndUpdate(_id, updatePayload, { new: true, runValidators: true });
    res.status(200).send({ success: true, message: "تم تعديل الحجز بنجاح" });

  } catch (error) {
    console.error("🔥 Error in updateAdvancedReservation:", error);
    res.status(500).send({ error: "حدث خطأ في الخادم" });
  }
},
// داله تاخيرالحجز 
postponeReservationStart : async (req, res) => {
  // أضف هذا الكائن داخل الدالة
  try {
    // 1. استلام البيانات بالأسماء الجديدة
    const { _id, newStartDate, newCheckInName, newCheckInTime, modifiedBy } = req.body;

    if (!_id || !newStartDate || !newCheckInName || !modifiedBy) {
      return res.status(400).send({ error: "البيانات المطلوبة غير كاملة" });
    }
const periodDetails = {
  'صباحية': {
    checkInTime: '08:00',
    checkOutTime: '15:00',
    checkOutName: 'صباحية',
    dayPeriod: 'فترة صباحية'
  },
  'مسائية': {
    checkInTime: '16:00',
    checkOutTime: '23:00',
    checkOutName: 'مسائية',
    dayPeriod: 'فترة مسائية'
  },
  // يمكنك إضافة فترة "يوم كامل" هنا إذا أردت التعامل معها
  'كامل اليوم': {
    checkInTime: '09:00',
    checkOutTime: '23:00',
    checkInName: 'صباحية', // لأن اليوم الكامل يبدأ صباحًا
    checkOutName: 'مسائية',
    dayPeriod: 'كامل اليوم'
  }
};

// احصل على التفاصيل الكاملة للفترة الجديدة المطلوبة
const newPeriodInfo = periodDetails[newCheckInName];
if (!newPeriodInfo) {
  return res.status(400).send({ error: "اسم الفترة الجديد غير صالح" });
}
      const reservation = await Reservation.findById(_id).populate('client.id');

    if (!reservation) {
      return res.status(404).send({ error: "الحجز غير موجود" });
    }

    // 2. حساب مدة الحجز وتاريخ النهاية الجديد
    const originalStartDate = new Date(reservation.period.startDate);
    const originalEndDate = new Date(reservation.period.endDate);
    const durationMs = originalEndDate.getTime() - originalStartDate.getTime();

    const newStartDateObj = new Date(newStartDate);
    const newEndDateObj = new Date(newStartDateObj.getTime() + durationMs);

    const finalNewStartDate = newStartDateObj.toISOString().split('T')[0];
    const finalNewEndDate = newEndDateObj.toISOString().split('T')[0];

    // 3. ✅ إعادة حساب التكلفة الإجمالية بالكامل باستخدام المنطق الدقيق
    const entity = (await Hall.findById(reservation.entity.id)) || (await Chalet.findById(reservation.entity.id)) || (await Resort.findById(reservation.entity.id));
    if (!entity) return res.status(404).send({ error: "Entity not found" });

    let newTotalCost = 0;
    const start = newStartDateObj; // نستخدم التواريخ الجديدة للحساب
    const end = newEndDateObj;
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const isSingleDayBooking = start.getTime() === end.getTime();

    if (isSingleDayBooking) {
      if (newCheckInName === 'صباحية' && reservation.period.checkOut.name === 'مسائية') {
        newTotalCost = entity.price.wholeDay;
      } else if (newCheckInName === 'صباحية' && reservation.period.checkOut.name === 'صباحية') {
        newTotalCost = entity.price.morning;
      } else if (newCheckInName === 'مسائية' && reservation.period.checkOut.name === 'مسائية') {
        newTotalCost = entity.price.night;
      } else {
        newTotalCost = entity.price.wholeDay;
      }
    } else {
      let currentDate = new Date(start);
      while (currentDate <= end) {
        let dayCost = 0;
        if (currentDate.getTime() === start.getTime()) {
          dayCost = (newCheckInName === 'صباحية') ? entity.price.wholeDay : entity.price.night;
        } else if (currentDate.getTime() === end.getTime()) {
          dayCost = (reservation.period.checkOut.name === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
        } else {
          dayCost = entity.price.wholeDay;
        }
        newTotalCost += dayCost;
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    // ❗️❗️ملاحظة: هنا يجب لصق منطق حساب السعر الدقيق الذي تستخدمه عند إنشاء حجز جديد
    // (من دالة postAdminReservation) بناءً على التواريخ والفترات.
    // كمثال مبسط:
    // const dayCount = (newEndDateObj - newStartDateObj) / (1000 * 60 * 60 * 24);
    // newTotalCost = dayCount * entity.price.wholeDay; // هذا مجرد مثال، استخدم منطقك الدقيق
    
    // 4. التحقق من وجود تعارض في الفترة الجديدة
    const conflictingReservation = await Reservation.findOne({
      "entity.id": reservation.entity.id,
      _id: { $ne: _id },
      "period.startDate": { $lte: finalNewEndDate },
      "period.endDate": { $gte: finalNewStartDate },
    });

    if (conflictingReservation) {
      return res.status(409).send({ error: "لا يمكن تأخير الحجز لهذه الفترة لوجود تعارض." });
    }

   
    // 5. بناء سجل تعديلات ذكي
    const changes = [];
    const costDifference = newTotalCost - reservation.cost;

    if (reservation.period.startDate !== finalNewStartDate) {
      changes.push(`تم تأخير تاريخ البدء إلى ${finalNewStartDate}`);
    }
    if (reservation.period.checkIn.name !== newCheckInName) {
      changes.push(`تم تغيير فترة البدء إلى '${newCheckInName}'`);
    }
    if (costDifference !== 0) {
      const Canceled_Reservation = costDifference > 0 ? "زيادة" : "نقصان";
      changes.push(`تغير السعر بمقدار ${Math.abs(costDifference).toFixed(2)} ريال (${Canceled_Reservation})`);
    }

    // 6. تنفيذ التحديث
   // استبدل كتلة التحديث بالكامل بهذه النسخة
if (changes.length > 0) {
  const newRemainingAmount = newTotalCost - reservation.payment.paidAmount;

  await Reservation.findByIdAndUpdate(_id, {
    $set: {
      "period.startDate": finalNewStartDate,
      "period.endDate": finalNewEndDate,
      "cost": newTotalCost,
      "payment.remainingAmount": newRemainingAmount, // ✅ تحديث المبلغ المتبقي

      // --- تحديث كافة تفاصيل الفترة تلقائيًا ---
      "period.dayPeriod": newPeriodInfo.dayPeriod,           // ✅ تحديث الوصف العام
      "period.checkIn.name": newCheckInName,                // اسم الدخول الجديد
      "period.checkIn.time": newCheckInTime || newPeriodInfo.checkInTime, // ✅ استخدام الوقت الجديد أو الافتراضي للفترة
      "period.checkOut.name": newPeriodInfo.checkOutName,       // ✅ تحديث اسم الخروج
      "period.checkOut.time": newPeriodInfo.checkOutTime,       // ✅ تحديث وقت الخروج
    },
    $push: {
      modificationHistory: { modifiedBy, modifiedAt: new Date(), changes: changes.join(" | ") },
    },
  });
}else {
      return res.status(200).send({ success: true, message: "لم يتم إجراء أي تغييرات." });
    }

    res.status(200).send({ success: true, message: "تم تأخير الحجز بنجاح" });
  // ✨ 7. إرسال رسالة الواتساب في الخلفية
    try {
      if (reservation.client && reservation.client.id && reservation.client.id.phone) {
        const clientPhoneNumber = reservation.client.id.phone.replace('+', '');
         
        
        const newCheckInDetails = `${getDayName(finalNewStartDate)} - ${newCheckInName} (${formatTime12Hour(newCheckInTime || newPeriodInfo.checkInTime)})`;
        const newCheckOutDetails = `${getDayName(finalNewEndDate)} - ${newPeriodInfo.checkOutName} (${formatTime12Hour(newPeriodInfo.checkOutTime)})`;
        
        const changesText = changes.join('\n- ');
        const messageText = `مجموعة سدرة فاطمة

مضيفنا العزيز: ${reservation.client.name}
تم تأخير حجزك رقم ${reservation.contractNumber} .

التفاصيل الجديدة:

تاريخ الدخول: ${finalNewStartDate} (${newCheckInDetails})
تاريخ الخروج: ${finalNewEndDate} (${newCheckOutDetails})

إذا كانت لديك أي استفسارات، يرجى التواصل معنا.
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991`;
        const whatsappPayload = { phone: clientPhoneNumber, message: messageText };
         axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload)

          .then(() => console.log('✅ تم إرسال إشعار تأخير الحجز عبر الواتساب.'))
          .catch(err => console.error('❌ فشل إرسال إشعار تأخير الحجز:', err.message));
      }
    } catch (error) {
      console.error('❌ خطأ أثناء محاولة إرسال إشعار التأخير:', error.message);
    }

  } catch (error) {
    console.error("🔥 Error in postponeReservationStart:", error);
    res.status(500).send({ error: "حدث خطأ في الخادم" });
  }
},


// مخصصة لتمديد الحجز

extendReservation: async (req, res) => {
  try {
    // 1. استلام البيانات
    const { _id, newEndDate, newCheckOutName, newCheckOutTime, modifiedBy } = req.body;

    if (!_id || !newEndDate || !newCheckOutName || !modifiedBy) {
      return res.status(400).send({ error: "البيانات المطلوبة غير كاملة" });
    }

    const reservation = await Reservation.findById(_id).populate('client.id');
    if (!reservation) return res.status(404).send({ error: "الحجز غير موجود" });

    // ✅ 2. التحقق المنطقي من تاريخ التمديد
    const originalEndDate = new Date(reservation.period.endDate);
    const newEndDateObj = new Date(newEndDate);

    // يمنع فقط إذا كان التاريخ الجديد قبل التاريخ الحالي
    if (newEndDateObj < originalEndDate) {
      return res.status(400).send({ error: "تاريخ التمديد لا يمكن أن يكون قبل تاريخ النهاية الحالي." });
    }

    // يمنع التمديد لنفس اليوم إذا كانت الفترة الحالية مسائية بالفعل
    if (newEndDateObj.getTime() === originalEndDate.getTime() && reservation.period.checkOut.name === 'مسائية') {
        return res.status(400).send({ error: "لا يمكن تمديد حجز الفترة المسائية في نفس اليوم." });
    }

    // ✅ 3. التحقق الصحيح من وجود تعارض
    const conflictingReservation = await Reservation.findOne({
      "entity.id": reservation.entity.id,
      _id: { $ne: _id },
      "period.startDate": { $lte: newEndDate },
      "period.endDate": { $gte: reservation.period.endDate }, // تحقق من النهاية القديمة حتى النهاية الجديدة
    });

    if (conflictingReservation) {
      return res.status(409).send({ error: "لا يمكن تمديد الحجز لهذه الفترة لوجود تعارض." });
    }

    // ✅ 4. إعادة حساب التكلفة الإجمالية بشكل صحيح
    const entity = (await Hall.findById(reservation.entity.id)) || (await Chalet.findById(reservation.entity.id)) || (await Resort.findById(reservation.entity.id));
    if (!entity) return res.status(404).send({ error: "Entity not found" });

    const start = new Date(reservation.period.startDate);
    const end = newEndDateObj;
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    const checkInSelection = reservation.period.checkIn.name; // فترة الدخول الأصلية ثابتة
    const checkOutSelection = newCheckOutName; // فترة الخروج الجديدة

    let newTotalCost = 0;
    // إذا كان التمديد لنفس اليوم (من صباحي إلى يوم كامل)
    if (start.getTime() === end.getTime() && checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
        newTotalCost = entity.price.wholeDay;
    } else { // إذا كان التمديد لأيام متعددة
        let currentDate = new Date(start);
        while (currentDate <= end) {
            let dayCost = 0;
            if (currentDate.getTime() === start.getTime()) {
                dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
            } else if (currentDate.getTime() === end.getTime()) {
                dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
            } else {
                dayCost = entity.price.wholeDay;
            }
            newTotalCost += dayCost;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // ✅ 5. بناء سجل التعديلات وتحديث الحجز بكل الحقول المطلوبة
    const additionalCost = newTotalCost - reservation.cost;
    const changes = `تم تمديد الحجز إلى ${newEndDate} (فترة ${newCheckOutName}). التكلفة الإضافية: ${additionalCost.toFixed(2)} ريال`;

    // تحديد الوصف العام الجديد للفترة
    const newDayPeriod = (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') ? 'كامل اليوم' : `ممتد حتى ${newCheckOutName}`;
    const newRemainingAmount = reservation.payment.remainingAmount + additionalCost;

    await Reservation.findByIdAndUpdate(_id, {
      $set: {
        "period.endDate": newEndDate,
        "period.dayPeriod": newDayPeriod, // تحديث الوصف العام
        "period.checkOut.name": newCheckOutName,
        "period.checkOut.time": newCheckOutTime, // يجب إرسال الوقت الجديد المناسب للفترة
        "cost": newTotalCost,
        "payment.remainingAmount": newRemainingAmount, // تحديث المبلغ المتبقي
      },
      $push: {
        modificationHistory: { modifiedBy, modifiedAt: new Date(), changes },
      },
    });

    res.status(200).send({ success: true, message: "تم تمديد الحجز بنجاح" });
  // ✨ 7. إرسال رسالة الواتساب في الخلفية
    try {
      if (reservation.client && reservation.client.id && reservation.client.id.phone) {
        const clientPhoneNumber = reservation.client.id.phone.replace('+', '');
         
    const originalCheckInDetails = `${getDayName(reservation.period.startDate)} - ${reservation.period.checkIn.name} (${formatTime12Hour(reservation.period.checkIn.time)})`;
        const newCheckOutDetails = `${getDayName(newEndDate)} - ${newCheckOutName} (${formatTime12Hour(newCheckOutTime)})`;

        const messageText = `مجموعة سدرة فاطمة

مضيفنا العزيز: ${reservation.client.name}

تم تمديد حجزك بنجاح.
رقم العقد: ${reservation.contractNumber}

التفاصيل الجديدة
--------------
تاريخ الدخول: ${reservation.period.startDate} (${originalCheckInDetails})
تاريخ الخروج: ${newEndDate} (${newCheckOutDetails})

الحالة المالية الجديدة:
- المبلغ الإجمالي الجديد: ${newTotalCost.toFixed(2)}
- المبلغ المتبقي الجديد: ${newRemainingAmount.toFixed(2)}


إذا كانت لديك أي استفسارات، يرجى التواصل معنا.
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991`;
        const whatsappPayload = { phone: clientPhoneNumber, message: messageText };
        axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload)

          .then(() => console.log('✅ تم إرسال إشعار تمديد الحجز عبر الواتساب.'))
          .catch(err => console.error('❌ فشل إرسال إشعار تمديد الحجز:', err.message));
      }
    } catch (error) {
      console.error('❌ خطأ أثناء محاولة إرسال إشعار التمديد:', error.message);
    }

  } catch (error) {
    console.error("🔥 Error in extendReservation:", error);
    res.status(500).send({ error: "حدث خطأ في الخادم" });
  }
},


  updateReservationDiscount: async (req, res) => {
    try {
      const { reservationId, discountPercentage } = req.body;

      if (!reservationId || !discountPercentage) {
        return res
          .status(400)
          .send({ error: "يجب إدخال معرف الحجز ونسبة الخصم" });
      }

      if (discountPercentage < 0 || discountPercentage > 100) {
        return res
          .status(400)
          .send({ error: "نسبة الخصم يجب أن تكون بين 0 و 100" });
      }

      // جلب الحجز من قاعدة البيانات
      let reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).send({ error: "الحجز غير موجود" });
      }

      // حساب الخصم وتحديث التكلفة
      const discountAmount = (reservation.cost * discountPercentage) / 100;
      const newCost = reservation.cost - discountAmount;

      // تحديث قيمة الحجز
      reservation.cost = newCost;
      reservation.payment.remainingAmount = Math.max(
        reservation.payment.remainingAmount - discountAmount,
        0
      );

      await reservation.save();

      res.status(200).send({
        message: `تم تطبيق خصم ${discountPercentage}% بنجاح`,
        newCost,
        discountAmount,
      });
    } catch (error) {
      console.error("❌ خطأ أثناء تطبيق الخصم:", error.message);
      res.status(500).send({ error: "خطأ داخلي في السيرفر" });
    }
  },

  updateInsurance: async (req, res, next) => {
    try {
      next();
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: error.message });
    }
  },
  retriveInsurance: async (req, res) => {
    try {
      let { id } = req.body;
      await Reservation.findByIdAndUpdate(id, { restored: true })
        .then(() => res.send())
        .catch(() => {
          console.log(error);
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: error.message });
    }
  },
  insuranceFinance: async (req, res) => {
    try {
      let { _id, damage, insurance } = req.body;
      await Insurence.findByIdAndUpdate(_id, {
        "finance.damage": damage,
        "finance.insurance": insurance,
        "finance.remain": insurance - damage,
      })
        .then(() => res.send())
        .catch(() => {
          console.log(error);
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: error.message });
    }
  },
  deferreReservation: async (req, res) => {
    try {
      let { _id, period } = req.body;
      period.type = period.startDate == period.endDate ? "dayPeriod" : "days";
      let reservation = await Reservation.findById(_id);
      let oldDefarredDate =
        reservation?.period?.startDate + " / " + reservation?.period?.endDate;
      await Reservation.findByIdAndUpdate(_id, {
        period,
        deferred: true,
        oldDefarredDate,
      })
        .then(() => res.send())
        .catch((error) => {
          logger.error(error.message);
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      logger.error(error.message);
      res.status(400).send({ error: error.message });
    }
  },
getReservationByType: async (req, res) => {
  try {
    const types = ["hall", "chalet", "resort"];

    // --- حساب الإحصائيات القديمة (عدد الحجوزات المؤكدة لكل نوع) ---
    const confirmedCountsPromise = Reservation.aggregate([
      { $match: { type: { $in: types }, status: "confirmed" } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    
    // --- حساب الإحصائيات الأخرى ---
    const unconfirmedCountPromise = Reservation.countDocuments({ status: "unConfirmed" });
    const unpaidClientsPromise = Reservation.find({ status: { $ne: "canceled" } }).lean(); // سنقوم بحساب العدد لاحقاً

    // ✅✅✅  بداية الجزء الجديد: حساب حجوزات اليوم  ✅✅✅

    // 1. تحديد تاريخ اليوم (بدايته ونهايته)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. إنشاء الاستعلامات لحساب الأعداد الجديدة
    const hallsStartingTodayPromise = Reservation.countDocuments({
        type: 'hall',
        status: 'confirmed',
        'period.startDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const hallsEndingTodayPromise = Reservation.countDocuments({
        type: 'hall',
        status: 'confirmed',
        'period.endDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const chaletsStartingTodayPromise = Reservation.countDocuments({
        type: 'chalet',
        status: 'confirmed',
        'period.startDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });
    const chaletsEndingTodayPromise = Reservation.countDocuments({
        type: 'chalet',
        status: 'confirmed',
        'period.endDate': { $gte: todayStart.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] }
    });

    // --- تنفيذ كل الاستعلامات معًا لتحسين الأداء ---
    const [
        reservationCounts,
        unconfirmedReservationsCount,
        reservationsForUnpaid,
        hallsStartingToday,
        hallsEndingToday,
        chaletsStartingToday,
        chaletsEndingToday
    ] = await Promise.all([
        confirmedCountsPromise,
        unconfirmedCountPromise,
        unpaidClientsPromise,
        hallsStartingTodayPromise,
        hallsEndingTodayPromise,
        chaletsStartingTodayPromise,
        chaletsEndingTodayPromise
    ]);
    
    // --- معالجة النتائج ---
    // (نفس الكود السابق لمعالجة reservationCounts و unpaidClients)
    const countsMap = types.reduce((acc, type) => ({...acc, [type]: 0}), {});
    reservationCounts.forEach(item => { countsMap[item._id] = item.count; });
    const finalReservationCounts = Object.entries(countsMap).map(([type, count]) => ({ type, count }));

    const unpaidClients = new Set();
    for (const reservation of reservationsForUnpaid) {
        const payments = await ReservationPayments.find({ reservation: reservation._id }).lean();
        const totalPaid = payments.reduce((sum, payment) => sum + payment.paid, 0);
        if (totalPaid < reservation.cost) unpaidClients.add(reservation.client.id);
    }
    
    // --- إرسال الاستجابة النهائية مع كل البيانات الجديدة ---
    res.send({
      reservationCounts: finalReservationCounts,
      unpaidClientsCount: unpaidClients.size,
      unconfirmedReservationsCount,
      // ✅✅✅  إضافة القيم الجديدة هنا  ✅✅✅
      hallsStartingToday,
      hallsEndingToday,
      chaletsStartingToday,
      chaletsEndingToday
    });

  } catch (error) {
    logger.error(error.message);
    res.status(500).send({ error: error.message });
  }
},
  completeReservation: async (req, res) => {
    try {
       const reservationId = req.params.id || req.body._id;

      console.log("🔍 Received Body:", req.body);
      console.log("🔍 Extracted ID:", reservationId);
      logger.info(`🔹 Received Reservation ID: ${reservationId}`);

      if (!reservationId) {
        console.error("❌ Error: No reservation ID provided!");
        logger.error("❌ Error: No reservation ID provided!");
        return res.status(400).send({ error: "Reservation ID is required" });
      }

      const existingReservation = await Reservation.findById(reservationId);
      if (!existingReservation) {
        console.error(
          `❌ Error: No reservation found with ID ${reservationId}`
        );
        logger.error(`❌ Error: No reservation found with ID ${reservationId}`);
        return res.status(404).send({ error: "Reservation not found" });
      }

      console.log("🔍 Before Update (Current Data):", existingReservation);

      // *** تحديث الحجز ***
      const result = await Reservation.findByIdAndUpdate(
        new mongoose.Types.ObjectId(reservationId),
        { $set: { completed: true ,  status: 'completed'} }, // 🛑 استخدام `$set` للتأكد إن MongoDB فعلاً تغير القيمة!
        { new: true, runValidators: true }
      );

      console.log("✅ After Update (Updated Data):", result);
      logger.info(
        "✅ Reservation updated successfully:",
        JSON.stringify(result)
      );

      res.send(result);
    } catch (error) {
      console.error("❌ Error in completeReservation:", error);
      logger.error("❌ completeReservation Error: " + error.message);
      res.status(500).send({ error: error.message });
    }
  },
  rateReservation: async (req, res) => {
    try {
      let data = req.body;
      await Reservation.findByIdAndUpdate(data._id, { rated: true });
      let rate = new Rating({
        clientName: data.client.name,
        entityName: data.entity.name,
        date: dateToday(),
        rate: data.rate,
        note: data.note,
      });
      await rate
        .save()
        .then(() => res.send())
        .catch((error) => {
          logger.error(error.message);
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      logger.error(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  postEntityRate: async (req, res, next) => {
    try {
      const { type, rate } = req.body;
      let model;
      switch (type) {
        case "hall":
          model = Hall;
          break;
        case "chalet":
          model = Chalet;
          break;
        case "resort":
          model = Resort;
          break;
        default:
          throw new Error("Invalid type");
      }
      const entity = await model.findById(req.body.entity.id);
      if (!entity) throw new Error("Entity not found");
      entity.rate.push(rate);
      await entity.save();
      next();
    } catch (error) {
      logger.error(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  getRates: async (req, res) => {
    try {
      let rates = await Rating.find({});
      res.send(rates);
    } catch (error) {
      logger.error(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  postNotification: async (req, res) => {
    try {
      logger.info(req.type);
      let data = new Notification({ type: req.type });
      await data
        .save()
        .then(() => res.send())
        .catch((error) => {
          logger.error(error.message);
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: error.message });
    }
  },
  getNotification: async (req, res) => {
    try {
      let data = await Notification.find({});
      res.send(data);
    } catch (error) {
      logger.error(error.message);
      res.status(400).send({ error: error.message });
    }
  },
  deleteNotifiaction: async (req, res) => {
    try {
      await Notification.findOneAndDelete({ type: req.body.type }).then(() =>
        res.send()
      );
    } catch (error) {
      logger.error(error.message);
      res.status(400).send({ error: error.message });
    }
  },
  addReservation: async (req, res) => {
    try {
      let newReservation = new Reservation({
        ...req.body,
        date: dateToday(),
        contractNumber: await Reservation.generateContractID(),
      });
      await newReservation.save();
      res.send(newReservation);
    } catch (error) {
      logger.error(error.message);
      res.status(400).send({ error: error.message });
    }
  },
 // ✅✅✅ قم باستبدال الدالة القديمة بهذه الدالة المصححة بالكامل ✅✅✅

   postAdminReservation: async (req, res) => {
        try {
           if (!req.user || !req.user._id) {
            return res.status(401).send({ error: "المستخدم غير مصادق عليه أو جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى." });
        }
            // ✅ التعديل هنا: استقبل الـ `period` object بالكامل
            const {
                clientId,
                clientName,
                phone,
                email,
                password,
                entityId,
                notes,
                paymentMethod,
                 bank, // <--- استقبال معرّف البنك
                paidAmount,
                discountAmount,
                period // <--- استقبل كائن الـ period مباشرةً من req.body
            } = req.body;

            // التأكد من وجود كائن period وبياناته الأساسية
            if (!period || !period.startDate || !period.endDate || !period.type || !period.checkIn || !period.checkOut) {
                return res.status(400).send({ error: "بيانات الفترة (period) غير كاملة في الطلب." });
            }

            // الآن، استخرج الحقول من الـ `period` object
            const { startDate, endDate, periodType, dayPeriod, checkIn, checkOut } = period;
            const checkInSelection = checkIn.name;
            const checkInPeriod = checkIn.time;
            const checkOutSelection = checkOut.name;
            const checkOutPeriod = checkOut.time;

            const objectId = new mongoose.Types.ObjectId(entityId);

            let entity;
            let type;

            if ((entity = await Hall.findById(objectId))) type = "hall";
            else if ((entity = await Chalet.findById(objectId))) type = "chalet";
            else if ((entity = await Resort.findById(objectId))) type = "resort"; // تأكد من استيراد Resort
            else return res.status(404).send({ error: "الكيان (Hall/Chalet/Resort) غير موجود." });

            // --- منطق العميل المحدث ---
            let finalClient;
            if (clientId) {
                finalClient = await Customer.findById(clientId);
                if (!finalClient) return res.status(404).send({ error: "العميل غير موجود بالمعرف المقدم." });
            } else {
                finalClient = await Customer.findOne({ phone });
                if (!finalClient) {
                    const newCustomer = new Customer({
                        name: clientName,
                        phone,
                        email,
                        password,
                        address,
                        nationality,
                        idNumber,
                        emailVerification: true
                    });
                    finalClient = await newCustomer.save();
                }
            }

            // --- حساب التكلفة الإجمالية (مع التصحيح) ---
            let totalCost = 0;
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(0, 0, 0, 0);
            const isSingleDayBooking = start.getTime() === end.getTime();

            if (isSingleDayBooking) {
                if (checkInSelection === 'صباحية' && checkOutSelection === 'مسائية') {
                    totalCost = entity.price.wholeDay;
                } else if (checkInSelection === 'صباحية' && checkOutSelection === 'صباحية') {
                    totalCost = entity.price.morning;
                } else if (checkInSelection === 'مسائية' && checkOutSelection === 'مسائية') {
                    totalCost = entity.price.night;
                } else {
                    totalCost = entity.price.wholeDay; // Fallback
                }
            } else {
                let currentDate = new Date(start);
                while (currentDate <= end) {
                    let dayCost = 0;
                    if (currentDate.getTime() === start.getTime()) {
                        dayCost = (checkInSelection === 'صباحية') ? entity.price.wholeDay : entity.price.night;
                    } else if (currentDate.getTime() === end.getTime()) {
                        dayCost = (checkOutSelection === 'صباحية') ? entity.price.morning : entity.price.wholeDay;
                    } else {
                        dayCost = entity.price.wholeDay;
                    }
                    totalCost += dayCost;
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            const originalCost = totalCost;
            const finalDiscountAmount = parseFloat(discountAmount || 0);

            if (finalDiscountAmount > 0) {
                totalCost -= finalDiscountAmount;
            }

            // --- إنشاء حجز واحد فقط (مع التأكد من الهيكل الصحيح) ---
            const contractNumber = await Reservation.generateContractID(type);
            const newReservation = new Reservation({
                type,
                client: {
                    id: finalClient._id,
                    name: finalClient.name,
                    phone: finalClient.phone,
                    address: finalClient.address,
                    nationality: finalClient.nationality,
                    idNumber: finalClient.idNumber
                },
                entity: { id: entityId, name: entity.name },
                originalCost: originalCost,
                cost: totalCost,
                discountAmount: finalDiscountAmount,
                period: period, // <--- استخدم الـ `period` object اللي تم استلامه مباشرةً
                status: "confirmed",
                date: new Date().toISOString(),
                notes,
                payment: {
                    method: paymentMethod,
                    paidAmount: parseFloat(paidAmount || 0),
                    remainingAmount: totalCost - parseFloat(paidAmount || 0),
                },
                contractNumber,
            });

            const savedReservation = await newReservation.save();

            // --- تسجيل دفعة أولية إذا وجدت ---
            const finalPaidAmount = parseFloat(paidAmount || 0);
            if (finalPaidAmount > 0) {
                const newPayment = new ReservationPayments({
                    paid: finalPaidAmount,
                    type: paymentMethod || "نقدي",
                     bank: bank,
                    reservation: savedReservation._id,
                  employee: req.user._id,
                  date: new Date().toISOString().split('T')[0],
                });
                await newPayment.save();
            }
  // 2. إرسال رسالة تأكيد للعميل عبر الواتساب

  
    try {
      if (finalClient && finalClient.phone) {
        const clientPhoneNumber = finalClient.phone.replace('+', '');
            const services = await ReservationServices.find({ reservationId: savedReservation._id });

        let totalServicesCost = services.reduce((sum, service) => sum + (service.price * service.number), 0);
        const periodName = savedReservation.period.type === 'days' ? 'لعدة أيام' : savedReservation.period.dayPeriod;
                // ✨ تم استخدام دالة تنسيق الوقت هنا
        const checkInDetails = `${getDayName(savedReservation.period.startDate)} - ${savedReservation.period.checkIn.name} (${formatTime12Hour(savedReservation.period.checkIn.time)})`;
        const checkOutDetails = `${getDayName(savedReservation.period.endDate)} - ${savedReservation.period.checkOut.name} (${formatTime12Hour(savedReservation.period.checkOut.time)})`;
        

const messageText = `مجموعة سدرة فاطمة
مضيفنا العزيز: ${savedReservation.client.name}
نبارك لك حجزك المؤكد
رقم العقد: ${savedReservation.contractNumber}
--------------
تفاصيل الحجز
--------------
المكان: ${savedReservation.entity.name}
نوع الفترة: ${periodName}
تاريخ الدخول: ${savedReservation.period.startDate} (${checkInDetails})
تاريخ الخروج: ${savedReservation.period.endDate} (${checkOutDetails})

--------------
التفاصيل المالية
--------------
مبلغ الحجز: ${savedReservation.cost.toFixed(2)}
اجمالي الخدمات: ${totalServicesCost.toFixed(2)}
الخصم: ${savedReservation.discountAmount.toFixed(2)}
طريقة الدفع: ${savedReservation.payment.method}
المدفوع: ${savedReservation.payment.paidAmount.toFixed(2)}
-------
المتبقي: ${savedReservation.payment.remainingAmount.toFixed(2)}

نتمنى لك إقامة سعيدة!
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991
اللوكيشن: https://maps.app.goo.gl/bUvZp5cDYiSevgSo6`;

        const whatsappPayload = { phone: clientPhoneNumber, message: messageText };
 axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload);
          console.log('✅ تم إرسال طلب رسالة واتساب بنجاح.');
    } else {
          console.error('❌ فشل إرسال الواتساب: بيانات العميل أو رقم الهاتف غير موجودة.');
        }
      } catch (error) {
        console.error('❌ فشل إرسال الطلب إلى بوت الواتساب:', error.message);
      }
            res.status(201).send({
                message: "Admin reservation created successfully.",
                reservation: savedReservation
            });

        } catch (error) {
            console.error("🔥 Error in postAdminReservation:", error.message);
            if (error.code === 11000) {
                return res.status(409).send({ error: "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل." });
            }
            res.status(500).send({ error: error.message });
        }
    },

  getNewReservations: async (req, res) => {
    try {
      const reservations = await Reservation.find({ status: "unConfirmed" })
        .sort({ date: -1 }) // ترتيب من الأحدث إلى الأقدم
        .lean(); // تسريع الاستعلام بإرجاع JSON خفيف

      res.status(200).send(reservations);
    } catch (error) {
      console.error("🔥 Error in getUnconfirmedReservations:", error.message);
      res.status(500).send({ error: error.message });
    }
  },

  cancelReservation: async (req, res) => {
    try {
      const { reservationId } = req.body;
      if (!reservationId) {
        return res
          .status(400)
          .send({ error: "يجب إرسال معرف الحجز (reservationId)" });
      }

      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).send({ error: "الحجز غير موجود" });
      }

      reservation.status = "canceled";
      await reservation.save();

      res.status(200).send({ message: "تم إلغاء الحجز بنجاح", reservation });
    } catch (error) {
      console.error("🔥 خطأ أثناء إلغاء الحجز:", error.message);
      res.status(500).send({ error: "خطأ داخلي في السيرفر" });
    }
  },

  getCanceledReservations: async (req, res) => {
    try {
      const canceledReservations = await Reservation.find({
        status: "canceled",
      })
        .sort({ date: -1 }) // ترتيب من الأحدث إلى الأقدم
        .lean(); // تحسين الأداء بإرجاع بيانات JSON خفيفة

      res.status(200).send(canceledReservations);
    } catch (error) {
      console.error("🔥 خطأ أثناء جلب الحجوزات الملغاة:", error.message);
      res.status(500).send({ error: "خطأ داخلي في السيرفر" });
    }
  },

  // في ملف controller الحجوزات

getUnpaidClients: async (req, res) => {
    try {
        const unpaidClientsData = await Reservation.aggregate([
            // المرحلة 1: فلترة الحجوزات غير الملغاة
            {
                $match: {
                    status: { $ne: "canceled" }
                }
            },
            // المرحلة 2: جلب الدفعات المرتبطة
            {
                $lookup: {
                    from: "reservation-payments", // تأكدنا من هذا الاسم سابقاً
                    let: { reservation_id: "$_id" },
                    pipeline: [ { $match: { $expr: { $eq: ["$reservation", "$$reservation_id"] } } } ],
                    as: "payments"
                }
            },
            // ✅✅✅  الإضافة الجديدة: جلب الخدمات المرتبطة  ✅✅✅
            {
                $lookup: {
                    from: "reservationservices",
                    let: { reservation_id: "$_id" },
                    pipeline: [ { $match: { $expr: { $eq: ["$reservationId", "$$reservation_id"] } } } ],
                    as: "services"
                }
            },
            // المرحلة 3: إضافة الحقول المحسوبة
            {
                $addFields: {
                    totalPaid: { $sum: "$payments.paid" },
                    totalServices: { $sum: "$services.price" } // ✅ حساب إجمالي الخدمات
                }
            },
            // ✅✅✅  التعديل الأهم: تصحيح معادلة المبلغ المتبقي  ✅✅✅
            {
                $addFields: {
                    remainingAmount: {
                        $subtract: [
                            { $add: [
                                { $subtract: [ { $ifNull: ['$cost', 0] }, { $ifNull: ['$discountAmount', 0] } ] },
                                { $ifNull: ['$totalServices', 0] }
                            ]},
                            { $ifNull: ['$totalPaid', 0] }
                        ]
                    }
                }
            },
            // المرحلة 4: فلترة الحجوزات التي لديها مبلغ متبقٍ فقط
            {
                $match: {
                    remainingAmount: { $gt: 0 }
                }
            },
            // المرحلة 5: إعادة هيكلة البيانات النهائية
            {
                $project: {
                    _id: 0, // إخفاء حقل _id إذا لم تكن بحاجته
                    reservationId: "$_id",
                    contractNumber: 1,
                    entityType: "$type",
                    entityName: "$entity.name",
                    clientName: "$client.name",
                    phone: "$client.phone",
                    period: 1,
                    totalCost: "$cost",
                    totalPaid: 1,
                    totalServices: 1, // ✅ إظهار إجمالي الخدمات
                    remainingAmount: 1
                }
            }
        ]);

        // الآن لا حاجة لتجميع الإحصائيات هنا، الفرونت-اند سيفعل ذلك
        res.status(200).send({
            unpaidClients: unpaidClientsData,
        });

    } catch (error) {
        console.error("🔥 Error in getUnpaidClients:", error.message);
        res.status(500).send({ error: error.message });
    }
},
// ... (داخل كائن reservation في ملف reservationController.js)

// في ملف reservationController.js

// addReservationPayment: async (req, res) => {
//     try {
//         const { reservationId, amount, type, bankName, notes } = req.body;

//         if (!reservationId || !amount || !type) {
//             return res.status(400).send({ error: "البيانات المطلوبة غير كاملة (reservationId, amount, type)." });
//         }

//         const paidAmount = parseFloat(amount);
//         if (isNaN(paidAmount) || paidAmount <= 0) {
//             return res.status(400).send({ error: "المبلغ المدفوع غير صحيح." });
//         }
        
//         const reservation = await Reservation.findById(reservationId);
//         if (!reservation) {
//             return res.status(404).send({ error: "الحجز غير موجود." });
//         }

//         // --- تعديل رقم 1: اسم الموظف ---
//         // سنستخدم قيمة افتراضية آمنة في حالة عدم وجود req.user
//         const employeeName = req.user ? req.user.name : "النظام";

//         const newPayment = new ReservationPayments({
//             paid: paidAmount,
//             type: type,
//             bank: bankName || null,
//             notes: notes || '',
//             reservation: reservationId,
//             employee: employeeName, // <-- استخدام المتغير الآمن
//             date: new Date().toISOString().split('T')[0],
//         });
//         await newPayment.save();

//         if (type === 'نقدي') {
//             const cashDeposit = new BankTransactions({
//                 bank: "الخزنة النقدية",
//                 amount: paidAmount,
//                 date: new Date().toISOString().split('T')[0],
//                 reciver: "النظام (إيداع من حجز)",
//                 donater: `عميل: ${reservation.client.name}`,
                
//                 // --- تعديل رقم 2: اسم الموظف هنا أيضًا ---
//                 employee: employeeName, // <-- استخدام نفس المتغير الآمن
//             });
//             await cashDeposit.save(); // <-- هذا السطر سيعمل الآن
//             console.log(`💰 تم إيداع مبلغ نقدي بقيمة ${paidAmount} في الخزنة.`);
//         }

//         console.log(`💳 تم تسجيل دفعة بقيمة ${paidAmount} للحجز ${reservationId}`);
//         res.status(201).send({ success: true, message: "تمت إضافة الدفعة بنجاح." });

//     } catch (error) {
//         console.error("🔥 خطأ في دالة addReservationPayment:", error.message);
//         logger.error(`Error in addReservationPayment: ${error.message}`);
//         res.status(500).send({ error: error.message });
//     }
// },


};
// At the end of reservationController.js

module.exports = reservation;