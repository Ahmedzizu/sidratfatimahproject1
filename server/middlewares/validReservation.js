// F:\ractprojects\New folder (2)\ggg\Server\1818server\server\middlewares\validReservation.js

const Reservation = require("../model/reservation");
const mongoose = require('mongoose');

const Hall = require("../model/hall");
const Chalet = require("../model/chalet");
const Resort = require("../model/resort");

const { addDays, format, isToday, parseISO } = require('date-fns');

const timeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

const PERIOD_DEFINITIONS = {
    'morning': { name: 'صباحية', start: 'dayStartHour', end: 'dayEndHour' },
    'night': { name: 'مسائية', start: 'nightStartHour', end: 'nightEndHour' },
    'wholeDay': { name: 'كامل اليوم', start: 'dayStartHour', end: 'nightEndHour' },
};

async function getDailyPeriodsStatus(entity, specificDayUTC, reservationsOnThisDay) {
    const dailyStatus = {
        morning: 'available',
        night: 'available',
        wholeDay: 'available'
    };

    const entityDayStartMinutes = timeToMinutes(entity.dayStartHour);
    const entityDayEndMinutes = timeToMinutes(entity.dayEndHour);
    const entityNightStartMinutes = timeToMinutes(entity.nightStartHour);
    const entityNightEndMinutes = timeToMinutes(entity.nightEndHour);

    for (const existingRes of reservationsOnThisDay) {
        // ✅ التعديل هنا: هذا الشرط يقرر ما إذا كان الحجز الموجود يمنع التوفر
        // إذا كان الحجز الموجود "مؤكد" (confirmed) فإنه يمنع أي حجز جديد.
        // إذا كان "غير مؤكد" (unConfirmed)، فلا يمنع حجزًا جديدًا.
        if (existingRes.status !== 'confirmed') {
            continue; // تخطي هذا الحجز إذا لم يكن مؤكداً (لا يُعتبر عائقاً)
        }

        let existingCheckInMinutes;
        let existingCheckOutMinutes;

        const resStartDateUTC = new Date(existingRes.period.startDate);
        const resEndDateUTC = new Date(existingRes.period.endDate);
        resStartDateUTC.setUTCHours(0, 0, 0, 0);
        resEndDateUTC.setUTCHours(0, 0, 0, 0);

        if (existingRes.period.type === 'dayPeriod' && existingRes.period.dayPeriod) {
            switch (existingRes.period.dayPeriod) {
                case 'صباحية':
                    existingCheckInMinutes = entityDayStartMinutes;
                    existingCheckOutMinutes = entityDayEndMinutes;
                    break;
                case 'مسائية':
                    existingCheckInMinutes = entityNightStartMinutes;
                    existingCheckOutMinutes = entityNightEndMinutes;
                    break;
                case 'كامل اليوم':
                    existingCheckInMinutes = entityDayStartMinutes;
                    existingCheckOutMinutes = entityNightEndMinutes;
                    break;
                default:
                    continue;
            }
        } else if (existingRes.period.type === 'days') {
            if (specificDayUTC.getTime() === resStartDateUTC.getTime()) {
                existingCheckInMinutes = timeToMinutes(existingRes.period.checkIn.time);
                existingCheckOutMinutes = entityNightEndMinutes;
            } else if (specificDayUTC.getTime() === resEndDateUTC.getTime()) {
                existingCheckInMinutes = entityDayStartMinutes;
                existingCheckOutMinutes = timeToMinutes(existingRes.period.checkOut.time);
            } else {
                existingCheckInMinutes = entityDayStartMinutes;
                existingCheckOutMinutes = entityNightEndMinutes;
            }
        } else {
            continue;
        }

        const checkOverlap = (reqIn, reqOut, existIn, existOut) =>
            reqIn < existOut && reqOut > existIn;

        if (checkOverlap(entityDayStartMinutes, entityDayEndMinutes, existingCheckInMinutes, existingCheckOutMinutes)) {
            dailyStatus.morning = 'unavailable';
        }
        if (checkOverlap(entityNightStartMinutes, entityNightEndMinutes, existingCheckInMinutes, existingCheckOutMinutes)) {
            dailyStatus.night = 'unavailable';
        }
        if (dailyStatus.morning === 'unavailable' || dailyStatus.night === 'unavailable') {
            dailyStatus.wholeDay = 'unavailable';
        }
    }
    return dailyStatus;
}

const validReservation = {
    getDailyPeriodsStatus: getDailyPeriodsStatus,

    checkPeriod: async (req, res, nxt) => {
        try {
            const { period, _id, entityId } = req.body;

            if (!period || !period.startDate || !period.endDate || !period.checkIn || !period.checkOut) {
                return res.status(400).send({ error: "بيانات الفترة غير كاملة في الطلب." });
            }

            const targetEntityId = entityId || req.body.entity?.id;
            if (!targetEntityId) {
                return res.status(400).send({ error: "معرف الكيان (entity ID) مطلوب." });
            }

            let entity;
            if (!(entity = await Hall.findById(targetEntityId)) &&
                !(entity = await Chalet.findById(targetEntityId)) &&
                !(entity = await Resort.findById(targetEntityId))) {
                return res.status(404).send({ error: "الكيان (Hall/Chalet/Resort) غير موجود." });
            }

            const requestedStartDate = new Date(period.startDate);
            const requestedEndDate = new Date(period.endDate);
            requestedStartDate.setUTCHours(0, 0, 0, 0);
            requestedEndDate.setUTCHours(0, 0, 0, 0);

            if (isNaN(requestedStartDate.getTime()) || isNaN(requestedEndDate.getTime())) {
                return res.status(400).send({ error: "تنسيق التاريخ غير صالح." });
            }

            // ✅ التعديل الأول: الاستعلام يجب أن يجلب كلا من الحجوزات المؤكدة وغير المؤكدة
            const query = {
                "entity.id": targetEntityId,
                status: { $in: ['confirmed', 'unConfirmed'] }, // 🔵 أعدناها لـ 'confirmed' و 'unConfirmed'
                completed: { $ne: true },
                "period.startDate": { $lte: requestedEndDate.toISOString().split('T')[0] },
                "period.endDate": { $gte: requestedStartDate.toISOString().split('T')[0] },
            };

            if (_id) {
                query._id = { $ne: new mongoose.Types.ObjectId(_id) };
            }

            const existingReservations = await Reservation.find(query).lean();

            let conflicted = false;
            let conflictMessage = '';

            let currentDateIterator = new Date(requestedStartDate);
            while (currentDateIterator.getTime() <= requestedEndDate.getTime() && !conflicted) {
                const currentDayUTC = new Date(currentDateIterator).setUTCHours(0, 0, 0, 0);

                // هنا، relevantExistingReservations ستشمل *كل* الحجوزات المتداخلة في هذا اليوم
                const relevantExistingReservations = existingReservations.filter(res => {
                    const resStart = new Date(res.period.startDate);
                    const resEnd = new Date(res.period.endDate);
                    resStart.setUTCHours(0,0,0,0);
                    resEnd.setUTCHours(0,0,0,0);
                    return currentDayUTC >= resStart.getTime() && currentDayUTC <= resEnd.getTime();
                });

                // ✅ التعديل الثاني: عند استدعاء getDailyPeriodsStatus، مرر فقط الحجوزات *المؤكدة* كـ "عوائق"
                // هذا هو مفتاح الحل: دالة getDailyPeriodsStatus ستحدد إذا كان الحجز المؤكد الحالي يسبب تعارضاً.
                const confirmedRelevantReservations = relevantExistingReservations.filter(res => res.status === 'confirmed');
                const dailyAvailabilityStatusForCurrentDay = await getDailyPeriodsStatus(entity, currentDayUTC, confirmedRelevantReservations); // 🔵 مرر فقط المؤكدة هنا

                let isCurrentPeriodAvailable = true;
                // ... (باقي منطق التحقق من التعارض باستخدام dailyAvailabilityStatusForCurrentDay) ...
                if (period.type === 'dayPeriod') {
                    if (period.dayPeriod === 'كامل اليوم' && dailyAvailabilityStatusForCurrentDay.wholeDay === 'unavailable') {
                        isCurrentPeriodAvailable = false;
                    } else if (period.dayPeriod === 'صباحية' && dailyAvailabilityStatusForCurrentDay.morning === 'unavailable') {
                        isCurrentPeriodAvailable = false;
                    } else if (period.dayPeriod === 'مسائية' && dailyAvailabilityStatusForCurrentDay.night === 'unavailable') {
                        isCurrentPeriodAvailable = false;
                    }
                } else if (period.type === 'days') {
                    const reqStartDateUTC = new Date(requestedStartDate).setUTCHours(0,0,0,0);
                    const reqEndDateUTC = new Date(requestedEndDate).setUTCHours(0,0,0,0);

                    if (currentDayUTC === reqStartDateUTC) {
                        if (period.checkIn.name === 'صباحية' && dailyAvailabilityStatusForCurrentDay.wholeDay === 'unavailable') {
                            isCurrentPeriodAvailable = false;
                        } else if (period.checkIn.name === 'مسائية' && dailyAvailabilityStatusForCurrentDay.night === 'unavailable') {
                            isCurrentPeriodAvailable = false;
                        }
                    } else if (currentDayUTC === reqEndDateUTC) {
                        if (period.checkOut.name === 'صباحية' && dailyAvailabilityStatusForCurrentDay.morning === 'unavailable') {
                            isCurrentPeriodAvailable = false;
                        } else if (period.checkOut.name === 'مسائية' && dailyAvailabilityStatusForCurrentDay.wholeDay === 'unavailable') {
                            isCurrentPeriodAvailable = false;
                        }
                    } else {
                        if (dailyAvailabilityStatusForCurrentDay.wholeDay === 'unavailable') {
                            isCurrentPeriodAvailable = false;
                        }
                    }
                }

                if (!isCurrentPeriodAvailable) {
                    conflicted = true;
                    // ✅ رسالة خطأ أوضح
                    conflictMessage = `توجد تعارضات. الفترة المطلوبة في تاريخ ${format(currentDateIterator, 'yyyy-MM-dd')} محجوزة بالفعل بحجز مؤكد.`;
                    break;
                }
                currentDateIterator.setDate(currentDateIterator.getDate() + 1);
            }

            if (conflicted) {
                return res.status(409).send({ error: conflictMessage });
            }
            nxt(); // إذا لا يوجد تعارض مع الحجوزات المؤكدة، استمر
        } catch (error) {
            console.error("🔥 Error in validReservation.checkPeriod:", error.message, error.stack);
            res.status(500).send({ error: "حدث خطأ في الخادم أثناء التحقق من التوافر: " + error.message });
        }
    },
};

module.exports = validReservation;