const Payments = require("../model/reservationPayments");
const Reservation = require("../model/reservation");
const Discount = require("../model/Discount");
const CashTransaction = require("../model/cashTransaction"); // استيراد الموديل
const axios = require('axios'); // ✨ الخطوة 1: استيراد axios
const ReservationServices = require("../model/reservationServices"); // ✨ الخطوة 1: استيراد موديل الخدمات
const Bank = require("../model/bank.model");
// ✨ دالة مساعدة لتحويل التاريخ إلى يوم الأسبوع بالعربية
function getDayName(dateString) {
  const date = new Date(dateString);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}
const PaymentsCtl = {
 addPayment: async (req, res) => {
    try {
      console.log("🟡 Request Body:", req.body);
      const { reservation: reservationId, paid, type, bank: bankId } = req.body;

      if (!reservationId) {
        return res.status(400).send({ error: "Reservation ID is required" });
      }

      const existingReservation = await Reservation.findById(reservationId).populate('client.id');
      
      if (!existingReservation) {
        return res.status(404).send({ error: "Reservation not found" });
      }

      const originalStatus = existingReservation.status;
      
      let paymentPrefix = "5";
      let paymentBaseNumber = 50000;
      let paymentLastNumber = paymentBaseNumber;

      while (true) {
        const existingPayment = await Payments.findOne({
          paymentContractNumber: paymentPrefix + paymentLastNumber,
        });
        if (!existingPayment) break;
        paymentLastNumber++;
      }
      const paymentContractNumber = paymentPrefix + paymentLastNumber;
      const employeeId = req.user._id;

      // الخطوة 1: حفظ الدفعة الجديدة
      const newPayment = new Payments({
        ...req.body,
        paymentContractNumber,
        employee: employeeId,
      });
      await newPayment.save();
      console.log(`✅ تم إنشاء إيصال دفع برقم: ${paymentContractNumber}`);

      // ================================================================
      // ✨✨ تم إصلاح منطق الحسابات بشكل كامل هنا ✨✨
      // ================================================================
      // 2. جلب كل الدفعات (القديمة والجديدة) لهذا الحجز
      const allPaymentsForReservation = await Payments.find({ reservation: reservationId });
 const services = await ReservationServices.find({ reservationId: existingReservation._id });

      // 3. حساب إجمالي المبلغ المدفوع عن طريق جمع كل الدفعات
      const newTotalPaid = allPaymentsForReservation.reduce((sum, payment) => sum + (payment.paid || 0), 0);
      
  const totalServicesCost = services.reduce((sum, service) => sum + (service.price || 0), 0);
      
    // 4. حساب التكلفة الإجمالية الحقيقية (سعر الحجز + سعر الخدمات)
    const trueTotalCost = existingReservation.cost + totalServicesCost;

    // 5. حساب المبلغ المتبقي الصحيح بناءً على التكلفة الحقيقية
    const newRemainingAmount = trueTotalCost - newTotalPaid;
      // 4. تحديث سجل الحجز الرئيسي بالقيم الصحيحة والدقيقة
      existingReservation.payment.paidAmount = newTotalPaid;
      existingReservation.payment.remainingAmount = newRemainingAmount;
      existingReservation.status = "confirmed";
      await existingReservation.save();
      console.log(`✅ Reservation ${reservationId} updated with correct totals.`);

      // تسجيل إيداع نقدي
      if (type === 'نقدي') {
        const cashDeposit = new CashTransaction({
          type: 'إيداع',
          amount: parseFloat(paid),
          details: `دفعة من حجز العميل: ${existingReservation.client.name} (رقم العقد: ${existingReservation.contractNumber})`,
          reservationId: existingReservation._id,
          employee: employeeId,
        });
        await cashDeposit.save();
        console.log(`💰 تم تسجيل إيداع نقدي بقيمة ${paid} في الخزنة.`);
      }

      // إرسال رسالة الواتساب بالبيانات الصحيحة
      try {
        if (existingReservation.client && existingReservation.client.id && existingReservation.client.id.phone) {
          
          const clientPhoneNumber = existingReservation.client.id.phone.replace('+', '');
          let messageText = '';

          if (originalStatus === 'unConfirmed') {
            // ... (رسالة التأكيد الكاملة)
            const services = await ReservationServices.find({ reservationId: existingReservation._id });
            let totalServicesCost = services.reduce((sum, service) => sum + (service.price * service.number), 0);
            const periodName = existingReservation.period.type === 'days' ? 'لعدة أيام' : existingReservation.period.dayPeriod;
           // ✨ استخدام الدالة الجديدة لتنسيق الوقت
            const checkInDetails = `${getDayName(existingReservation.period.startDate)} - ${existingReservation.period.checkIn.name} (${formatTime12Hour(existingReservation.period.checkIn.time)})`;
            const checkOutDetails = `${getDayName(existingReservation.period.endDate)} - ${existingReservation.period.checkOut.name} (${formatTime12Hour(existingReservation.period.checkOut.time)})`;
            
            messageText = `مجموعة سدرة فاطمة
مضيفنا العزيز: ${existingReservation.client.name}
نبارك لك حجزك المؤكد
رقم العقد: ${existingReservation.contractNumber}
--------------
تفاصيل الحجز
--------------
المكان: ${existingReservation.entity.name}
نوع الفترة: ${periodName}

تاريخ الدخول: ${existingReservation.period.startDate} (${checkInDetails})
تاريخ الخروج: ${existingReservation.period.endDate} (${checkOutDetails})

مبلغ الحجز: ${existingReservation.cost.toFixed(2)}

اجمالي الخدمات: ${totalServicesCost.toFixed(2)}
الخصم: ${existingReservation.discountAmount.toFixed(2)}
المدفوع: ${newTotalPaid.toFixed(2)}
-------
المتبقي: ${newRemainingAmount.toFixed(2)}

نتمنى لك إقامة سعيدة!
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991
اللوكيشن: https://maps.app.goo.gl/bUvZp5cDYiSevgSo6`;

          } else {
            // --- رسالة إضافة دفعة جديدة ---
            let bankName = '';
            if (type === 'تحويل بنكي' && bankId) {
              const bank = await Bank.findById(bankId);
              if (bank) bankName = `\n- اسم البنك: ${bank.name}`;
            }
            
            messageText = `مجموعة سدرة فاطمة
مضيفنا العزيز: ${existingReservation.client.name}
تم استلام مبلغ  جديد بنجاح من   
 حجز رقم: ${existingReservation.contractNumber}

- نوع الدفع: ${type}${bankName}
- رقم إيصال الدفع: ${paymentContractNumber}
- المبلغ الإجمالي (شامل الخدمات): ${trueTotalCost.toFixed(2)}

- المبلغ المدفوع حديثًا: ${parseFloat(paid).toFixed(2)}
- إجمالي المدفوع حتى الآن: ${newTotalPaid.toFixed(2)}
---------
- المبلغ المتبقي: ${newRemainingAmount.toFixed(2)}

نتمنى لك إقامة سعيدة!
--------------
مدير الحجوزات: 0505966297
العامل المسئول: 560225991`
          }

          const whatsappPayload = { phone: clientPhoneNumber, message: messageText };
 axios.post(`${process.env.WHATSAPP_BOT_URL}/api/whatsapp/send`, whatsappPayload);
          console.log('✅ تم إرسال طلب رسالة واتساب بنجاح.');

        } else {
          console.error('❌ فشل إرسال الواتساب: بيانات العميل أو رقم الهاتف غير موجودة.');
        }
      } catch (error) {
        console.error('❌ فشل إرسال الطلب إلى بوت الواتساب:', error.message);
      }

      res.send({
        message: "Payment added and reservation status updated.",
        paymentContractNumber,
      });

    } catch (error) {
      console.error("❌ Error in addPayment:", error.message);
      res.status(500).send({ message: error.message });
    }
  },
  getAllDiscounts: async (req, res) => {
    try {
      const discounts = await Discount.find({});
      res.status(200).json({ discounts });
    } catch (error) {
      console.error("❌ خطأ في جلب أكواد الخصم:", error);
      res.status(500).json({ error: "حدث خطأ أثناء جلب أكواد الخصم" });
    }
  },

  updateDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, discount, expiryDate, maxUsers } = req.body;

      const updatedDiscount = await Discount.findByIdAndUpdate(
        id,
        { code, discount, expiryDate, maxUsers },
        { new: true }
      );

      if (!updatedDiscount) {
        return res.status(404).json({ error: "كود الخصم غير موجود!" });
      }

      res.status(200).json({ message: "تم تحديث كود الخصم بنجاح!", discount: updatedDiscount });
    } catch (error) {
      console.error("❌ خطأ في تعديل كود الخصم:", error);
      res.status(500).json({ error: "حدث خطأ أثناء تعديل كود الخصم" });
    }
  },

  deleteDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedDiscount = await Discount.findByIdAndDelete(id);

      if (!deletedDiscount) {
        return res.status(404).json({ error: "كود الخصم غير موجود!" });
      }

      res.status(200).json({ message: "تم حذف كود الخصم بنجاح!" });
    } catch (error) {
      console.error("❌ خطأ في حذف كود الخصم:", error);
      res.status(500).json({ error: "حدث خطأ أثناء حذف كود الخصم" });
    }
  },

  addDiscount: async (req, res) => {
    try {
      const { code, discount, expiryDate, maxUsers } = req.body;

      if (!code || !discount || !expiryDate || !maxUsers) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة!" });
      }

      if (discount <= 0 || discount > 100) {
        return res.status(400).json({ error: "يجب أن تكون نسبة الخصم بين 1 و 100" });
      }

      const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
      if (existingDiscount) {
        return res.status(400).json({ error: "كود الخصم موجود بالفعل!" });
      }

      const newDiscount = new Discount({
        code: code.toUpperCase(),
        discount,
        expiryDate,
        maxUsers,
      });

      await newDiscount.save();
      res.status(201).json({ message: "تمت إضافة كود الخصم بنجاح!", discount: newDiscount });
    } catch (error) {
      console.error("❌ خطأ في إضافة كود الخصم:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إضافة كود الخصم" });
    }
  },

  updatePayment: async (req, res) => {
    try {
      await Payments.findByIdAndUpdate(req.body._id, req.body);
      res.send();
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },

  deletePayment: async (req, res) => {
    try {
      let id = req.params.id;
      await Payments.findByIdAndDelete(id);
      res.send();
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },

  getPayments: async (req, res) => {
    try {
      let data = await Payments.find({ reservation: req.params.id }).populate("bank").populate("employee");
      res.send(data);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },

  getAllPayments: async (req, res) => {
    try {
      let data = await Payments.find().populate("reservation").populate("bank").populate("employee");
      res.send(data);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
  // داخل PaymentsCtl object
getSources: async (req, res) => {
  try {
    // .distinct() تجلب قائمة فريدة من نوعها بدون تكرار
    const sources = await Payments.find({ source: { $ne: null } }).distinct('source');
    res.status(200).send(sources);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
},
};

module.exports = PaymentsCtl;
