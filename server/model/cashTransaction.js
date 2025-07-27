// في ملف model/cashTransaction.js
const mongoose = require("mongoose");

const cashTransactionSchema = new mongoose.Schema({
    // نوع الحركة: "إيداع" للدفعات الواردة، "سحب" للمصروفات والمسحوبات
   type: { 
        type: String, 
        required: true, 
        enum: ['إيداع', 'سحب', 'تسليم وردية', 'تسوية رصيد'] 
    },  

    amount: { type: Number, required: true },
     paymentDate: {
    type: Date,
    default: Date.now, // هذه القيمة تضمن تسجيل التاريخ والوقت الحالي تلقائياً
  },

    // تفاصيل توضح مصدر الحركة (مثال: "دفعة من حجز" أو "شراء مستلزمات مكتبية")
    details: { type: String, required: true }, 

    // الموظف الذي قام بالعملية (اختياري)
    employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'employee' // تأكد أن 'Employee' هو اسم الموديل الصحيح للموظفين
},received: {
  type: Boolean,
  default: false,
},
// الدرج الذي تمت فيه هذه الحركة
    drawer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drawer', // يربط بموديل "الدرج"
        default: null, // القيمة الافتراضية "لا يوجد"
    },
shiftClosure: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'ShiftClosure',
  default: null
},
 // ✅ الحقل الجديد والمهم لحل المشكلة
    includedInShiftClosure: {
        type: Boolean,
        default: false
    },
receivedByManager: {
  type: Boolean,
  default: false
}
});

const CashTransaction = mongoose.models.cashtransactions || mongoose.model("cashtransactions", cashTransactionSchema);
module.exports = CashTransaction; 