const wppconnect = require('@wppconnect-team/wppconnect');

let client; // سنحتفظ بالعميل هنا

// دالة لتشغيل الواتساب مرة واحدة
async function initializeWhatsApp() {
  console.log('🔄 Initializing WhatsApp client...');
  try {
    client = await wppconnect.create({
      session: 'my-session', // اسم الجلسة
      catchQR: (base64Qr, asciiQR) => {
        console.log('📱 امسح الكود التالي من واتساب:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log('📡 Session status:', statusSession);
        if (statusSession === 'isLogged' || statusSession === 'inChat') {
          console.log('✅ WhatsApp client is ready!');
        }
      },
      headless: true, // اجعلها true للعمل على السيرفر
      puppeteerOptions: { args: ['--no-sandbox'] },
    });
  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp client:', error);
  }
}

// دالة لإرسال الرسائل تستخدم العميل الجاهز
async function sendMessage(to, message) {
  if (!client) {
    throw new Error('WhatsApp client is not ready. Please initialize it first.');
  }
  try {
    const result = await client.sendText(to, message);
    console.log('✅ تم إرسال الرسالة بنجاح:', result.id.id);
    return result;
  } catch (error) {
    console.error('❌ فشل إرسال الرسالة:', error);
    throw error;
  }
}

module.exports = {
  initializeWhatsApp,
  sendMessage,
};