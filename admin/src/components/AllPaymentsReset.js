// ✅ الكود النهائي لملف: src/components/AllPaymentsReset.js

import React from "react";
import logo from "../assets/logo2.png";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

// دالة لتنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return "غير محدد";
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};
// دالة جديدة لتنسيق التاريخ والوقت معًا
const formatDateTime = (dateString) => {
  if (!dateString) return "غير محدد";

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true, // For AM/PM format
  };

  return new Date(dateString).toLocaleString('ar-EG', options);
};
const AllPaymentsReset = ({ data, totalPaid, totalInsurance, payments, totalServices }) => {
  
  // ✅ تعريف المتغيرات الحسابية لضمان الدقة
  const reservationCost = parseFloat(data?.cost || 0);
  const discount = parseFloat(data?.discountAmount || 0);
  const servicesTotal = parseFloat(totalServices || 0);
  const paidTotal = parseFloat(totalPaid || 0);
  
  // ✅ المعادلة الصحيحة للمبلغ المتبقي
  const remainingAmount = (reservationCost - discount + servicesTotal) - paidTotal;

  return (
    <div style={{ padding: "20px", direction: "rtl", fontFamily:"'Cairo', sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
        <div>
          <h2>مجموعة سدرة فاطمة</h2>
          <p>إيصال مجمع للدفعات</p>
          <p><strong>تاريخ الإصدار:</strong> {formatDate(new Date())}</p>
        </div>
        <img src={logo} alt="logo" height="80px" width="80px" />
      </header>
      <div style={{ marginTop: "20px" }}>
        <p><strong>اسم العميل:</strong> {data?.client?.name}</p>
        <p><strong>رقم العقد:</strong> {data?.contractNumber}</p>
        <p><strong>تاريخ الحجز:</strong> {formatDate(data?.period?.startDate)}</p>
      </div>

      <h3 style={{ marginTop: "30px", textAlign: "center" }}>كشف حساب الدفعات</h3>

      <TableContainer component={Paper} style={{ marginTop: "10px" }}>
        <Table aria-label="simple table">
          <TableHead style={{ backgroundColor: "#f2f2f2" }}>
            <TableRow>
              <TableCell align="center" style={{ fontWeight: "bold" }}>تاريخ الدفعة</TableCell>
              <TableCell align="center" style={{ fontWeight: "bold" }}>نوع الدفع</TableCell>
              <TableCell align="center" style={{ fontWeight: "bold" }}>المبلغ المدفوع</TableCell>
              <TableCell align="center" style={{ fontWeight: "bold" }}>التأمين</TableCell>
              <TableCell align="center" style={{ fontWeight: "bold" }}>البنك</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments?.map((payment, index) => (
              <TableRow key={index}>
               <TableCell align="center">{formatDateTime(payment.paymentDate)}</TableCell>
                <TableCell align="center">{payment.type}</TableCell>
                <TableCell align="center">{parseFloat(payment.paid || 0).toFixed(2)} ريال</TableCell>
                <TableCell align="center">{parseFloat(payment.insurance || 0).toFixed(2)} ريال</TableCell>
                <TableCell align="center">{payment.bank?.name || payment.bankName || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ تم تحديث قسم الملخص المالي بالكامل */}
      <div style={{ marginTop: "30px", borderTop: "2px solid #000", paddingTop: "10px", textAlign: "left", fontSize: "16px" }}>
          <h4>مبلغ الحجز الأساسي: <span style={{float: 'right'}}>{reservationCost.toFixed(2)} ريال</span></h4>
          <h4 style={{ color: 'darkgreen' }}>الخصم المطبق: <span style={{float: 'right'}}>{discount.toFixed(2)} ريال</span></h4>
          <h4>إجمالي الخدمات الإضافية: <span style={{float: 'right'}}>{servicesTotal.toFixed(2)} ريال</span></h4>
          <hr style={{border: '1px dashed #ccc'}}/>
          <h4>الإجمالي المدفوع (بدون تأمين): <span style={{float: 'right'}}>{paidTotal.toFixed(2)} ريال</span></h4>
          <h4>إجمالي التأمين المدفوع: <span style={{float: 'right'}}>{parseFloat(totalInsurance || 0).toFixed(2)} ريال</span></h4>
          <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '2px solid black'}}>
            <h3 style={{color: "red", fontWeight: "bold"}}>
                المبلغ المتبقي: 
                <span style={{float: 'right'}}>{remainingAmount.toFixed(2)} ريال</span>
            </h3>
          </div>
      </div>

      <footer style={{ textAlign: "center", marginTop: "40px", fontSize: "12px" }}>
        <p>هذا إيصال مجمع ولا يعتد به كسند فردي لكل دفعة.</p>
        <p>مجموعة سدرة فاطمة - للحجوزات والاستفسار: 0505966297</p>
      </footer>
    </div>
  );
};

export default AllPaymentsReset;