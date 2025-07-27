const express = require('express');
const router = express.Router();

// ✅ التحقق من أن `hallController.js` يتم استيراده بشكل صحيح
const hall = require('../controller/hallController');
console.log("🚀 تم تحميل hallController:", hall);

// ✅ التحقق من أن `hallFileUpload.js` يتم استيراده بشكل صحيح
const hallFileUpload = require('../middlewares/hallUpload');
console.log("📂 تم تحميل hallFileUpload:", hallFileUpload);

// ✅ التحقق من أن `deleteFile.js` يتم استيراده بشكل صحيح
const deleteFile = require("../middlewares/deleteFile");
console.log("🗑️ تم تحميل deleteFile:", deleteFile);

// ✅ تعريف المسارات
router.route('/hall')
  .post(hallFileUpload, hall.postHall) // معالجة رفع الملفات قبل إنشاء القاعة
  .get(hall.getHall);

router.post("/hall/by-date", hall.getHallsByDate);
router.put("/halls/:hallId/maintenance", hall.updateMaintenanceStatus);


// ✅ التحقق من أن `updateHall` تعمل بشكل صحيح
router.post("/hall/update", hallFileUpload, hall.updateHall);

// ✅ التحقق من `deleteFile.hall` قبل الاستخدام
if (deleteFile && deleteFile.hall) {
  router.delete('/hall/delete/:id', deleteFile.hall, hall.deleteHall);
} else {
  console.error("❌ deleteFile.hall غير موجود! تأكد من تصديره بشكل صحيح.");
}

module.exports = router;
