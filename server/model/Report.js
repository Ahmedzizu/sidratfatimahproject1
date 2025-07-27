const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalIncome: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  netRevenue: { type: Number, required: true }, // أضفه إذا لزم
},
{ timestamps: true } // ✅ هذا السطر هو المهم
);

module.exports = mongoose.model("Report", reportSchema);