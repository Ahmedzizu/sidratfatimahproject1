const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { format } = require("date-fns");

const reservationServices = new Schema({
  reservationId: {
    type: Schema.Types.ObjectId,
    ref: "reservations",
    required: true,
  },
  service: { type: String, required: true, trim: true },
  number: { type: Number, default: 1 },
  price: { type: Number, trim: true, default: 0 },
  note: { type: String, trim: true },
  package: { type: String, trim: true },
  type: { type: String, required: true }, // service,free,request
  statement: { type: String, trim: true },
  date: { type: String, trim: true, default: format(new Date(), "yyyy-MM-dd") },
});


const ReservationServices = mongoose.model(
  "reservationServices",
  reservationServices
);
module.exports = ReservationServices;
