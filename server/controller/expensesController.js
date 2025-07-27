// server/controller/expensesController.js
const Expenses = require('../model/expenses');
const { expensesValidation } = require('../validation/financeValidation');
const CashTransaction = require('../model/cashTransaction');
const path = require('path');


// دالة جلب كل المصروفات
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expenses.find({})
      .populate('employee', 'name') // جلب اسم الموظف المرتبط بالمصروف
      .sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "خطأ بالخادم عند جلب المصروفات" });
  }
};




const createNewExpense = async (req, res) => {
  try {
    const { type, month, year, employee, reciver, billType, amount, note } = req.body;

    // --- 1. Salary validation etc. ---
    if (type === "Salaries") {
      if (!employee || !month || !year) {
        return res.status(400).json({ message: "Employee, month, and year are required for salaries." });
      }
      const existingSalary = await Expenses.findOne({
        type: "Salaries",
        employee: employee,
        month: parseInt(month),
        year: parseInt(year),
      });
      if (existingSalary) {
        return res.status(409).json({ message: "This salary has already been paid." });
      }
    }

    // --- 2. Prepare expense data ---
    const newExpenseData = {
      ...req.body,
      // employee: type === "Salaries" ? employee : req.user._id, 
    };
    
    // ✅✅✅ هذا هو الجزء الأهم الذي كان مفقوداً ✅✅✅
    // تحقق إذا كان middleware الرفع قد أضاف ملفاً إلى الطلب
    if (req.file && req.file.filename) {
      // أضف اسم الملف إلى البيانات التي سيتم حفظها
      newExpenseData.bill = req.file.filename;
    }
    
    // --- 3. Save the complete record to the database ---
    const savedExpense = await Expenses.create(newExpenseData);

    // --- 4. Link to Treasury if it's a Cash Payment ---
    if (billType === 'نقدي') {
      const treasuryWithdrawal = new CashTransaction({
        type: 'سحب',
        amount: savedExpense.amount,
        details: note || `مصروف ${type} للمستلم: ${reciver}`,
        employee: req.user._id,
      });
      await treasuryWithdrawal.save();
    }

    res.status(200).json({ success: true, data: savedExpense, message: "تم الصرف بنجاح" });


  } catch (error) {
    console.error('❌ Error creating expense:', error);
    res.status(500).json({ message: "An unexpected server error occurred" });
  }
};

// 3. دالة تعديل مصروف
const updateExistingExpense = async (req, res) => {
    try {
        const expense = await Expenses.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!expense) return res.status(404).json({ message: "المصروف غير موجود" });
        res.status(200).json(expense);
    } catch (error) {
        res.status(400).json({ message: "خطأ في تحديث البيانات", error: error.message });
    }
};

// 4. دالة حذف مصروف
const deleteExistingExpense = async (req, res) => {
    try {
        const expense = await Expenses.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: "المصروف غير موجود" });
        await expense.remove();
        res.status(200).json({ message: "تم الحذف بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "خطأ في الخادم عند الحذف", error: error.message });
    }
};

module.exports = {
  getAllExpenses,
  createNewExpense,
  updateExistingExpense,
  deleteExistingExpense,
};