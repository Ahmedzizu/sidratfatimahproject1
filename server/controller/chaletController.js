const path = require("path");
const Chalet = require("../model/chalet");
const Reservation = require("../model/reservation");
const chaletFileUpload = require("../middlewares/chaletUpload");

const chaletController = {
  postChalet: [
    chaletFileUpload, // تشغيل `chaletFileUpload` لمعالجة الملفات
    async (req, res) => {
      try {
        console.log("📥 البيانات المستلمة:", req.body);
        console.log("📸 الملفات المستلمة:", req.imgNames, req.videoNames);

        if (!req.imgNames && !req.videoNames) {
          console.log("❌ لم يتم استلام أي ملفات!");
          return res.status(400).send({ error: "يجب إرفاق صور أو فيديوهات!" });
        }

        let {
          name = "شاليه بدون اسم",
          area = "0",
          address = "",
          bath = "0",
          lounge = "0",
          nightPrice = "0",
          morningPrice = "0",
          wholeDayPrice = "0",
          sleeping = "0",
          kitchen = "0",
          dayStartHour = "00:00",
          dayEndHour = "23:59",
          nightStartHour = "18:00",
          nightEndHour = "23:59",
          details = [],
        } = req.body;

        area = parseInt(area) || 0;
        bath = parseInt(bath) || 0;
        lounge = parseInt(lounge) || 0;
        nightPrice = parseFloat(nightPrice) || 0;
        morningPrice = parseFloat(morningPrice) || 0;
        wholeDayPrice = parseFloat(wholeDayPrice) || 0;
        sleeping = parseInt(sleeping) || 0;
        kitchen = parseInt(kitchen) || 0;

        if (!Array.isArray(details)) {
          details = details ? [details] : [];
        }

        const newChalet = new Chalet({
          name,
          images: req.imgNames || [],
          videos: req.videoNames || [],
          details,
          area,
          address,
          sleeping,
          lounge,
          kitchen,
          bath,
          price: { morning: morningPrice, night: nightPrice, wholeDay: wholeDayPrice },
          dayStartHour,
          dayEndHour,
          nightStartHour,
          nightEndHour,
        });

        await newChalet.save();
        console.log("✅ الشاليه أُنشئ بنجاح:", newChalet);
        res.status(201).send({ message: "🏡 الشاليه أُنشئ بنجاح", chalet: newChalet });

      } catch (error) {
        console.error("🔥 خطأ أثناء إنشاء الشاليه:", error.message);
        res.status(500).send({ error: error.message });
      }
    },
  ],

  getChalet: async (req, res) => {
    try {
      let chalets = await Chalet.find();
      res.send(chalets);
    } catch (error) {
      console.error("🔥 خطأ أثناء جلب الشاليهات:", error.message);
      res.status(500).send({ error: error.message });
    }
  },

  getChaletsByDate: async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            return res.status(400).send({ error: "Date is required" });
        }

        // ✅ تحويل التاريخ لصيغة YYYY-MM-DD ليتوافق مع MongoDB
        const formattedDate = new Date(date).toISOString().split('T')[0];
        console.log("📅 البحث عن الحجوزات بتاريخ:", formattedDate);

        // ✅ جلب جميع الشاليهات
        let chalets = await Chalet.find();
        console.log(`🏡 عدد الشاليهات المسترجعة: ${chalets.length}`);

        // ✅ جلب الحجوزات المؤكدة لهذا التاريخ
        let reservations = await Reservation.find({
            "period.startDate": { $lte: formattedDate },
            "period.endDate": { $gte: formattedDate },
            status: "confirmed",
            type: "chalet",
        });

        console.log(`📌 عدد الحجوزات الموجودة لهذا التاريخ: ${reservations.length}`);

        let updatedChalets = chalets.map(chalet => {
            let chaletReservations = reservations.filter(res => res.entity.id.toString() === chalet._id.toString());

            console.log(`⏳ عدد الحجوزات لهذا الشاليه (${chalet.name}): ${chaletReservations.length}`);

            let availability = "متاح للفترتين"; // ✅ الحالة الافتراضية
            let isFullDayBooked = chaletReservations.some(res => res.period.dayPeriod === "كامل اليوم");

            if (isFullDayBooked) {
                availability = "غير متاح";
                console.log(`❌ ${chalet.name} غير متاح لكامل اليوم!`);
            } else {
                let morningBooked = chaletReservations.some(res => res.period.dayPeriod === "صباحية" || res.period.type === "days");
                let eveningBooked = chaletReservations.some(res => res.period.dayPeriod === "مسائية" || res.period.type === "days");

                if (morningBooked && eveningBooked) {
                    availability = "غير متاح";
                    console.log(`❌ ${chalet.name} غير متاح للصباحية والمسائية!`);
                } else if (morningBooked) {
                    availability = "متاح مساءً";
                    console.log(`🌙 ${chalet.name} متاح للمساء فقط`);
                } else if (eveningBooked) {
                    availability = "متاح صباحًا";
                    console.log(`☀️ ${chalet.name} متاح للصباح فقط`);
                }
            }

            return { ...chalet._doc, availability };
        });

        console.log("✅ إرسال النتائج النهائية:", updatedChalets);
        res.send(updatedChalets);
    } catch (error) {
        console.log("🔥 خطأ أثناء جلب الشاليهات:", error.message);
        res.status(500).send({ error: error.message });
    }
},

updateMaintenanceStatus: async (req, res) => {
  try {
    const { chaletId } = req.params; // 📌 جلب معرف الشاليه من الرابط
    const { maintenance } = req.body; // 📌 القيمة الجديدة للصيانة (true/false)

    // ✅ البحث عن الشاليه وتحديث حالته
    const updatedChalet = await Chalet.findByIdAndUpdate(
      chaletId,
      { maintenance },
      { new: true }
    );

    if (!updatedChalet) {
      return res.status(404).json({ error: "❌ الشاليه غير موجود!" });
    }

    res.status(200).json({
      message: "✅ تم تحديث حالة الصيانة بنجاح!",
      chalet: updatedChalet,
    });

  } catch (error) {
    console.error("🔥 خطأ في تحديث الصيانة:", error.message);
    res.status(500).json({ error: "❌ حدث خطأ أثناء تحديث الصيانة" });
  }
},


  updateChalet: [
    chaletFileUpload,
    async (req, res) => {
      try {
        console.log("📥 البيانات المستلمة (تحديث):", req.body);
        console.log("📸 الملفات المستلمة (تحديث):", req.imgNames, req.videoNames);

        let { _id } = req.body;
        if (!_id) {
          return res.status(400).send({ error: "يجب إرسال معرف الشاليه (_id)!" });
        }

        let existingChalet = await Chalet.findById(_id);
        if (!existingChalet) {
          return res.status(404).send({ error: "الشاليه غير موجود!" });
        }

        let updatedChalet = await Chalet.findByIdAndUpdate(
          _id,
          { $set: req.body, images: req.imgNames, videos: req.videoNames },
          { new: true }
        );

        console.log("✅ الشاليه تم تحديثه بنجاح:", updatedChalet);
        res.status(200).send(updatedChalet);
      } catch (error) {
        console.error("🔥 خطأ أثناء تحديث الشاليه:", error.message);
        res.status(500).send({ error: error.message });
      }
    },
  ],

  deleteChalet: async (req, res) => {
    try {
      let { id } = req.params;
      await Chalet.findByIdAndDelete({ _id: id });
      res.sendStatus(202);
    } catch (error) {
      console.error("🔥 خطأ أثناء حذف الشاليه:", error.message);
      res.status(500).send({ error: error.message });
    }
  },
};

module.exports = chaletController;
