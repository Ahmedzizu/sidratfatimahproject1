import React, { useEffect, useState } from 'react';
import { Button, Box, Typography, Card, CardContent, Divider } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL ;


const WhatsAppSettings = () => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('loading');
const [connectedNumber, setConnectedNumber] = useState(null);

  const fetchQr = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/whatsapp/qr`);
      setQr(res.data.qr);
    } catch {
      setQr(null);
    }
  };

 const fetchStatus = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/whatsapp/status`);
    setStatus(res.data.status);
    setConnectedNumber(res.data.number); // ✅ أضف هذا
  } catch (err) {
    console.error("❌ Error fetching status:", err.message);
  }
};


  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/whatsapp/logout`);
      setStatus('disconnected');
      fetchQr();
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
    }
  };


 
const handleReconnect = async () => {
  try {
    await axios.post(`${API_URL}/api/whatsapp/reconnect`);
    await fetchStatus();
    await fetchQr();
    alert("جاري إنشاء كود QR جديد...");
  } catch (err) {
    console.error(err);
    alert("فشل إعادة الربط");
  }
};

 useEffect(() => {
  fetchStatus();
  fetchQr();

  const interval = setInterval(() => {
    fetchStatus(); // يعيد المحاولة كل 5 ثواني مثلًا حتى يظهر الرقم
  }, 5000);

  return () => clearInterval(interval);
}, []);

 return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>إعدادات واتساب</Typography>

      <Card sx={{ maxWidth: 400, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            الحالة:{" "}
            <strong style={{ color: status === 'connected' ? 'green' : 'red' }}>
              {status === 'connected' ? '📶 متصل' : '❌ غير متصل'}
            </strong>
          </Typography>

          {connectedNumber && (
            <Typography variant="subtitle2" color="text.secondary">
              الرقم المتصل: <strong>{connectedNumber}</strong>
            </Typography>
          )}
        </CardContent>
      </Card>

      {qr && (
        <Box mb={3}>
          <Typography variant="body1">📷 امسح الكود التالي للاتصال:</Typography>
          <img src={qr} alt="QR Code" style={{ width: 300, border: '1px solid #ccc', padding: 10, marginTop: 10 }} />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Box display="flex" gap={2} flexWrap="wrap">
        <Button variant="contained" color="primary" onClick={handleReconnect}>
          🔄 إعادة الربط
        </Button>
        <Button variant="contained" color="error" onClick={handleLogout}>
          🔌 تسجيل الخروج
        </Button>
      </Box>
    </Box>
  );
};

export default WhatsAppSettings;
