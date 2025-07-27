const mongoose = require("mongoose");

const bankTransactionsSchema = new mongoose.Schema({
  bank: { type: String, required: true }, // اسم البنك
  amount: { type: Number, required: true }, // المبلغ المحول
  reciver: { type: String }, // المستلم
  donater: { type: String }, // المرسل
  employee: { type: String }, // الموظف المسؤول
  date: { type: String, required: true }, // تاريخ المعاملة
});

const BankTransactions = mongoose.model("banktransactions", bankTransactionsSchema);
module.exports = BankTransactions;
