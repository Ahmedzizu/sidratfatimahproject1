const Reservation = require("../model/reservation");
const ReservationPayments = require("../model/reservationPayments");
const Expenses = require("../model/expenses");
const Draws = require("../model/draws");
const BankTransactions = require("../model/banktransactions");
const Discount = require("../model/Discount"); // ✅ استيراد مودل كود الخصم
const User = require("../model/user");
const Customer = require("../model/user");
const Payments = require("../model/reservationPayments");
const { format, parseISO, addDays, isToday } = require("date-fns");
const dateToday = require("../middlewares/dateToday");
const Insurence = require("../model/insurance");
const Hall = require("../model/hall");
const Chalet = require("../model/chalet");
const Rating = require("../model/rating");
const Notification = require("../model/notification");
const loggerEvent = require("../services/logger");
const logger = loggerEvent("reservations");
const mongoose = require("mongoose");
const CashTransaction = require('../model/cashTransaction'); // تأكد من صحة المسار لملف الموديل
const ShiftClosure = require('../model/ShiftClosure'); 

// 1. دالة جلب التقرير المالي

exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // 1. التحقق من صحة التواريخ وإنشاء فلتر التاريخ
    const validStartDate = new Date(startDate);
    const validEndDate = new Date(endDate);

    if (isNaN(validStartDate.getTime()) || isNaN(validEndDate.getTime())) {
      return res.status(400).send({ error: "صيغة التاريخ المستلمة غير صالحة" });
    }
    
    const dateFilter = { $gte: validStartDate, $lte: validEndDate };

    // 2. إعداد استعلامات قاعدة البيانات لتُنفذ بالتزامن
    const paymentsPromise = ReservationPayments.aggregate([
      { $addFields: { dateAsDate: { $toDate: "$paymentDate" } } },
      { $match: { dateAsDate: dateFilter } },
      { $lookup: { from: "reservations", localField: "reservation", foreignField: "_id", as: "reservationDetails" } },
      { $unwind: "$reservationDetails" },
      { $group: { _id: { type: "$reservationDetails.type", paymentType: "$type" }, total: { $sum: "$paid" } } },
    ]);

  // في reportController.js داخل دالة getFinancialReport

const expensesPromise = Expenses.aggregate([
    { $addFields: { dateAsDate: { $toDate: "$date" } } },
    { $match: { dateAsDate: dateFilter } },
    { 
      $group: { 
        // ✅ التعديل هنا: استخدام billType بدلاً من paymentMethod
        _id: { type: "$type", paymentMethod: "$billType" }, 
        totalAmount: { $sum: "$amount" } 
      } 
    },
]);

    // 3. تنفيذ كل الاستعلامات معاً باستخدام Promise.all
    const [payments, expensesDetailedRaw] = await Promise.all([
      paymentsPromise,
      expensesPromise,
    ]);

    // 4. معالجة نتائج الإيرادات
    const hallRevenue = { cash: 0, bankTransfer: 0, insurance: 0 };
    const chaletRevenue = { cash: 0, bankTransfer: 0, insurance: 0 };

    payments.forEach((payment) => {
        if (payment._id.type === "hall") {
            if (payment._id.paymentType === "نقدي") hallRevenue.cash += payment.total;
            if (payment._id.paymentType === "تحويل بنكي") hallRevenue.bankTransfer += payment.total;
            if (payment._id.paymentType === "شبكة") hallRevenue.insurance += payment.total;
        } else if (payment._id.type === "chalet") {
            if (payment._id.paymentType === "نقدي") chaletRevenue.cash += payment.total;
            if (payment._id.paymentType === "تحويل بنكي") chaletRevenue.bankTransfer += payment.total;
            if (payment._id.paymentType === "شبكة") chaletRevenue.insurance += payment.total;
        }
    });

   // ✅ معالجة النتائج الجديدة للمصروفات
const expensesDetailed = expensesDetailedRaw.map(item => ({
    type: item._id.type || "غير معروف",
    paymentMethod: item._id.paymentMethod || "غير محدد",
    amount: item.totalAmount
}));
const totalExpenses = expensesDetailedRaw.reduce((sum, item) => sum + item.totalAmount, 0);
    // 6. حساب الإجماليات النهائية
    const totalCash = hallRevenue.cash + chaletRevenue.cash;
    const totalBankTransfer = hallRevenue.bankTransfer + chaletRevenue.bankTransfer;
    const totalInsurance = hallRevenue.insurance + chaletRevenue.insurance;
    const totalHallRevenue = hallRevenue.cash + hallRevenue.bankTransfer + hallRevenue.insurance;
    const totalChaletRevenue = chaletRevenue.cash + chaletRevenue.bankTransfer + chaletRevenue.insurance;
    const totalRevenue = totalHallRevenue + totalChaletRevenue;
    const netRevenue = totalRevenue - totalExpenses;

    // 7. إرسال الاستجابة الكاملة
    res.send({
      expenses: expensesDetailed,
      hallRevenue,
      chaletRevenue,
      totalHallRevenue,
      totalChaletRevenue,
      totalRevenue,
      totalCash,
      totalBankTransfer,
      totalInsurance,
      totalExpenses,
      netRevenue,
    });

  } catch (error) {
    console.error("❌ خطأ في getFinancialReport:", error.message);
    res.status(500).send({ error: error.message });
  }
};
// 2. دالة حفظ التقرير
exports.saveReport = async (req, res) => {
    const { totalIncome, totalExpenses, netRevenue } = req.body;
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: '⚠️ صيغة التاريخ المستلمة غير صالحة.' });
    }

    try {
        const existingReport = await Report.findOne({ startDate, endDate });
        if (existingReport) {
            return res.status(400).json({ message: '⚠️ هذا التقرير محفوظ من قبل' });
        }
        
        const report = new Report({ startDate, endDate, totalIncome, totalExpenses, netRevenue });
        await report.save();
        res.status(201).json({ message: "✅ تم حفظ التقرير بنجاح", report });
    } catch (err) {
        console.error("❌ خطأ في حفظ التقرير:", err);
        res.status(500).json({ error: "حدث خطأ أثناء حفظ التقرير", details: err.message });
    }
};

// 3. دالة جلب كل التقارير المحفوظة
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ startDate: -1 });
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({ error: "حدث خطأ أثناء جلب التقارير", details: err.message });
    }
};

exports.getAllReservationsWithPayments = async (req, res) => {
  try {
    const { paymentType, startDate, endDate } = req.body;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.$gte = new Date(startDate);
      dateFilter.$lte = new Date(endDate);
    }

    // ✅ تم تغيير اسم المتغير هنا إلى "reservations"
    const reservations = await Reservation.aggregate([
      // ... (كل مراحل الـ aggregate تبقى كما هي بدون تغيير)
      {
        $lookup: { from: "reservation-payments", localField: "_id", foreignField: "reservation", as: "paymentDetails" }
      },
      {
        $match: { "paymentDetails.0": { $exists: true } }
      },
      {
        $addFields: {
          filteredPayments: {
            $filter: {
              input: "$paymentDetails",
              as: "payment",
              cond: {
                $and: [
                  paymentType && paymentType !== "جميع التقارير" ? { $eq: ["$$payment.type", paymentType] } : {},
                  startDate && endDate ? {
                    $and: [
                      { $gte: [{ $toDate: "$$payment.paymentDate" }, dateFilter.$gte] },
                      { $lte: [{ $toDate: "$$payment.paymentDate" }, dateFilter.$lte] },
                    ]
                  } : {}
                ]
              }
            }
          }
        }
      },
      {
        $match: { "filteredPayments.0": { $exists: true } }
      },
      {
        $unwind: "$filteredPayments"
      },
       // -- ✅ بداية الإضافات الجديدة لجلب اسم البنك --
      
      // ⭐ الخطوة الإضافية والمهمة: تحويل ID البنك من نص إلى ObjectId
      {
        $addFields: {
          bankObjectId: { 
            $cond: { // شرط للتحقق من وجود حقل البنك قبل محاولة تحويله
               if: { $ne: [ "$filteredPayments.bank", null ] }, 
               then: { $toObjectId: "$filteredPayments.bank" }, 
               else: null 
            }
          }
        }
      },

      // جلب اسم البنك باستخدام الـ ObjectId المحوّل
      {
        $lookup: {
          from: "bankdetails", // تأكد أن هذا هو اسم جدول البنوك الصحيح
          localField: "bankObjectId", // استخدام الحقل الجديد الذي قمنا بتحويله
          foreignField: "_id",
          as: "bankInfo"
        }
      },
      {
        $unwind: { path: "$bankInfo", preserveNullAndEmptyArrays: true }
      },
{
        $lookup: {
          from: "employees",
          localField: "filteredPayments.employee",
          foreignField: "_id",
          as: "employeeInfo"
        }
      },
      {
        $unwind: {
          path: "$employeeInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: "$_id",
          contractNumber: "$contractNumber",
          paymentContractNumber: "$filteredPayments.paymentContractNumber",
          type: "$type",
          client: "$client",
          entity: "$entity",
          totalCost: "$cost",
          totalPaid: "$filteredPayments.paid",
          remainingAmount: { $subtract: ["$cost", "$filteredPayments.paid"] },
          paymentType: "$filteredPayments.type",
          paymentDate: "$filteredPayments.paymentDate",
         
          // كائن الموظف منفصل
          employee: {
            _id: "$employeeInfo._id",
            name: { $ifNull: [ "$employeeInfo.name", "غير محدد" ] }
          },

          // ✅ اسم البنك أصبح حقلاً مستقلاً هنا
          bankName: { $ifNull: [ "$bankInfo.name", "غير محدد" ] }
        
        }
      }
    ]);

    // ✅ الآن اسم المتغير صحيح ومتوافق
    res.send({ reservations });

  } catch (error) {
    console.error("Error in getAllReservationsWithPayments:", error.message);
    res.status(500).send({ error: error.message });
  }
};



// ✅ دالة جديدة لجلب حركات الخزنة العامة
exports.getTreasuryTransactionsForReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const transactions = await CashTransaction.find({ paymentDate: dateFilter })
      .sort({ paymentDate: -1 })
      .populate("employee", "name");

    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ خطأ في جلب حركات الخزنة:", error.message);
    res.status(500).send({ error: error.message });
  }
};

exports.getHandoverTrace = async (req, res) => {
  try {
    // ✅ 1. استقبال التواريخ من الطلب
    const { startDate, endDate } = req.query;

    // إنشاء فلتر التاريخ. سنبحث بتاريخ المراجعة (receivedAt)
    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    // ✅ 2. تطبيق فلترة التاريخ على الورديات المصدر
    const sourceShifts = await ShiftClosure.find({ 
      received: true, 
      remainingBalance: { $ne: 0, $exists: true },
      receivedAt: dateFilter // تطبيق الفلتر هنا
    }).populate('employee', 'name').sort({ shiftEnd: -1 });

    const carryoverTransactions = await CashTransaction.find({
      details: /رصيد مُرحّل من وردية رقم/
    }).populate('employee', 'name').populate('shiftClosure', 'shiftNumber');

    const handoverReceipts = await CashTransaction.find({
      type: "تسليم وردية"
    }).populate('employee', 'name');

    // ... باقي الكود لربط البيانات كما هو ...
    const traceData = sourceShifts.map(source => {
      const receivingTransaction = carryoverTransactions.find(t => t.details.includes(`رقم ${source.shiftNumber}`));
      const handoverReceipt = handoverReceipts.find(r => r.details.includes(`وردية #${source.shiftNumber}`));
      
      let receivedBy = 'لم يتم ترحيله بعد';
      let receivingShiftNumber = 'N/A';
      const managerWhoReceived = handoverReceipt?.employee?.name || 'غير محدد';

      if (receivingTransaction) {
        receivedBy = receivingTransaction.employee?.name || 'غير معروف';
        if (receivingTransaction.shiftClosure) {
          receivingShiftNumber = receivingTransaction.shiftClosure.shiftNumber;
        } else {
          receivingShiftNumber = 'وردية مفتوحة';
        }
      }
      
      return {
        _id: source._id,
        sourceShiftNumber: source.shiftNumber,
        handedOverBy: source.employee?.name || 'غير معروف',
        amountReceivedByManager: source.amountReceived,
        remainingBalance: source.remainingBalance,
        handoverDate: source.receivedAt,
        managerWhoReceived: managerWhoReceived,
        receivedBy: receivedBy,
        receivingShiftNumber: receivingShiftNumber,
      };
    });

    res.status(200).json(traceData);

  } catch (error) {
    console.error("❌ خطأ في تتبع الأرصدة:", error.message);
    res.status(500).send({ error: error.message });
  }
};

// ✅ دالة جديدة لتجميع الإيرادات حسب البنك
exports.getBankRevenueSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const bankRevenues = await ReservationPayments.aggregate([
      // 1. فلترة الدفعات لتشمل فقط التحويلات البنكية خلال الفترة المحددة
      {
        $match: {
          type: "تحويل بنكي",
          bank: { $ne: null }, // تجاهل الدفعات التي لا تحتوي على بنك
          paymentDate: dateFilter,
        },
      },
      // 2. تحويل حقل البنك من نص إلى ObjectId للربط
      {
        $addFields: {
          bankId: { $toObjectId: "$bank" }
        }
      },
      // 3. جلب اسم البنك من جدول تفاصيل البنوك
      {
        $lookup: {
          from: "bankdetails", // ⚠️ تأكد أن هذا هو اسم جدول (collection) البنوك لديك
          localField: "bankId",
          foreignField: "_id",
          as: "bankInfo",
        },
      },
      // 4. فك مصفوفة بيانات البنك
      {
        $unwind: "$bankInfo",
      },
      // 5. تجميع الإيرادات حسب اسم البنك
      {
        $group: {
          _id: "$bankInfo.name", // التجميع باسم البنك
          totalRevenue: { $sum: "$paid" }, // حساب مجموع الإيرادات
        },
      },
      // 6. تجهيز الشكل النهائي للبيانات
      {
        $project: {
          _id: 0,
          bankName: "$_id",
          totalRevenue: "$totalRevenue",
        },
      },
      // 7. ترتيب النتائج
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.status(200).json(bankRevenues);

  } catch (error) {
    console.error("❌ خطأ في getBankRevenueSummary:", error.message);
    res.status(500).send({ error: error.message });
  }
};


// ✅ دالة جديدة لتجميع المصروفات حسب البنك
exports.getBankExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const bankExpenses = await Expenses.aggregate([
      // 1. فلترة المصروفات لتشمل فقط المدفوعة من بنك خلال الفترة المحددة
      {
        $match: {
          billType: { $in: ["بنكي", "تحويل بنكي"] }, // أو القيمة التي تستخدمها للدفع البنكي
          bank: { $ne: null, $exists: true }, // التأكد من وجود حقل البنك
          date: dateFilter,
        },
      },
      // 2. تحويل حقل البنك من نص إلى ObjectId للربط
      {
        $addFields: {
          bankObjectId: { $toObjectId: "$bank" }
        }
      },
      // 3. جلب اسم البنك من جدول تفاصيل البنوك
      {
        $lookup: {
          from: "bankdetails", // ⚠️ تأكد أن هذا هو اسم جدول البنوك
          localField: "bankObjectId",
          foreignField: "_id",
          as: "bankInfo",
        },
      },
      // 4. فك مصفوفة بيانات البنك
      {
        $unwind: "$bankInfo",
      },
      // 5. تجميع المصروفات حسب اسم البنك
      {
        $group: {
          _id: "$bankInfo.name", // التجميع باسم البنك
          totalExpenses: { $sum: "$amount" }, // حساب مجموع المصروفات
        },
      },
      // 6. تجهيز الشكل النهائي للبيانات
      {
        $project: {
          _id: 0,
          bankName: "$_id",
          totalExpenses: "$totalExpenses",
        },
      },
      // 7. ترتيب النتائج
      {
        $sort: { totalExpenses: -1 }
      }
    ]);

    res.status(200).json(bankExpenses);

  } catch (error) {
    console.error("❌ خطأ في getBankExpenseSummary:", error.message);
    res.status(500).send({ error: error.message });
  }
};
// ✅ دالة جديدة لتجميع ملخص الورديات لكل موظف
exports.getShiftSummaryByEmployee = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };

    const shiftSummary = await ShiftClosure.aggregate([
      // 1. فلترة الورديات التي انتهت خلال الفترة المحددة
      {
        $match: {
          shiftEnd: dateFilter,
        },
      },
      // 2. ترتيب الورديات تصاعدياً
      {
        $sort: { shiftNumber: 1 }
      },
      // 3. تجميع الورديات حسب الموظف
      {
        $group: {
          _id: "$employee", // التجميع بـ ID الموظف
          shiftCount: { $sum: 1 }, // حساب عدد الورديات
          shiftNumbers: { $push: "$shiftNumber" }, // تجميع أرقام الورديات في مصفوفة
          totalIncome: { $sum: "$totalIncome" }, // جمع إجمالي الدخل
          totalExpenses: { $sum: "$totalExpenses" }, // جمع إجمالي المصروفات
          totalClosingBalance: { $sum: "$closingBalance" }, // جمع إجمالي رصيد الإغلاق
        },
      },
      // 4. جلب اسم الموظف من جدول الموظفين
      {
        $lookup: {
          from: "employees", // ⚠️ تأكد أن هذا هو اسم جدول الموظفين
          localField: "_id",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      // 5. تجهيز الشكل النهائي للبيانات
      {
        $project: {
          _id: 0,
          employeeName: { $arrayElemAt: ["$employeeInfo.name", 0] }, // استخلاص اسم الموظف
          shiftCount: "$shiftCount",
          shiftNumbers: "$shiftNumbers",
          totalIncome: "$totalIncome",
          totalExpenses: "$totalExpenses",
          totalClosingBalance: "$totalClosingBalance",
        },
      },
    ]);

    res.status(200).json(shiftSummary);

  } catch (error) {
    console.error("❌ خطأ في getShiftSummaryByEmployee:", error.message);
    res.status(500).send({ error: error.message });
  }
};