
const wppconnect = require('@wppconnect-team/wppconnect');

let latestQr = null;
let client = null;
let isReady = false;

async function initializeWhatsApp() {
  console.log('🔄 Initializing WhatsApp client...');
  try {
    client = await wppconnect.create({
      session: 'my-session',
      catchQR: (base64Qr, asciiQR) => {
        console.log('📱 امسح الكود التالي من واتساب:');
        console.log(asciiQR);
        latestQr = base64Qr;
        isReady = false;
      },
     statusFind: (statusSession) => {
  console.log('📡 Session status:', statusSession);
  const readyStates = ['isLogged', 'inChat', 'qrReadSuccess', 'CONNECTED', 'successChat'];

  if (readyStates.includes(statusSession)) {
    isReady = true;
    latestQr = null;
    console.log('✅ WhatsApp client is ready!');
  } else {
    isReady = false;
  }
}
,
      headless: true,
      puppeteerOptions: { args: ['--no-sandbox'] },
    });
  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp client:', error);
  }
}
// ✅ دالة إرسال الرسائل
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
function getQR() {
  return latestQr;
}

async function getStatus() {
  let number = null;

  if (client && isReady) {
    try {
      const hostDevice = await client.getHostDevice();

      if (hostDevice?.wid?.user) {
        number = hostDevice.wid.user;        
      }
    } catch (err) {
      console.error("❌ فشل في جلب رقم الهاتف:", err.message);
    }
  }

  return {
    status: isReady ? 'connected' : 'disconnected',
    number,
  };
}




async function logout() {
  if (client) {
    await client.logout();
    isReady = false;
    latestQr = null;
    return true;
  }
  return false;
}
async function restartClient() {
  try {
    if (client) {
      await client.close(); // إغلاق الجلسة الحالية (وليس فقط logout)
      console.log("🧹 تم إغلاق جلسة واتساب القديمة");
    }

    await initializeWhatsApp(); // إعادة التهيئة لجلب QR جديد
    console.log("🔁 تم إعادة تهيئة واتساب");
    return true;
  } catch (error) {
    console.error('❌ فشل في إعادة تهيئة واتساب:', error);
    return false;
  }
}
module.exports = {
  initializeWhatsApp,
  sendMessage,
  getQR,
  getStatus,
  logout,
  restartClient // ✅ أضف هذه
};
