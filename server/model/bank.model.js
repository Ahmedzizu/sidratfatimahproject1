const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bankSchema = new Schema({
  name: { type: String, required: true, trim: true },
  id: { type: Number, required: true, trim: true },
  account: { type: String, required: true, trim: true },
});

const Bank = mongoose.model("BankDetails" , bankSchema)
module.exports = Bank
