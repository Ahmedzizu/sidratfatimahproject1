const path = require("path");

const hallFileUpload = async (req, res, next) => {
  console.log("📂 المفاتيح المستلمة:", Object.keys(req.files || {}));

  try {
    console.log("🚀 بدء استقبال الملفات...");
    console.log("🧾 req.files:", req.files);

    req.imgNames = [];
    req.videoNames = [];

    if (req.files && req.files["file[]"]) {
      let files = req.files["file[]"];
      if (!Array.isArray(files)) files = [files];

      console.log(`📸 عدد الصور المستلمة: ${files.length}`);

      for (let file of files) {
        let fileName = Date.now() + "-hall" + path.extname(file.name);
        let uploadPath = path.join(__dirname, "..", "uploads", "hall", fileName);

        await file.mv(uploadPath);
        req.imgNames.push(`/hall/${fileName}`);
      }
    }

    if (req.files && req.files["videos[]"]) {
      let videos = req.files["videos[]"];
      if (!Array.isArray(videos)) videos = [videos];

      console.log(`🎥 عدد الفيديوهات المستلمة: ${videos.length}`);

      for (let video of videos) {
        let fileName = Date.now() + "-hall-video" + path.extname(video.name);
        let uploadPath = path.join(__dirname, "..", "uploads", "hall", fileName);

        await video.mv(uploadPath);
        req.videoNames.push(`/hall/${fileName}`);
      }
    }

    console.log("✅ الملفات تم تجهيزها:", req.imgNames, req.videoNames);
    next();
  } catch (error) {
    console.error("🔥 خطأ أثناء رفع الملفات:", error.message);
    res.status(500).send({ error: error.message });
  }
};

module.exports = hallFileUpload;
