// In model/onlinePayment.js

const mongoose = require("mongoose");

const onlinePaymentSchema = new mongoose.Schema({
    bank: { type: String, required: true },
    amount: { type: Number, required: true },
    reciver: { type: String, required: true },
    donater: { type: String, required: true },
    employee: { type: String }, // Storing name as a string
    date: { type: String, required: true },
});

// Define the model with a capital 'O'
const OnlinePayment = mongoose.models.onlinepayments || mongoose.model("onlinepayments", onlinePaymentSchema);

// ✅✅ Export with the same correct name (capital 'O')
module.exports = OnlinePayment;