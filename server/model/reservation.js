const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    type: { type: String, required: true },
    client: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        nationality: { type: String, required: true },
        idNumber: { type: String, required: true },
        id: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    entity: {
        name: { type: String, required: true },
        id: { type: String, required: true },
    },
    originalCost: { type: Number, required: true },
    cost: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 }, 
    discountPercentage: { type: Number, default: 0 },// ✅ إضافة حقل التخفيض
   
period: {
  type: { type: String, required: true },      // نوع الحجز: 'days' أو 'dayPeriod'
  startDate: { type: String, required: true }, // تاريخ البدء
  endDate: { type: String },                   // تاريخ النهاية

  // يستخدم للحجوزات التي لا تعتمد على فترة دخول وخروج محددة
  dayPeriod: { type: String },                 // مثال: "كامل اليوم"

  // ✅ كائن جديد لتفاصيل الدخول
  checkIn: {
    name: { type: String, default: 'صباحية' },   // اسم الفترة: "صباحية" أو "مسائية"
    time: { type: String, default: '08:00' }    // الوقت الفعلي: "08:00"
  },

  // ✅ كائن جديد لتفاصيل الخروج
  checkOut: {
    name: { type: String, default: 'مسائية' },   // اسم الفترة: "صباحية" أو "مسائية"
    time: { type: String, default: '14:00' }    // الوقت الفعلي: "14:00"
  }
},
    status: { type: String, required: true },
    contractNumber: { type: String, unique: true },
    paymentContractNumber: { type: String, unique: true, sparse: true }, // ✅ رقم الإيصال يكون موجودًا فقط إذا كانت هناك دفعة
    date: { type: String, required: true },
    notes: { type: String },
    payment: {
        method: { type: String, required: true },
        bankName: { type: String },
        paidAmount: { type: Number, required: true },
        remainingAmount: { type: Number, required: true },
    },
    completed: { type: Boolean, default: false }, // ✅ لم أحذف هذا
    image: { type: String, default: "/default/no-image.jpg" } ,
    modificationHistory: [
  {
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employee" },
    modifiedAt: { type: Date, default: Date.now },
    changes: String, // مثال: "تم تعديل الفترة من صباحية إلى مسائية"
  },
],
// ✅ لم أحذف هذا
}, { timestamps: true }); // انا احمد 

// ✅ مولد للـ Contract ID كما هو
reservationSchema.statics.generateContractID = async function (type) {
    let prefix = ""; // بادئة الرقم حسب النوع

    switch (type) {
        case "chalet": prefix = "1"; break;
        case "hall": prefix = "2"; break;
        case "resort": prefix = "3"; break;
        default: prefix = "9"; // أي نوع غير معروف يبدأ بـ 9
    }

    // جلب آخر رقم حجز من نفس النوع
    const latestContract = await this.findOne({ contractNumber: new RegExp(`^${prefix}`) })
        .sort({ contractNumber: -1 })
        .exec();

    let newContractNumber;
    if (latestContract) {
        newContractNumber = parseInt(latestContract.contractNumber) + 1;
    } else {
        newContractNumber = parseInt(prefix + "00001"); // أول رقم لهذا النوع
    }

    return newContractNumber.toString();
};


const Reservation = mongoose.model('reservations', reservationSchema);
module.exports = Reservation;
