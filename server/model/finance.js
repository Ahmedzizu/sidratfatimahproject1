const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// expenses model
const expensesSchema = new Schema({
  type: { type: String, trim: true, required: true },
  amount: { type: Number, trim: true, required: true },
  billType: { type: String, trim: true, required: true },
  reciver: { type: String, trim: true, required: true },
  date: { type: String, trim: true, required: true },
  bill: { type: String, trim: true },
});
const Expenses = mongoose.models.expenses || mongoose.model("expenses", expensesSchema);

// paypal model
const paypalSchema = new Schema({
  bank: { type: String, trim: true, required: true },
  amount: { type: Number, trim: true, required: true },
  reciver: { type: String, trim: true, required: true },
  donater: { type: String, trim: true, required: true },
  employee: { type: String, trim: true, required: true },
  date: { type: String, trim: true, required: true },
});
const Paypal = mongoose.models.paypal || mongoose.model("paypal", paypalSchema);

// draws model
const drawsSchema = new Schema({
  type: { type: String, trim: true, required: true },
  amount: { type: Number, trim: true, required: true },
  employee: { type: String, trim: true, required: true },
  date: { type: String, trim: true, required: true },
  note: { type: String, trim: true, default: "لا يوجد" },
});
const Draws = mongoose.models.draws || mongoose.model("draws", drawsSchema);

// onlinePayment model
const onlinePaymentSchema = new Schema({
  bank: { type: String, trim: true, required: true },
  amount: { type: Number, trim: true, required: true },
  reciver: { type: String, trim: true, required: true },
  donater: { type: String, trim: true, required: true },
  employee: { type: String, trim: true, required: true },
  date: { type: String, trim: true, required: true },
});
const OnlinePayment = mongoose.models.onlinePayment || mongoose.model("onlinePayment", onlinePaymentSchema);

// bankTransaction model
const bankTransactionSchema = new Schema({
  bank: { type: String, trim: true, required: true },
  amount: { type: Number, trim: true, required: true },
  reciver: { type: String, trim: true, required: true },
  donater: { type: String, trim: true, required: true },
  employee: { type: String, trim: true, required: true },
  date: { type: String, trim: true, required: true },
});
const BankTransaction =
  mongoose.models.bankTransaction ||
  mongoose.model("bankTransaction", bankTransactionSchema);

module.exports = {
  Expenses,
  Paypal,
  Draws,
  OnlinePayment,
  BankTransaction,
};
