const path = require("path");

const expensesFileUpload = (req, res, next) => {
  try {
    // ✅ استلام الملف من FormData
const file = req.files?.bill;
    if (!file) {
      console.log("📂 لا يوجد ملف مرفوع، المتابعة بدون رفع.");
      return next();
    }

    let fileName = "expenses_" + Date.now() + path.extname(file.name);
    let uploadPath = path.join(__dirname, "..", "uploads", "expenses", fileName);

    file.mv(uploadPath, (err) => {
      if (err) {
        console.error("❌ خطأ أثناء رفع الملف:", err.message);
        return res.status(500).send({ error: err.message });
      }

      console.log("✅ الملف تم رفعه بنجاح:", fileName);
      // ✅ تخزين اسم الملف في req حتى يتم حفظه في الـ schema لاحقاً
      req.file = { filename: fileName };
      next();
    });

  } catch (error) {
    console.error("🔥 خطأ أثناء معالجة رفع الملف:", error.message);
    return res.status(500).send({ error: error.message });
  }
};

module.exports = expensesFileUpload;
