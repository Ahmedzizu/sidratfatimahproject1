const resortValidation = require("../validation/resortValidation")
const Resort=require("../model/resort")
const Reservation = require("../model/reservation");
const multer = require("multer");

// إعداد `multer` لاستقبال الصور والفيديوهات
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "file[]", maxCount: 10 }, 
  { name: "videos[]", maxCount: 5 }
]);

const resort={

     postResort : [
        upload, // تشغيل `multer` لمعالجة `Form Data` والملفات
        async (req, res) => {
          try {
            console.log("📥 Received Request Body:", req.body);
            console.log("📸 Received Files:", req.files);
      
            // معالجة الملفات (الصور والفيديوهات)
            let images = req.files["file[]"] ? req.files["file[]"].map(file => `/resort/img/${file.originalname}`) : [];
            let videos = req.files["videos[]"] ? req.files["videos[]"].map(file => `/resort/videos/${file.originalname}`) : [];
      
            // استخراج الحقول من `req.body`
            let {
              name,
              kitchen,
              pool,
              games,
              nightPrice,
              morningPrice,
              wholeDayPrice,
              area,
              dayStartHour,
              dayEndHour,
              nightStartHour,
              nightEndHour
            } = req.body;
      
            // التأكد من تحويل القيم الرقمية
            kitchen = parseInt(kitchen) || 0;
            pool = parseInt(pool) || 0;
            games = parseInt(games) || 0;
            nightPrice = parseFloat(nightPrice) || 0;
            morningPrice = parseFloat(morningPrice) || 0;
            wholeDayPrice = parseFloat(wholeDayPrice) || 0;
            area = parseInt(area) || 0;
      
            // التأكد من أن `details[]` مصفوفة
            let details = req.body["details[]"] || [];
            if (!Array.isArray(details)) {
              details = [details];
            }
      
            // التحقق من الحقول المطلوبة
            if (!name || !area || !kitchen || !pool || !games || !dayStartHour || !dayEndHour || !nightStartHour || !nightEndHour) {
              return res.status(400).send({ error: "جميع الحقول مطلوبة!" });
            }
      
            // إنشاء بيانات المنتجع
            const resort = new Resort({
              name,
              videos,
              images,
              pool,
              kitchen,
              games,
              price: {
                night: nightPrice,
                morning: morningPrice,
                wholeDay: wholeDayPrice
              },
              details,
              area,
              dayStartHour,
              dayEndHour,
              nightStartHour,
              nightEndHour
            });
      
            // حفظ المنتجع في قاعدة البيانات
            await resort.save();
            console.log("✅ Resort Created Successfully:", resort);
            res.sendStatus(201);
          } catch (error) {
            console.error("🔥 Error while creating resort:", error.message);
            res.status(500).send({ error: error.message });
          }
        }
      ],

getResort:async(req,res)=>{
    try {
        let resorts= await Resort.find()
        res.send(resorts)
    } catch (error) {
        console.log(error.message);
        res.status(500).send({error:error.message})
    }
},

getResortsByDate: async (req, res) => {
  try {
      const { date } = req.body;
      if (!date) return res.status(400).send({ error: "Date is required" });

      // ✅ تحويل التاريخ إلى ISOString ليكون مطابقًا لقاعدة البيانات
      const formattedDate = new Date(date).toISOString().split('T')[0];
      console.log("📅 البحث عن الحجوزات بتاريخ:", formattedDate);

      let resorts = await Resort.find(); // ✅ جلب جميع المنتجعات
      console.log(`🏖️ عدد المنتجعات المسترجعة: ${resorts.length}`);

      // ✅ جلب الحجوزات المؤكدة باستخدام تنسيق التاريخ الصحيح
      let reservations = await Reservation.find({
          "period.startDate": { $lte: formattedDate },
          "period.endDate": { $gte: formattedDate },
          status: "confirmed",
          type: "resort",
      });

      console.log(`📌 عدد الحجوزات الموجودة لهذا التاريخ: ${reservations.length}`);

      let updatedResorts = resorts.map(resort => {
          let resortReservations = reservations.filter(res => {
              return res.entity.id.toString() === resort._id.toString();
          });

          console.log(`⏳ عدد الحجوزات لهذا المنتجع (${resort.name}): ${resortReservations.length}`);

          let availability = "متاح للفترتين";
          let isFullDayBooked = resortReservations.some(res => res.period.dayPeriod === "كامل اليوم");

          if (isFullDayBooked) {
              availability = "غير متاح";
              console.log(`❌ ${resort.name} غير متاح لكامل اليوم!`);
          } else {
              let morningBooked = resortReservations.some(res => res.period.dayPeriod === "صباحية" || res.period.type === "days");
              let eveningBooked = resortReservations.some(res => res.period.dayPeriod === "مسائية" || res.period.type === "days");

              if (morningBooked && eveningBooked) {
                  availability = "غير متاح";
                  console.log(`❌ ${resort.name} غير متاح للصباحية والمسائية!`);
              } else if (morningBooked) {
                  availability = "متاح مساءً";
                  console.log(`🌙 ${resort.name} متاح للمساء فقط`);
              } else if (eveningBooked) {
                  availability = "متاح صباحًا";
                  console.log(`☀️ ${resort.name} متاح للصباح فقط`);
              }
          }

          return { ...resort._doc, availability };
      });

      console.log("✅ إرسال النتائج النهائية:", updatedResorts);
      res.send(updatedResorts);
  } catch (error) {
      console.log("🔥 خطأ أثناء جلب المنتجعات:", error.message);
      res.status(500).send({ error: error.message });
  }
},


deleteResort:async(req,res)=>{
    try {
        let {id}=req.params
        await Resort.findByIdAndDelete({_id:id})
        .then(()=> res.sendStatus(202))
        .catch((err)=>res.status(500).send(err))
    } catch (error) {
        console.log(error.message);
        res.status(500).send({error:error.message})
    }
},


 updateResort : [
    upload, // تشغيل `multer` لمعالجة `Form Data` والملفات
    async (req, res) => {
      try {
        console.log("📥 Received Request Body (UPDATE):", req.body);
        console.log("📸 Received Files (UPDATE):", req.files);
  
        // استخراج `ID` للتحقق من وجود المنتجع
        let { _id } = req.body;
        if (!_id) {
          return res.status(400).send({ error: "يجب إرسال معرف المنتجع (_id)!" });
        }
  
        // البحث عن المنتجع للتأكد من وجوده قبل التحديث
        let existingResort = await Resort.findById(_id);
        if (!existingResort) {
          return res.status(404).send({ error: "المنتجع غير موجود!" });
        }
  
        // استخراج البيانات مع الحفاظ على القيم القديمة إذا لم يتم إرسال جديدة
        let {
          name = existingResort.name,
          kitchen = existingResort.kitchen,
          pool = existingResort.pool,
          games = existingResort.games,
          nightPrice = existingResort.price.night,
          morningPrice = existingResort.price.morning,
          wholeDayPrice = existingResort.price.wholeDay,
          area = existingResort.area,
          dayStartHour = existingResort.dayStartHour,
          dayEndHour = existingResort.dayEndHour,
          nightStartHour = existingResort.nightStartHour,
          nightEndHour = existingResort.nightEndHour,
        } = req.body;
  
        // تحويل القيم النصية إلى أرقام عند الحاجة
        kitchen = parseInt(kitchen) || existingResort.kitchen;
        pool = parseInt(pool) || existingResort.pool;
        games = parseInt(games) || existingResort.games;
        nightPrice = parseFloat(nightPrice) || existingResort.price.night;
        morningPrice = parseFloat(morningPrice) || existingResort.price.morning;
        wholeDayPrice = parseFloat(wholeDayPrice) || existingResort.price.wholeDay;
        area = parseInt(area) || existingResort.area;
  
        // معالجة `details`
        let details = req.body["details[]"] || existingResort.details;
        if (!Array.isArray(details)) {
          details = [details];
        }
  
        // معالجة الصور الجديدة إذا تم رفعها
        let images = existingResort.images;
        if (req.files && req.files["file[]"]) {
          let newImages = req.files["file[]"].map(file => `/resort/img/${file.originalname}`);
          images = [...existingResort.images, ...newImages]; // **دمج الصور الجديدة مع القديمة**
        }
  
        // معالجة الفيديوهات الجديدة إذا تم رفعها
        let videos = existingResort.videos;
        if (req.files && req.files["videos[]"]) {
          let newVideos = req.files["videos[]"].map(file => `/resort/videos/${file.originalname}`);
          videos = [...existingResort.videos, ...newVideos]; // **دمج الفيديوهات الجديدة مع القديمة**
        }
  
        // تحديث بيانات المنتجع
        const updatedResort = await Resort.findByIdAndUpdate(
          _id,
          {
            name,
            images,
            videos,
            pool,
            kitchen,
            games,
            price: {
              night: nightPrice,
              morning: morningPrice,
              wholeDay: wholeDayPrice
            },
            details,
            area,
            dayStartHour,
            dayEndHour,
            nightStartHour,
            nightEndHour
          },
          { new: true }
        );
  
        console.log("✅ Resort Updated Successfully:", updatedResort);
        res.status(200).send(updatedResort);
      } catch (error) {
        console.error("🔥 Error while updating resort:", error.message);
        res.status(500).send({ error: error.message });
      }
    }
  ],


}

module.exports =resort