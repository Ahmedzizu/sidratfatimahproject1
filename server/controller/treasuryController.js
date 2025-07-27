const mongoose = require('mongoose');
const ShiftClosure = require('../model/ShiftClosure');
const CashTransaction = require('../model/cashTransaction');

/**
 * @desc    جلب كل حركات الخزنة الرئيسية وعرض الرصيد الإجمالي
 * @route   GET /api/treasury/transactions
 * @access  Private
 */



exports.getTreasuryTransactions = async (req, res) => {
    try {
        const allTransactions = await CashTransaction.find({})
            .populate('employee', 'name')
            .populate('drawer', 'name')
            .populate('shiftClosure', 'shiftNumber')
            .sort({ paymentDate: -1 });

        // --- ✅ الحساب الأول: الرصيد الإجمالي (Grand Total) ---
        // المنطق النهائي: يُحسب من المبالغ المستلمة والمصروفات للورديات المراجعة فقط
        
        const reviewedShifts = await ShiftClosure.find({ receivedByManager: true });

        // الإيرادات الحقيقية هي المبالغ التي استلمها المدير بالفعل
        const grandTotalIncome = reviewedShifts.reduce((sum, shift) => sum + shift.closingBalance, 0);
        // المصروفات الحقيقية هي مصروفات الورديات المراجعة
        const grandTotalExpenses = reviewedShifts.reduce((sum, shift) => sum + shift.remainingBalance, 0);
        
        let grandTotalBalance = grandTotalIncome - grandTotalExpenses;
        const totalDeficit = reviewedShifts
    .filter(shift => shift.closingBalance < 0) // نختار الورديات التي بها عجز فقط
    .reduce((sum, shift) => sum + shift.closingBalance, 0); 
    if (totalDeficit < 0) {
    grandTotalBalance += totalDeficit;
}

console.log(`[TREASURY] Grand Total Balance after deficit adjustment: ${grandTotalBalance}`);

        

        // --- ✅ الحساب الثاني: الرصيد النشط (Active Balance) ---
        const unreviewedShifts = await ShiftClosure.find({ receivedByManager: false });
        let activeBalance = unreviewedShifts.reduce((sum, shift) => sum + shift.closingBalance, 0);

        const newActiveTransactions = allTransactions.filter(t => 
            !t.includedInShiftClosure && 
            !t.details.includes("تسوية عجز من وردية رقم")
        );
        
        const newIncome = newActiveTransactions.filter(t => t.type === 'إيداع' || t.type === 'تسوية رصيد').reduce((sum, t) => sum + t.amount, 0);
        const newExpenses = newActiveTransactions.filter(t => t.type === 'سحب').reduce((sum, t) => sum + t.amount, 0);
        activeBalance += (newIncome - newExpenses);
        console.log(`[TREASURY] Active Balance (Unreviewed Shifts + New Transactions): ${activeBalance}`);

        // --- ✅ الحساب الثالث: العهدة المعلقة (Unclaimed Carryover) ---
        const pendingCarryovers = await ShiftClosure.find({
            remainingBalance: { $gt: 0 },
            carryoverApplied: false
        });
        const unclaimedCarryover = pendingCarryovers.reduce((sum, shift) => sum + shift.remainingBalance, 0);
        console.log(`[TREASURY] Unclaimed Carryover: ${unclaimedCarryover}`);

        res.status(200).json({
            transactions: allTransactions,
            currentBalance: activeBalance,
            grandTotalBalance: grandTotalBalance,
            unclaimedCarryover: unclaimedCarryover
        });

    } catch (error) {
        console.error("❌ Error fetching treasury data:", error);
        res.status(500).json({ message: "خطأ في جلب بيانات الخزنة", error: error.message });
    }
};

/**
 * @desc    إضافة حركة نقدية جديدة (إيداع أو سحب)
 * @route   POST /api/treasury
 * @access  Private
 */
exports.addCashTransaction = async (req, res) => {
  try {
    const transactionData = { ...req.body };
    transactionData.includedInShiftClosure = false;
    
    const newTransaction = await CashTransaction.create(transactionData);
    res.status(201).json(newTransaction);
    
  } catch (err) {
    console.error("❌ Error saving transaction:", err);
    res.status(500).json({ message: "فشل في حفظ العملية" });
  }
};

/**
 * @desc    جلب بيانات خزنة موظف معين (الرصيد السابق والحركات المفتوحة)
 * @route   GET /api/treasury/employee-treasury/:employeeId
 * @access  Private
 */
exports.getEmployeeTreasury = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const lastClosure = await ShiftClosure.findOne({
      employee: employeeId,
    }).sort({ shiftEnd: -1 });

    let previousBalance = 0;
    let startDateForNewTransactions = new Date(0);

    if (lastClosure) {
      previousBalance = lastClosure.closingBalance;
      startDateForNewTransactions = lastClosure.shiftEnd;
    }
    
    const transactions = await CashTransaction.find({
      employee: employeeId,
      includedInShiftClosure: false,
      paymentDate: { $gt: startDateForNewTransactions }
    }).sort({ paymentDate: 'asc' });

    res.status(200).json({
      transactions,
      previousRemainingBalance: previousBalance,
    });

  } catch (err) {
    console.error("❌ Error in getEmployeeTreasury:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * @desc    مراجعة تقفيل وردية وتحديث حالتها وحالة حركاتها
 * @route   PUT /api/treasury/review-shift/:shiftId
 * @access  Private (Manager only)
 */
exports.reviewShiftClosure = async (req, res) => {
    const session = await mongoose.startSession(); 
    session.startTransaction();
    try {
        const { shiftId } = req.params;
        const updatedShift = await ShiftClosure.findByIdAndUpdate(shiftId, 
            { receivedByManager: true }, 
            { new: true, session }
        );

        if (!updatedShift) throw new Error("لم يتم العثور على الوردية");

        await CashTransaction.updateMany(
            { shiftClosure: shiftId },
            { $set: { receivedByManager: true } },
            { session }
        );

        await session.commitTransaction(); 
        res.status(200).json({ message: "تمت مراجعة الوردية بنجاح", shift: updatedShift });
    } catch (error) {
        await session.abortTransaction(); 
        res.status(500).json({ message: "فشل في مراجعة الوردية", error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    تأكيد استلام الرصيد المتبقي من وردية سابقة
 * @route   POST /api/treasury/confirm-handover
 * @access  Private
 */
exports.confirmShiftHandover = async (req, res) => {
    const { previousShiftClosureId, receivingEmployeeId, amountReceived } = req.body;
    if (!previousShiftClosureId || !receivingEmployeeId || amountReceived === undefined) {
        return res.status(400).json({ message: "البيانات المطلوبة غير مكتملة" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const previousShift = await ShiftClosure.findById(previousShiftClosureId).session(session);

        if (!previousShift) throw new Error("لم يتم العثور على الوردية السابقة.");
        if (previousShift.carryoverApplied) throw new Error("هذه الوردية تم تسليمها بالفعل.");
        if (previousShift.remainingBalance !== amountReceived) throw new Error("المبلغ المستلم لا يطابق الرصيد المتبقي.");

        await CashTransaction.findOneAndUpdate(
            { type: "تسليم وردية", details: { $regex: new RegExp(`.*#${previousShift.shiftNumber}.*`) } },
            { $set: { receivedByManager: true } },
            { session }
        );

        await CashTransaction.create([{
            type: "تسوية رصيد",
            amount: amountReceived,
            employee: receivingEmployeeId,
            paymentDate: new Date(),
            details: `رصيد مُرحّل من وردية رقم ${previousShift.shiftNumber}`,
            receivedByManager: false,
            includedInShiftClosure: false
        }], { session });

        previousShift.carryoverApplied = true;
        previousShift.receivedAt = new Date();
        await previousShift.save({ session });

        await session.commitTransaction();
        res.status(200).json({ message: "تم استلام الوردية وتسجيل الرصيد بنجاح." });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "فشل في عملية تسليم الوردية", error: error.message });
    } finally {
        session.endSession();
    }
};
