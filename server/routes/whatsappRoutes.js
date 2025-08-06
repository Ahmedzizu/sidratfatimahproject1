const express = require('express');
const router = express.Router();
const { sendMessage, getQR, getStatus, logout , restartClient } = require('../services/whatsappService');

// إرسال رسالة
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'رقم الهاتف والرسالة مطلوبين' });

    const fullPhone = phone.endsWith('@c.us') ? phone : `${phone}@c.us`;
    const result = await sendMessage(fullPhone, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ الحصول على QR كود
router.get('/qr', (req, res) => {
  const qr = getQR();
  if (!qr) return res.status(404).json({ error: 'لا يوجد QR متاح حاليًا' });
  res.json({ qr });
});

// ✅ الحصول على حالة الاتصال
router.get('/status', async (req, res) => {
  const result = await getStatus(); // لأنه أصبح async
  res.json(result);
});


// ✅ تسجيل الخروج
router.post('/logout', async (req, res) => {
  const result = await logout();
  res.json({ success: result });
});


router.post('/reconnect', async (req, res) => {
  try {
    const restarted = await restartClient();
    if (restarted) {
      res.json({ success: true, message: "✅ تم إعادة التهيئة بنجاح" });
    } else {
      res.status(500).json({ success: false, message: "❌ فشل في إعادة التهيئة" });
    }
  } catch (err) {
    console.error("❌ Error during reconnect:", err.message);
    res.status(500).json({ success: false, message: "❌ خطأ أثناء إعادة الربط" });
  }
});


module.exports = router;
