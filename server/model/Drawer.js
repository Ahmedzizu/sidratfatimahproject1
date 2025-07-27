const mongoose = require("mongoose");

const drawerHistorySchema = new mongoose.Schema({
employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
shiftStart: { type: Date, required: true },
shiftEnd: { type: Date },
reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // المدير الذي راجع
finalBalance: { type: Number }, // الرصيد النهائي للوردية
remainingAfterReview: { type: Number }, // المتبقي بعد المراجعة
}, { _id: false });

const drawerSchema = new mongoose.Schema({
name: { // مثل: "الدرج الرئيسي"، "درج الكاشير 2"
type: String,
required: true,
unique: true,
},
balance: { // الرصيد الحالي للدرج
type: Number,
required: true,
default: 0,
},
isActive: { // هل الدرج قيد الاستخدام حالياً؟
type: Boolean,
default: false,
},
currentEmployee: { // الموظف الذي يستخدم الدرج حالياً
type: mongoose.Schema.Types.ObjectId,
ref: 'employee',
default: null,
},
history: [drawerHistorySchema], // سجل يوثق كل من استخدم الدرج
}, { timestamps: true });

module.exports = mongoose.model('Drawer', drawerSchema);