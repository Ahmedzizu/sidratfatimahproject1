const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { format } = require("date-fns");

const paymentsSchema = new Schema({
    paid: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    type: { type: String, required: true, trim: true },
     paymentDate: {
    type: Date,
    default: Date.now, // هذه القيمة تضمن تسجيل التاريخ والوقت الحالي تلقائياً
  },
     bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankDetails',
},
    reservation: { type: mongoose.Types.ObjectId, ref: "reservations" },
    employee: { type: mongoose.Types.ObjectId, ref: "employee" },
    paymentContractNumber: { type: String }, // ✅ إضافة رقم الإيصال
});



const ReservationPayments = mongoose.model("reservation-payments", paymentsSchema);
module.exports = ReservationPayments;
