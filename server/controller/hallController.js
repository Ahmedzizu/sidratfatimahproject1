const path = require("path");
const Hall = require("../model/hall");
const hallFileUpload = require("../middlewares/hallUpload"); // ✅ مطابق لاسم الملف
const Reservation = require("../model/reservation");


const hallController = {
  postHall: [
    hallFileUpload, // 🔹 استخدام `hallFileUpload` لمعالجة الملفات
    async (req, res) => {
      try {
        console.log("📥 البيانات المستلمة:", req.body);
        console.log("📸 الملفات المستلمة:", req.imgNames, req.videoNames);

        if (!req.imgNames && !req.videoNames) {
          console.log("❌ لم يتم استلام أي ملفات!");
          return res.status(400).send({ error: "يجب إرفاق صور أو فيديوهات!" });
        }

        let {
          name = "قاعة بدون اسم",
          rooms = "0",
          halls = "0",
          capacity = "0",
          nightPrice = "0",
          morningPrice = "0",
          wholeDayPrice = "0",
          dayStartHour = "00:00",
          dayEndHour = "23:59",
          nightStartHour = "18:00",
          nightEndHour = "23:59",
          details = [],
        } = req.body;

        rooms = parseInt(rooms) || 0;
        halls = parseInt(halls) || 0;
        capacity = parseInt(capacity) || 0;
        nightPrice = parseFloat(nightPrice) || 0;
        morningPrice = parseFloat(morningPrice) || 0;
        wholeDayPrice = parseFloat(wholeDayPrice) || 0;

        console.log("✅ البيانات المعالجة:", { rooms, halls, capacity, nightPrice, morningPrice, wholeDayPrice });

        if (!Array.isArray(details)) {
          details = details ? [details] : [];
        }
        console.log("🔍 التفاصيل:", details);

        const newHall = new Hall({
          name,
          images: req.imgNames || [],
          videos: req.videoNames || [],
          rooms,
          halls,
          capacity,
          price: { night: nightPrice, morning: morningPrice, wholeDay: wholeDayPrice },
          details,
          dayStartHour,
          dayEndHour,
          nightStartHour,
          nightEndHour,
        });

        console.log("💾 جارٍ حفظ القاعة في قاعدة البيانات...");
        await newHall.save();
        console.log("✅ القاعة أُنشئت بنجاح:", newHall);

        res.status(201).send({ message: "🏛️ القاعة أُنشئت بنجاح", hall: newHall });

      } catch (error) {
        console.error("🔥 خطأ أثناء إنشاء القاعة:", error.message);
        res.status(500).send({ error: error.message });
      }
    },
  ],

  updateHall: [
    hallFileUpload, // 🔹 استخدام `hallFileUpload` لمعالجة الملفات
    async (req, res) => {
      try {
        console.log("📥 البيانات المستلمة (تحديث):", req.body);
        console.log("📸 الملفات المستلمة (تحديث):", req.imgNames, req.videoNames);

        let { _id } = req.body;
        if (!_id) {
          return res.status(400).send({ error: "يجب إرسال معرف القاعة (_id)!" });
        }

        let existingHall = await Hall.findById(_id);
        if (!existingHall) {
          return res.status(404).send({ error: "قاعة غير موجودة!" });
        }

        let {
          name = existingHall.name,
          rooms = existingHall.rooms,
          halls = existingHall.halls,
          capacity = existingHall.capacity,
          nightPrice = existingHall.price.night,
          morningPrice = existingHall.price.morning,
          wholeDayPrice = existingHall.price.wholeDay,
          dayStartHour = existingHall.dayStartHour,
          dayEndHour = existingHall.dayEndHour,
          nightStartHour = existingHall.nightStartHour,
          nightEndHour = existingHall.nightEndHour,
        } = req.body;

        rooms = parseInt(rooms) || existingHall.rooms;
        halls = parseInt(halls) || existingHall.halls;
        capacity = parseInt(capacity) || existingHall.capacity;
        nightPrice = parseFloat(nightPrice) || existingHall.price.night;
        morningPrice = parseFloat(morningPrice) || existingHall.price.morning;
        wholeDayPrice = parseFloat(wholeDayPrice) || existingHall.price.wholeDay;

        let details = req.body["details[]"] || existingHall.details;
        if (!Array.isArray(details)) {
          details = [details];
        }

        let images = req.imgNames ? [...existingHall.images, ...req.imgNames] : existingHall.images;
        let videos = req.videoNames ? [...existingHall.videos, ...req.videoNames] : existingHall.videos;

        const updatedHall = await Hall.findByIdAndUpdate(
          _id,
          {
            name,
            images,
            videos,
            rooms,
            halls,
            capacity,
            price: { night: nightPrice, morning: morningPrice, wholeDay: wholeDayPrice },
            details,
            dayStartHour,
            dayEndHour,
            nightStartHour,
            nightEndHour,
          },
          { new: true }
        );

        console.log("✅ القاعة تم تحديثها بنجاح:", updatedHall);
        res.status(200).send(updatedHall);
      } catch (error) {
        console.error("🔥 خطأ أثناء تحديث القاعة:", error.message);
        res.status(500).send({ error: error.message });
      }
    },
  ],

  getHall: async (req, res) => {
    try {
      let halls = await Hall.find()
      res.send(halls)
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message })
    }
  },

  updateMaintenanceStatus: async (req, res) => {
    try {
      const { hallId } = req.params; // 📌 جلب معرف القاعة من الرابط
      const { maintenance } = req.body; // 📌 القيمة الجديدة للصيانة (true/false)

      // ✅ البحث عن القاعة وتحديث حالتها
      const updatedHall = await Hall.findByIdAndUpdate(
        hallId,
        { maintenance },
        { new: true }
      );

      if (!updatedHall) {
        return res.status(404).json({ error: "❌ القاعة غير موجودة!" });
      }

      res.status(200).json({
        message: "✅ تم تحديث حالة الصيانة بنجاح!",
        hall: updatedHall,
      });

    } catch (error) {
      console.error("🔥 خطأ في تحديث الصيانة:", error.message);
      res.status(500).json({ error: "❌ حدث خطأ أثناء تحديث الصيانة" });
    }
  },

  getHallsByDate: async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).send({ error: "Date is required" });
        }
  
        // ✅ تحويل التاريخ لصيغة YYYY-MM-DD ليتوافق مع MongoDB
        const formattedDate = new Date(date).toISOString().split('T')[0];
        console.log("📅 البحث عن الحجوزات بتاريخ:", formattedDate);
  
        // ✅ جلب جميع القاعات
        let halls = await Hall.find();
        console.log(`🏛️ عدد القاعات المسترجعة: ${halls.length}`);
  
        // ✅ جلب الحجوزات المؤكدة لهذا التاريخ
        let reservations = await Reservation.find({
            "period.startDate": { $lte: formattedDate },
            "period.endDate": { $gte: formattedDate },
            status: "confirmed",
            type: "hall",
        });
  
        console.log(`📌 عدد الحجوزات الموجودة لهذا التاريخ: ${reservations.length}`);
  
        let updatedHalls = halls.map(hall => {
            let hallReservations = reservations.filter(res => res.entity.id.toString() === hall._id.toString());
  
            console.log(`⏳ عدد الحجوزات لهذه القاعة (${hall.name}): ${hallReservations.length}`);
  
            let availability = "متاح للفترتين"; // ✅ الحالة الافتراضية
            let isFullDayBooked = hallReservations.some(res => res.period.dayPeriod === "كامل اليوم");
  
            if (isFullDayBooked) {
                availability = "غير متاح";
                console.log(`❌ ${hall.name} غير متاحة لكامل اليوم!`);
            } else {
                let morningBooked = hallReservations.some(res => res.period.dayPeriod === "صباحية" || res.period.type === "days");
                let eveningBooked = hallReservations.some(res => res.period.dayPeriod === "مسائية" || res.period.type === "days");
  
                if (morningBooked && eveningBooked) {
                    availability = "غير متاح";
                    console.log(`❌ ${hall.name} غير متاحة للصباحية والمسائية!`);
                } else if (morningBooked) {
                    availability = "متاح مساءً";
                    console.log(`🌙 ${hall.name} متاحة للمساء فقط`);
                } else if (eveningBooked) {
                    availability = "متاح صباحًا";
                    console.log(`☀️ ${hall.name} متاحة للصباح فقط`);
                }
            }
  
            return { ...hall._doc, availability };
        });
  
        console.log("✅ إرسال النتائج النهائية:", updatedHalls);
        res.send(updatedHalls);
    } catch (error) {
        console.log("🔥 خطأ أثناء جلب القاعات:", error.message);
        res.status(500).send({ error: error.message });
    }
  },
  

  deleteHall: async (req, res) => {
    try {
      let { id } = req.params
      await Hall.findByIdAndDelete({ _id: id })
        .then(() => res.sendStatus(202))
        .catch((err) => res.status(500).send(err))
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message })
    }
  },

};

module.exports = hallController;
