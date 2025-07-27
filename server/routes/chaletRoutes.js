const express = require("express");
const router = express.Router();
const chalet = require("../controller/chaletController");
const chaletFileUpload = require("../middlewares/chaletUpload");
const deleteFile = require("../middlewares/deleteFile");

router.post("/chalet", chaletFileUpload, chalet.postChalet);
router.get("/chalet", chalet.getChalet);
router.post("/chalet/update", chaletFileUpload, chalet.updateChalet);
router.delete("/chalet/delete/:id", deleteFile.chalet, chalet.deleteChalet);
router.put("/chalets/:chaletId/maintenance", chalet.updateMaintenanceStatus);


// 🔥 **إضافة مسار البحث عن الشاليهات المتاحة بتاريخ معين**
router.post("/chalet/by-date", chalet.getChaletsByDate);

module.exports = router;
