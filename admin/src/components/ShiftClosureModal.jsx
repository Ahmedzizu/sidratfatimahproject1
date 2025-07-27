// داخل مكون React - مثلاً Treasury أو غيره

import React, { useState } from "react";
import { useDispatch } from 'react-redux'; // ✅ 1. استيراد useDispatch
import { fetchTreasuryTransactions } from '../redux/reducers/treasury';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import Api from "../config/config"; // مسار Axios المناسب لك

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ShiftClosureModal = ({ open, setOpen, totalIncome, totalExpenses, employeeId ,transactions, onSuccess }) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
    const dispatch = useDispatch()

  const handleShiftClose = async () => {

    const closingBalance = totalIncome - totalExpenses;

    try {
      setLoading(true);
        const shiftStart = localStorage.getItem('shiftStart'); // Or calculate from transactions for safety

      const data = {
         employee: employeeId  , // ✅ هنا المفتاح اسمه employee
       
        totalIncome,
        totalExpenses,
        // netAmount: totalIncome - totalExpenses,
        note,
        shiftStart,
        transactions,
      };
      

      console.log("🚀 employeeId =", employeeId);
console.log("📦 data to send =", data);
    await Api.post("/api/shift-closures", data);
     dispatch(fetchTreasuryTransactions());// تأكد من المسار
      alert("تم إغلاق الوردية بنجاح");
      setOpen(false);
       if (onSuccess) onSuccess();
    } catch (err) {
    // 👇 غيّر هذا السطر ليعرض لك رسالة الخطأ الحقيقية من الخادم
    console.error("❌ Error closing shift:", err.response?.data || err.message);
    alert("حدث خطأ أثناء تقفيل الوردية: " + (err.response?.data?.message || err.message));

    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          تقفيل الوردية
        </Typography>

        <TextField
          label="الإيرادات"
          value={totalIncome.toFixed(2)}
          disabled
          fullWidth
          sx={{ my: 1 }}
        />
        <TextField
          label="المصروفات"
          value={totalExpenses.toFixed(2)}
          disabled
          fullWidth
          sx={{ my: 1 }}
        />
        <TextField
          label="الصافي"
          value={(totalIncome - totalExpenses).toFixed(2)}
          disabled
          fullWidth
          sx={{ my: 1 }}
        />
        <TextField
          label="ملاحظات"
          multiline
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          sx={{ my: 1 }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleShiftClose}
          disabled={loading}
        >
          تأكيد الإغلاق
        </Button>
      </Box>
    </Modal>
  );
};

export default ShiftClosureModal;
