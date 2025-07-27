const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/expenses");
  },
  filename: function (req, file, cb) {
    console.log(file);
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + Date.now() + ext);
  },
});

const upload = multer({ storage: storage });
module.exports = upload;