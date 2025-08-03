const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/whatsappService');

router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'يجب إدخال رقم الهاتف والرسالة' });
    }

    const fullPhone = phone.endsWith('@c.us') ? phone : `${phone}@c.us`;

    const result = await sendMessage(fullPhone, message);
    res.json({ success: true, result });
  } catch (error) {
  console.error('❌ Error sending WhatsApp message:', error);
  res.status(500).json({ error: 'حدث خطأ أثناء إرسال الرسالة', details: error.message });
}

});

module.exports = router;
