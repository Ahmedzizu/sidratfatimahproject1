const mongoose = require("mongoose");

const expensesSchema = new mongoose.Schema({
  type: { type: String, required: [true, 'نوع المصروف مطلوب'] },
  amount: { type: Number, required: [true, 'قيمة المصروف مطلوبة'], min: [0, 'القيمة يجب أن تكون موجبة'] },
  billType: { type: String, required: [true, 'نوع الفاتورة مطلوب'] },
  reciver: { type: String, required: [true, 'المستلم مطلوب'] },
  date: { type: Date, required: [true, 'التاريخ مطلوب'], default: Date.now },
   bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'bankdetails', 
   
    required: function() { return this.billType === 'بنكي' || this.billType === 'تحويل بنكي'; } 
  },
  bill: { type: String },
  guarantee: { type: String, enum: ['بضمان', 'بدون ضمان'] },
  note: { type: String },
 addedByEmployeeName: { type: String },
//  createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', // ⚠️ تأكد أن 'User' هو اسم الموديل الصحيح للمستخدمين/الموظفين
//   },

  // ✅ لحالات الرواتب
  isSalaryPaid: {
    type: Boolean,
    default: false
  },
  salaryPaidAt: {
    type: Date,
    default: null
  },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'employee' // تأكد أن 'Employee' هو اسم الموديل الصحيح للموظفين
},

 month: { type: Number, required: function () { return this.type === "Salaries"; } },
year: { type: Number, required: function () { return this.type === "Salaries"; } },




}, { timestamps: true });


// ✅ إنشاء فهرس فريد فقط للرواتب المصروفة
expensesSchema.index(
  { employee: 1, type: 1, month: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "Salaries",
      isSalaryPaid: true
    }
  }
);

const Expenses = mongoose.model("expenses", expensesSchema);
module.exports = Expenses;
