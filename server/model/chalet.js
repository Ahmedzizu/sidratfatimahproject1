const mongoose = require("mongoose");

const ChaletSchema = new mongoose.Schema({
    name: String,
    images: [String],
    videos: [String],
    details: [String],
    maintenance: { type: Boolean, default: false },
    area: Number,
    address: String,
    sleeping: Number,
    lounge: Number,
    kitchen: Number,
    bath: Number,
    price: {
      morning: Number,
      night: Number,
      wholeDay: Number
    },
    dayStartHour: String,
    dayEndHour: String,
    nightStartHour: String,
    nightEndHour: String
});

const Chalet = mongoose.model("chalets", ChaletSchema);

module.exports = Chalet;
