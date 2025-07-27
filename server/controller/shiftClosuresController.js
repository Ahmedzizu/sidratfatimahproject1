// controllers/shiftClosuresController.js
const CashTransaction = require('../model/cashTransaction'); // ✅ مسار الموديل حسب مشروعك


const ShiftClosure = require('../model/ShiftClosure');
const Counter = require('../model/Counter');
const Employee = require('../model/employee'); // Make sure you import your Employee model


/// A helper function to get the next sequence number
async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create the counter if it doesn't exist
  );
  return sequenceDocument.seq;
}

exports.closeShift = async (req, res) => {
    try {
        // لم نعد بحاجة لاستقبال "transactions" من الواجهة الأمامية
        const { employee, totalIncome, totalExpenses, note, shiftStart } = req.body;

        const closingBalance = totalIncome - totalExpenses;
        const shiftNumber = await getNextSequenceValue('shiftClosureId');
        const shiftEndDate = new Date(); // تحديد وقت نهاية الوردية

        // 1. ابحث في قاعدة البيانات عن كل الحركات المفتوحة لهذا الموظف خلال فترة الوردية
        const transactionsToClose = await CashTransaction.find({
            employee: employee,
            includedInShiftClosure: false,
            paymentDate: { $gte: new Date(shiftStart) }
        });
        
        // 2. استخرج الـ IDs الخاصة بهذه الحركات
        const relevantTransactionIds = transactionsToClose.map((t) => t._id);

        // 3. قم بإنشاء سجل إغلاق الوردية الجديد
        const newClosure = await ShiftClosure.create({
            shiftNumber,
            employee,
            totalIncome,
            totalExpenses,
            closingBalance,
            shiftStart: new Date(shiftStart),
            shiftEnd: shiftEndDate,
            workedHours: (shiftEndDate - new Date(shiftStart)) / (1000 * 60 * 60),
            note,
        });

        // 4. تحديث جميع الحركات التي تم العثور عليها وربطها بالوردية الجديدة
        if (relevantTransactionIds.length > 0) {
            await CashTransaction.updateMany(
                { _id: { $in: relevantTransactionIds } },
                { $set: { includedInShiftClosure: true, shiftClosure: newClosure._id } }
            );
        }

        res.status(201).json(newClosure);
    } catch (error) {
        console.error("❌ خطأ أثناء تقفيل الوردية:", error);
        res.status(500).json({ message: "حدث خطأ أثناء تقفيل الوردية", error: error.message });
    }
};




// ✅ دالة جديدة لجلب كل تقفيلات الورديات

exports.getAllClosures = async (req, res) => {
  try {
    const closures = await ShiftClosure.find().sort({ createdAt: -1 }).populate('employee');
    res.status(200).json(closures); // ✅ استخدم closures بعد تعريفه
  } catch (err) {
    console.error("❌ Error fetching shift closures:", err);
    res.status(500).json({ message: "فشل في جلب تقفيلات الورديات" });
  }
};
// ✅ 1. أضف هذه الدالة الجديدة
exports.getLatestClosure = async (req, res) => {
  try {
    const latestClosure = await ShiftClosure.findOne().sort({ createdAt: -1 });

    if (!latestClosure) {
      return res.status(404).json({ message: 'No shift closures found.' });
    }

    res.json(latestClosure);
  } catch (error) {
    console.error('❌ ERROR Fetching Latest Closure:', error);
    res.status(500).json({ message: 'Server error while fetching latest closure' });
  }
};


// ... other controller functions

// ✅ Add this new function to the end of the file// ✅ Correct way to get transactions for a specific shift closure
exports.getTransactionsForShift = async (req, res) => {
  try {
    const { id } = req.params; // This is the ID of the shift closure

    // Find all cash transactions that are directly linked to this shift closure ID
    const transactions = await CashTransaction.find({ shiftClosure: id });

    if (!transactions) {
      return res.status(404).json({ message: "No transactions found for this shift" });
    }

    res.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions for shift:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.markAsReceived = async (req, res) => {
    console.log('--- [MANAGER ACTION] Marking shift as received ---');
    try {
        const { id } = req.params;
        const { amountReceived, managerId } = req.body;
        console.log(`Step 1: Finding shift with ID: ${id} to mark as received.`);

        const closure = await ShiftClosure.findById(id).populate('employee');

        if (!closure) {
            console.log('[MANAGER ACTION] Error: Shift not found.');
            return res.status(404).json({ message: "تقفيل الوردية غير موجود" });
        }
        console.log('[MANAGER ACTION] Step 2: Found shift. Current closingBalance:', closure.closingBalance);
        
        const remainingBalance = closure.closingBalance - amountReceived;
        console.log(`[MANAGER ACTION] Step 3: Received amount: ${amountReceived}. Calculated remainingBalance: ${remainingBalance}`);

        // تحديث بيانات الوردية
        closure.received = true;
        closure.receivedAt = new Date();
        closure.amountReceived = amountReceived;
        closure.remainingBalance = remainingBalance;
 closure.receivedByManager = true
        // إذا كان هناك عجز، قم بتحديث carryoverApplied قبل الحفظ الأول
        if (remainingBalance < 0) {
            closure.carryoverApplied = true;
            console.log('[MANAGER ACTION] Deficit detected. Marked carryover as applied.');
        }
        
        // احفظ كل التغييرات على الوردية مرة واحدة
        const updatedClosure = await closure.save();
        console.log('[MANAGER ACTION] Step 4: Closure updated.');

        // --- ✅ هذا هو الكود الذي تم إضافته لحل المشكلة ---
        // تحديث كل الحركات المالية المرتبطة بالوردية إلى "مستلمة"
        await CashTransaction.updateMany(
            { shiftClosure: closure._id },
            { $set: { receivedByManager: true } }
        );
        console.log('[MANAGER ACTION] Step 5: All related transactions are now marked as received.');
        // --- نهاية الإضافة ---

        // // إذا كان هناك عجز، قم بإنشاء حركة السحب الآن بعد التأكد من حفظ الوردية
        // if (remainingBalance < 0) {
        //     console.log('[MANAGER ACTION] Creating withdrawal transaction for the deficit.');
        //     await CashTransaction.create({
        //         type: 'سحب',
        //         amount: Math.abs(remainingBalance),
        //         employee: closure.employee._id,
        //         paymentDate: new Date(),
        //         details: `تسوية عجز من وردية رقم ${closure.shiftNumber}`,
        //         includedInShiftClosure: false,
        //         receivedByManager: false
        //     });
        // }
        
        // إنشاء حركة "تسليم وردية" في الخزنة الرئيسية
        if (amountReceived >= 0) {
            let detailsText = `تسليم وردية #${closure.shiftNumber} من الموظف: ${closure.employee.name}.`;
            if (remainingBalance !== 0) {
                detailsText += ` | رصيد متبقٍ: ${remainingBalance.toFixed(2)} ريال`;
            }

            await CashTransaction.create({
                type: 'تسليم وردية',
                amount: amountReceived,
                details: detailsText,
                paymentDate: new Date(),
                employee: managerId, 
            });
            console.log(`[MANAGER ACTION] Step 6: Created a 'Shift Handover' transaction of ${amountReceived} in the main treasury.`);
        }

        console.log('--- [MANAGER ACTION END] ---');

        res.json(updatedClosure);
    } catch (err) {
        console.error("❌ FATAL ERROR in markAsReceived:", err);
        res.status(500).json({ message: "حدث خطأ أثناء التحديث" });
    }
};


exports.applyCarryover = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);

 
    if (!employee || !employee.permissions?.canReceiveCarryover) {
      return res.status(200).json({ created: false, message: 'No carryover applied (user lacks permission).' });
    }

    // إذا كان لديه الصلاحية، أكمل المنطق كالمعتاد
    const claimedShift = await ShiftClosure.findOneAndUpdate(
      {
        remainingBalance: { $exists: true, $gt: 0 },
        carryoverApplied: { $ne: true },
      },
      { 
        $set: { carryoverApplied: true },
      },
      { 
        sort: { createdAt: 1 },
        new: true 
      }
    ).populate('employee');

    if (claimedShift) {
      const newTransaction = await CashTransaction.create({
        employee: employeeId,
        type: 'تسوية رصيد',
        amount: claimedShift.remainingBalance,
        details: `رصيد مُرحّل من وردية رقم ${claimedShift.shiftNumber} للموظف ${claimedShift.employee.name}`,
        paymentDate: new Date(),
      });

      return res.status(200).json({ created: true, transaction: newTransaction });
    }

    res.status(200).json({ created: false, message: 'No carryover to apply.' });
  } catch (error) {
    console.error("❌ Error applying carryover:", error);
    res.status(500).json({ message: "Server error during carryover check." });
  }
};
