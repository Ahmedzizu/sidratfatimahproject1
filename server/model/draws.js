const mongoose = require("mongoose");

const drawsSchema = new mongoose.Schema({
  type: { type: String, required: true }, // نوع السحب
  amount: { type: Number, required: true }, // قيمة السحب
  employee: { type: String }, // الموظف المسؤول
  date: { type: String, required: true }, // تاريخ السحب
  note: { type: String }, // ملاحظات
});

// تحقق إذا كان الموديل موجودًا مسبقًا، إذا كان موجودًا استخدمه، وإذا لم يكن موجودًا قم بتعريفه
const Draws = mongoose.models.draws || mongoose.model("draws", drawsSchema);

module.exports = Draws;
