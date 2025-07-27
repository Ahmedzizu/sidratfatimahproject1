const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },  // كود الخصم
    discount: { type: Number, required: true },  // نسبة الخصم %
    expiryDate: { type: Date, required: true },  // تاريخ انتهاء الصلاحية
    maxUsers: { type: Number, required: true },  // الحد الأقصى للاستخدام
    usedBy: { type: [String], default: [] }  // المستخدمون الذين استخدموا الكود
});
const Discount = mongoose.model("Discount", discountSchema);
module.exports = Discount;
