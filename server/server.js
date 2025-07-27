const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const upload = require('express-fileupload');
const axios = require('axios');

const app = express();

// ✅ تحميل المتغيرات البيئية من ملف .env
dotenv.config();
// axios.get('/employee/user/profile'); // تأكد من وجود هذا في السيرفر
axios.get(`${process.env.BASE_URL}/employee/user/profile`)
  .then(response => {
    console.log('✅ تم جلب بيانات المستخدم:', response.data);
  })
  .catch(error => {
    console.error('❌ فشل في جلب بيانات المستخدم:', error.message);
  });
// ✅ استيراد مسارات التطبيق
const userRouter = require('./routes/userRoutes');
const chaletRouter = require('./routes/chaletRoutes');
const hallRouter = require('./routes/hallRoutes');
const resortRouter = require('./routes/resortRoutes');
const employeeRouter = require('./routes/employeeRoutes');
const financeRouter = require('./routes/financeRoutes');
const servicesRouter = require('./routes/servicesRoutes');
const reservationServicesRouter = require('./routes/reservationServicesRoutes');
const customerRouter = require('./routes/customerRoutes');
const reservationRouter = require('./routes/reservationRoutes');
const bankRoutes = require('./routes/bankRoutes');
const reservationPaymentsRoutes = require('./routes/reservation_payments.routes');
const reportRoutes = require("./routes/reportRoutes");
const expenses = require('./model/expenses'); // عدّل المسار حسب مكان الملف
const expensesRoutes = require('./routes/expensesRoutes');
const treasuryRoutes = require('./routes/treasuryRoutes'); // استدعاء الراوت الجديد
const shiftClosuresRoutes = require("./routes/shiftClosuresRoutes");
const drawerRoutes = require('./routes/drawerRoutes'); // تأكد من صحة المسار


// ✅ الاتصال بقاعدة البيانات
const databaseConnection = require('./connection/connect');
databaseConnection();

// ✅ إعداد CORS للسماح بالطلبات من نطاقات محددة
// const allowedOrigins = [
//   'https://teal-gorilla-464304.hostingersite.com',
//   'https://www.wasenahon.com',
//   'http://sedra-fatma-admin.infinityfreeapp.com',
//   'https://sidra-fatima.onrender.com',
//   'https://sidra-fatima-user.onrender.com',
//   'https://sidra-fatima-admin-0g3u.onrender.com'
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true, // ✅ السماح بإرسال الكوكيز
// };

// app.use(cors(corsOptions));

const corsOptions = {
  origin: (origin, callback) => {
    // السماح لجميع الطلبات بغض النظر عن origin
    callback(null, true);
  },
  credentials: true, // السماح بإرسال الكوكيز
};

app.use(cors(corsOptions));


// ✅ إعدادات الأمان باستخدام Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", '*'],
      },
    },
  })
);

// ✅ تحليل البيانات الواردة بتنسيق JSON
app.use(express.json());

// ✅ تحليل الكوكيز
app.use(cookieParser());

// // ✅ إعداد تحميل الملفات مع تحديد الحد الأقصى للحجم
// app.use(
//   upload({
//     limits: { fileSize: 4 * 1024 * 1024 }, // ✅ الحد الأقصى للحجم: 4 ميجابايت
//   })
// );


// ✅ تعريف المسارات
app.use('/reservation-payments', reservationPaymentsRoutes);
app.use('/bank-details', bankRoutes);
app.use('/api/employee', employeeRouter); 
app.use('/users', userRouter);
app.use('/admin', chaletRouter);
app.use('/admin', hallRouter);
app.use('/admin', servicesRouter);
app.use('/admin', reservationServicesRouter);
app.use('/admin', resortRouter);
app.use('/admin', customerRouter);
app.use('/admin', financeRouter);
app.use(reservationRouter);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use("/api/shift-closures", shiftClosuresRoutes);
app.use('/api/drawers', drawerRoutes); // أي طلب يبدأ بـ /api/drawers سيتم توجيهه إلى drawerRoutes




// backend/server.js

// ✅ دالة لتقديم الملفات من أي مجلد داخل `uploads/`
const serveUploads = (folder) => {
  const fullPath = path.join(__dirname, 'uploads', folder);
  app.use(`/uploads/${folder}`, (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // ✅ السماح لأي موقع بتحميل الصور
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // ✅ حل مشكلة NotSameOrigin
    next();
  }, express.static(fullPath));
};

// ✅ تقديم جميع المجلدات داخل `uploads/`
serveUploads('chalet');
serveUploads('hall');
serveUploads('expenses');
serveUploads('resorts');


// ✅ حل إضافي: تقديم `uploads/` بشكل عام لكل الملفات
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
}));

// ✅ التعامل مع طلبات OPTIONS (التحقق المسبق)
app.options('*', cors(corsOptions));

// ✅ التعامل مع الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// ✅ بدء الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 App is running on port ${PORT}`);
  console.log(`📸 Try accessing an image: https://sidra-fatima.onrender.com/uploads/chalet/example.jpg`);
});


