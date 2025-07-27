require("dotenv").config();
let loggerEvent = require("./logger");
const logger = loggerEvent("twillo");
const User = require("../model/user");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const sendWhatsappMsg = async (req, res, next) => {
  try {
    let data = req.body;
    let clientId = data?.client?.id;
    let clientName = data?.client?.name;
    let entityName = data?.entity?.name;
    let reservationId = data._id;
    let startDate = data?.period?.startDate;
    
    // احضار المستخدم من قاعدة البيانات
    let user = await User.findById(clientId);

    // تسجيل بيانات `data.payment` في اللوج
    console.log("🔹 data.payment:", data.payment);
    logger.info("🔹 Received data.payment: " + JSON.stringify(data.payment));

    // التحقق من أن `data.payment` مصفوفة قبل استخدام `reduce()`
    let totalInsurance = Array.isArray(data?.payment)
      ? data.payment.reduce((prev, cur) => prev + parseFloat(cur?.insurance || 0), 0)
      : 0;

    let totalPaid = Array.isArray(data?.payment)
      ? data.payment.reduce((prev, cur) => prev + parseFloat(cur?.paid || 0), 0)
      : 0;

    let totalCost = parseFloat(data?.cost) || 0;
    let remainingAmount = totalCost - totalPaid;

    // إرسال رسالة WhatsApp عبر Twilio
    client.messages
      .create({
        from: "whatsapp:+966548145515",
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
        to: `whatsapp:+966${user.phone}`,
      })
      .then((message) => {
        console.log("✅ WhatsApp message sent:", message.sid);
        logger.info("✅ WhatsApp message sent successfully. Message SID: " + message.sid);
      })
      .catch((err) => {
        console.error("❌ Error sending WhatsApp message:", err);
        logger.error("❌ Twilio Error: " + err.message);
      });

    next();
  } catch (error) {
    console.error("❌ Error in sendWhatsappMsg:", error);
    logger.error("❌ sendWhatsappMsg Error: " + error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const sendWhatsappReset = async (req, res, next) => {
  try {
    const path = req.file?.path;
    console.log("📌 File path:", path);
    logger.info("📌 Sending WhatsApp reset message with media: " + path);

    client.messages
      .create({
        from: "whatsapp:+966548145515",
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
