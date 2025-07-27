const path = require("path");

const chaletFileUpload = (req, res, next) => {
  try {
    req.imgNames = [];
    req.videoNames = [];

    if (req.files && req.files["file[]"]) {
      let files = req.files["file[]"];
      if (!Array.isArray(files)) files = [files];

      for (let file of files) {
        let fileName = `chalet-${Date.now()}${path.extname(file.name)}`;
        let uploadPath = path.join(__dirname, "..", "uploads", "chalet", fileName);
        file.mv(uploadPath);
        req.imgNames.push(`/chalet/${fileName}`);
      }
    }

    if (req.files && req.files["videos[]"]) {
      let videos = req.files["videos[]"];
      if (!Array.isArray(videos)) videos = [videos];

      for (let video of videos) {
        let fileName = `chalet-video-${Date.now()}${path.extname(video.name)}`;
        let uploadPath = path.join(__dirname, "..", "uploads", "chalet", fileName);
        video.mv(uploadPath);
        req.videoNames.push(`/chalet/${fileName}`);
      }
    }

    console.log("✅ الملفات تم تجهيزها:", req.imgNames, req.videoNames);
    next();
  } catch (error) {
    console.error("🔥 خطأ أثناء رفع الملفات:", error.message);
    res.status(500).send({ error: error.message });
  }
};

module.exports = chaletFileUpload;
//
