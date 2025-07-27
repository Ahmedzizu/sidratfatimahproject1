const Payments = require("../model/reservationPayments");
const Reservation = require("../model/reservation");
const Discount = require("../model/Discount");
const CashTransaction = require("../model/cashTransaction"); // استيراد الموديل

const PaymentsCtl = {
  addPayment: async (req, res) => {
  try {
    console.log("🟡 Request Body:", req.body);
    const { reservation: reservationId, paid, type } = req.body;

    if (!reservationId) {
      return res.status(400).send({ error: "Reservation ID is required" });
    }

    const existingReservation = await Reservation.findById(reservationId);
    if (!existingReservation) {
      return res.status(404).send({ error: "Reservation not found" });
    }

    // توليد رقم الإيصال الفريد داخل payments فقط
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

    // الخطوة 1: حفظ الدفعة
    const newPayment = new Payments({
      ...req.body,
      paymentContractNumber,
      employee: employeeId,
    });

    await newPayment.save();
    console.log(`✅ تم إنشاء إيصال دفع برقم: ${paymentContractNumber}`);

    // الخطوة 2: تسجيل إيداع نقدي في الخزنة
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

    // الخطوة 3: تحديث حالة الحجز فقط بدون حفظ رقم الإيصال
    existingReservation.status = "confirmed";
    await existingReservation.save();
    console.log(`✅ Reservation ${reservationId} confirmed successfully.`);

    res.send({
      message: "Payment added and reservation confirmed successfully.",
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
};

module.exports = PaymentsCtl;
