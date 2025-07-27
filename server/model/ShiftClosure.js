const mongoose = require('mongoose');

const shiftClosureSchema = new mongoose.Schema({
    shiftNumber: { // ✅ Add this field
    type: Number,
    unique: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'employee',
    required: true,
  },
  totalIncome: Number,
  totalExpenses: Number,
  closingBalance: Number,
  note: String,
  shiftStart: {
    type: Date, // 🕒 وقت البدء
    required: true,
  },
  shiftEnd: {
    type: Date, // 🕓 وقت التقفيل
    default: Date.now,
  },
  workedHours: Number,
  received: {
  type: Boolean,
  default: false,
},
receivedAt: {
  type: Date, // ✅ تاريخ ووقت الاستلام
},
amountReceived: {
  type: Number,
  default: 0,
},// ✅ الحقل الجديد الذي تمت إضافته
  remainingBalance: {
    type: Number,
  },
  // ✅ Add this new flag
  carryoverApplied: {
    type: Boolean,
    default: false,
  },
  receivedByManager: {
  type: Boolean,
  default: false
}

// 🕒 عدد الساعات
}, { timestamps: true });

module.exports = mongoose.model('ShiftClosure', shiftClosureSchema);
