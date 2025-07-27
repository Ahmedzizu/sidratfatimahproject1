import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
// import Button from '@mui/material/Button'; // تم إزالة هذا الاستيراد لأنه غير مستخدم

export default function Loading({open}) {
  return (
    <div>
      <Backdrop
        // تحسين الأنماط لتتناسب مع الثيم الذهبي والداكن
        sx={{
          color: '#D4AF37', // لون ذهبي لمؤشر التقدم
          backgroundColor: 'rgba(18, 18, 18, 0.8)', // خلفية داكنة شبه شفافة
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'background-color 0.3s ease-in-out', // أنيميشن للخلفية
          backdropFilter: 'blur(5px)', // تأثير ضبابي خفيف
        }}
        open={open}
      >
        <CircularProgress color="inherit" size={60} thickness={4} /> {/* حجم وسمك أفضل */}
      </Backdrop>
    </div>
  );
}