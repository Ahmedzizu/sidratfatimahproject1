const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hallSchema = new Schema({
  name: { type: String, trim: true, required: true },
  images: [{ type: String }],  // ✅ مسارات صور
  videos: [{ type: String }],  // ✅ مسارات فيديو
  rooms: { type: Number, required: true },
  halls: { type: Number, required: true },
  dayStartHour: { type: String, trim: true, required: true },
  dayEndHour: { type: String, trim: true, required: true },
  nightStartHour: { type: String, trim: true, required: true },
  nightEndHour: { type: String, trim: true, required: true },
  price: {
    morning: { type: Number, required: true },
    night: { type: Number, required: true },
    wholeDay: { type: Number, required: true },
  },
  capacity: { type: Number, required: true },
  rate: { type: Number, min: 1, max: 5, default: 3 }, // ✅ تصنيف بين 1 و 5
  details: [{ type: String, trim: true }], // ✅ مصفوفة خصائص القاعة
  maintenance: { type: Boolean, default: false } // ✅ حقل الصيانة (افتراضيًا `false`)
});

const Hall = mongoose.model("Hall", hallSchema);
module.exports = Hall;
