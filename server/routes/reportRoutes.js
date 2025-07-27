// routes/report.js
const express = require("express");
const router = express.Router();
const Report = require("../model/Report");
const reportController = require("../controller/reportController");

router.post("/financial-report", reportController.getFinancialReport);
router.post('/detailed-transactions', reportController.getAllReservationsWithPayments);
router.post('/treasury-transactions', reportController.getTreasuryTransactionsForReport);
router.post('/bank-revenue-summary', reportController.getBankRevenueSummary);
router.get("/handover-trace", reportController.getHandoverTrace);
router.post('/bank-expense-summary', reportController.getBankExpenseSummary);
router.post('/shift-summary-by-employee', reportController.getShiftSummaryByEmployee);
router.post("/save-report", async (req, res) => {
  console.log("📥 البيانات المستلمة من React:", req.body);

  // ✅ الخطوة 1: التحويل الصريح للتواريخ والتأكد من صحتها
  const { totalIncome, totalExpenses, netRevenue } = req.body;
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  // التحقق من أن التواريخ صالحة بعد التحويل
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ message: '⚠️ صيغة التاريخ المستلمة غير صالحة.' });
  }

  try {
    const existingReport = await Report.findOne({ startDate, endDate });

    if (existingReport) {
      return res.status(400).json({ message: '⚠️ هذا التقرير محفوظ من قبل' });
    }

    // ✅ الخطوة 2: استخدام التواريخ المحولة عند الحفظ
    const report = new Report({ startDate, endDate, totalIncome, totalExpenses, netRevenue });
    await report.save();

    res.status(201).json({ message: "✅ تم حفظ التقرير بنجاح", report });
  } catch (err) {
    console.error("❌ خطأ في حفظ التقرير:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ التقرير", details: err.message });
  }
});

// جلب جميع التقارير
router.get("/all-reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ startDate: -1 });
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب التقارير", details: err.message });
  }
});

module.exports = router;