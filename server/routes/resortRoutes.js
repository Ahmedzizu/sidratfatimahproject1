const express = require('express');
const resort = require('../controller/resortController');
const resortFileUpload = require('../middlewares/resortUpload');
const router = express.Router();
const deleteFile=require("../middlewares/deleteFile")
router.route('/resort')
.post(resortFileUpload,resort.postResort)
.get(resort.getResort)

router.post('/resort/by-date', resort.getResortsByDate);


router.post("/resort/update",resortFileUpload,resort.updateResort)
router.delete('/resort/delete/:id',deleteFile.resort,resort.deleteResort)
router.get('/', async (req, res) => {
  try {
    const expenses = await Expenses.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "فشل في جلب المصروفات" });
  }
});

module.exports = router;