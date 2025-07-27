// src/pages/ShiftClosures.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from 'react-redux'; // تأكد من استيرادها
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, CircularProgress
} from "@mui/material";
import ShiftClosureDetailsModal from "../components/ShiftClosureDetailsModal";
import ReceiveAmountModal from "../components/ReceiveAmountModal"; // أعلى الملف

import PrintIcon from "@mui/icons-material/Print";
import Api from "../config/config";

const ShiftClosures = () => {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
const [detailsModalOpen, setDetailsModalOpen] = useState(false);
const [selectedTransactions, setSelectedTransactions] = useState([]);
const [receiveModalOpen, setReceiveModalOpen] = useState(false);
const [selectedClosure, setSelectedClosure] = useState(null);
const { user } = useSelector((state) => state.employee.value); // جلب المدير الحالي



  useEffect(() => {
    const fetchClosures = async () => {
      try {
        const { data } = await Api.get("/api/shift-closures");
        setClosures(data);
      } catch (err) {
        console.error("❌ فشل في جلب تقفيلات الوردية:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClosures();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: true,
  });
};

const formatWorkedHours = (hours) => {
  if (!hours && hours !== 0) return '—';
  const totalMinutes = Math.floor(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} ساعة ${m} دقيقة`;
};
const handleMarkReceived = (closure) => {
  setSelectedClosure(closure);
  setReceiveModalOpen(true);
};

// ... داخل المكون ShiftClosures

const confirmReceiveAmount = async (amountReceived) => {
    try {
    // ✅ قمنا بإضافة managerId هنا
    const res = await Api.patch(`/api/shift-closures/mark-received/${selectedClosure._id}`, {
      amountReceived,
      managerId: user._id, // ID المدير الذي يقوم بالعملية
    });
    // ✅ تم حذف كود تسجيل حركة السحب الإضافية من هنا

    // تحديث الحالة في الواجهة لتعكس التغيير فوراً
    setClosures((prev) =>
      prev.map((c) => (c._id === selectedClosure._id ? res.data : c))
    );
    setReceiveModalOpen(false); // أغلق المودال بعد النجاح
  } catch (err) {
    console.error("❌ فشل في تسجيل الاستلام:", err);
  }
};

const handleShowDetails = async (closure) => {
  try {
    // Call the new endpoint with the specific shift ID
    const { data } = await Api.get(`/api/shift-closures/${closure._id}/transactions`);

    setSelectedTransactions(data);
    setSelectedClosure(closure); // Store the entire closure object
    setDetailsModalOpen(true);
  } catch (err) {
    console.error("❌ Failed to fetch shift operations:", err);
  }
};


  const handlePrint = (closure) => {
    // ممكن تستبدله بمودال أو صفحة جديدة لاحقًا
    const printContent = `
      <div>
        <h2>تقرير إغلاق وردية</h2>
        <p>الموظف: ${closure.employee?.name || "غير معروف"}</p>
        <p>الإيرادات: ${closure.totalIncome} ريال</p>
        <p>المصروفات: ${closure.totalExpenses} ريال</p>
        <p>الصافي: ${closure.closingBalance} ريال</p>
        <p>الملاحظات: ${closure.note || "لا يوجد"}</p>
         <p>التاريخ: ${formatDate(closure.shiftEnd)}</p>
      </div>
    `;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  if (loading) {
    return (
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        تقفيلات الورديات
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
            <TableRow>
              <TableCell align="center">رقم الوردية</TableCell>
              <TableCell align="center">الموظف</TableCell>
              <TableCell align="center">الإيرادات</TableCell>
              <TableCell align="center">المصروفات</TableCell>
              <TableCell align="center">الصافي</TableCell>
              <TableCell align="center">المبلغ المستلم</TableCell>
              {/* ✅ 1. إضافة عنوان العمود الجديد هنا */}
              <TableCell align="center" style={{ fontWeight: 'bold', color: '#d32f2f' }}>المبلغ المتبقي</TableCell>
              <TableCell align="center">من</TableCell>
              <TableCell align="center">إلى</TableCell>
              <TableCell align="center">عدد الساعات</TableCell>
              <TableCell align="center">ملاحظات</TableCell>
              <TableCell align="center">الاستلام</TableCell>
              <TableCell align="center">تاريخ الاستلام</TableCell>
              <TableCell align="center">تفاصيل</TableCell>
              <TableCell align="center">طباعة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closures.map((closure) => {
              // ✅ 2. حساب المبلغ المتبقي في كل دورة
              // من الأفضل أن يأتي هذا الحقل من الخادم مباشرةً
              // const remainingBalance = closure.closingBalance - closure.amountReceived;

    return (
                // ✅ 1. تم حذف خاصية sx من هنا
                <TableRow key={closure._id}>
                  
                  {/* ✅ 2. تم إضافة خاصية sx لتلوين الخلفية لكل خلية */}
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.shiftNumber}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.employee?.name || "غير معروف"}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.totalIncome}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.totalExpenses}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.closingBalance}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.amountReceived != null ? closure.amountReceived : "—"}
                  </TableCell>
                  
                  {/* قمنا بدمج الستايل مع لون الخلفية هنا */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      backgroundColor: !closure.received ? '#fffde7' : 'inherit',
                      color: closure.remainingBalance > 0 ? '#d32f2f' : 'green', 
                      fontWeight: 'bold' 
                    }}
                  >
                    {closure.received ? closure.remainingBalance.toFixed(2) : '—'}
                  </TableCell>
                  
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {formatDateTime(closure.shiftStart)}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {formatDateTime(closure.shiftEnd)}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {formatWorkedHours(closure.workedHours)}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.note || "لا يوجد"}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.received ? (
                      <Typography variant="body2" color="green" sx={{ fontWeight: 'bold' }}>
                        تمت المراجعة ✅
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleMarkReceived(closure)}
                      >
                        مراجعة وتسليم
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    {closure.receivedAt ? formatDate(closure.receivedAt) : "لم يتم"}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleShowDetails(closure)}
                    >
                      عرض التفاصيل
                    </Button>
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: !closure.received ? '#fffde7' : 'inherit' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrint(closure)}
                    >
                      طباعة
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <ShiftClosureDetailsModal
  open={detailsModalOpen}
  onClose={() => setDetailsModalOpen(false)}
  transactions={selectedTransactions}
  closure={selectedClosure} // ✅ This line is crucial
/>
<ReceiveAmountModal
  open={receiveModalOpen}
  onClose={() => setReceiveModalOpen(false)}
  onSubmit={confirmReceiveAmount}
  maxAmount={selectedClosure?.closingBalance || 0}
/>


    </Box>
  );
};

export default ShiftClosures;
