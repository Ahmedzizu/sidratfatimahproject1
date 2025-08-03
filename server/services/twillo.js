require("dotenv").config();
let loggerEvent = require("./logger");
const logger = loggerEvent("twillo");
const User = require("../model/user");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const sendWhatsappMsg = async (reservationData) => {
  try {
    // استخراج البيانات مباشرة من الكائن
    const clientName = reservationData.client.name;
    const clientPhone = reservationData.client.phone.replace('+', '');  // سنحصل عليه من populate
    const entityName = reservationData.entity.name;
    const startDate = reservationData.period.startDate;
    const totalCost = reservationData.cost;
    const totalPaid = reservationData.payment.paidAmount; // نقرأ المبلغ المدفوع مباشرة
    const remainingAmount = reservationData.payment.remainingAmount;
    const totalInsurance = reservationData.payment.insurance || 0; // افتراض أن التأمين قد يكون موجوداً

    // التحقق من وجود رقم هاتف
    if (!clientPhone) {
        console.error("❌ Error: Client phone number is missing for reservation ID:", reservationData._id);
        logger.error("❌ Twilio Error: Client phone number is missing for reservation ID: " + reservationData._id);
        return; // إيقاف التنفيذ إذا لم يوجد رقم هاتف
    }

    // إرسال رسالة WhatsApp عبر Twilio
    client.messages
      .create({
        from: "whatsapp:+201212817383",
        body: `
نتمنى لك طلعة سعيدة يا: ${clientName}
حجزك الآن مؤكد
ـــــــــــــــــــــــ
تفاصيل الحجز
ـــــــــــــــــــــــ
شاليه : شالية ومنتجع سدرة فاطمة
الوحدة : ${entityName}
التاريخ : ${startDate}
تم دفع : ${totalPaid}
المتبقي : ${remainingAmount}
الاجمالي : ${totalCost}
رقم مدير الحجوزات : 00966558866647
التأمين : ${totalInsurance}
اللوكيشن
ـــــــــــــــــــــــ
http://maps.google.com/?q=25.381852366570193,49.63853448629379
`,
        to: `whatsapp:+${clientPhone}`, // استخدام رقم الهاتف مباشرة
      })
      .then((message) => {
        console.log("✅ WhatsApp message sent:", message.sid);
        logger.info("✅ WhatsApp message sent successfully. Message SID: " + message.sid);
      })
      .catch((err) => {
        console.error("❌ Error sending WhatsApp message:", err);
        logger.error("❌ Twilio Error: " + err.message);
      });
  } catch (error) {
    console.error("❌ Error in sendWhatsappMsg:", error);
    logger.error("❌ sendWhatsappMsg Error: " + error.message);
  }
};

const sendWhatsappReset = async (req, res, next) => {
  try {
    const path = req.file?.path;
    console.log("📌 File path:", path);
    logger.info("📌 Sending WhatsApp reset message with media: " + path);

    client.messages
      .create({
        from: "whatsapp:+201212817383",
        body: `hello`,
        to: `whatsapp:+966548145515`,
        mediaUrl: [path],
      })
      .then((message) => {
        console.log("✅ WhatsApp reset message sent:", message.sid);
        logger.info("✅ WhatsApp reset message sent successfully. Message SID: " + message.sid);
        res.send("done");
      })
      .catch((err) => {
        console.error("❌ Error sending WhatsApp reset message:", err);
        logger.error("❌ Twilio Reset Message Error: " + err.message);
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    console.error("❌ Error in sendWhatsappReset:", error);
    logger.error("❌ sendWhatsappReset Error: " + error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  sendWhatsappMsg,
  sendWhatsappReset,
};
