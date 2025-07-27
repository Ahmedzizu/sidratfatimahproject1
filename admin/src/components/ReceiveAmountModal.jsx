import React, { useState, useMemo, useEffect } from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";

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
  display: 'flex',
  flexDirection: 'column',
  gap: 2
};

const ReceiveAmountModal = ({ open, onClose, onSubmit, maxAmount }) => {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) {
      // إذا كان الصافي سالبًا، فالمبلغ المستلم افتراضيًا هو صفر
      if (maxAmount < 0) {
        setAmount("0");
      } else {
        setAmount("");
      }
    }
  }, [open, maxAmount]);

  const formatCurrency = (num) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'SAR' }).format(num);
  
  const remainingBalance = useMemo(() => {
    const receivedAmount = parseFloat(amount || 0);
    return maxAmount - receivedAmount;
  }, [amount, maxAmount]);

  const handleSubmit = () => {
    const receivedAmount = parseFloat(amount);

    // 1. التحقق الأساسي
    if (amount === "" || isNaN(receivedAmount) || receivedAmount < 0) {
      alert("يرجى إدخال مبلغ موجب صالح.");
      return;
    }

    // ✅ 2. الشرط الجديد والمهم: تحقق فقط إذا كان الصافي موجبًا
    if (maxAmount > 0 && receivedAmount > maxAmount) {
      alert(`المبلغ المستلم لا يمكن أن يتجاوز الصافي المطلوب وهو ${formatCurrency(maxAmount)}`);
      return;
    }
    
    onSubmit(receivedAmount);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" textAlign="center">
          تسجيل المبلغ المستلم
        </Typography>

        <TextField
          fullWidth
          disabled
          label="الصافي المطلوب تسليمه"
          value={formatCurrency(maxAmount)}
        />

        <TextField
          fullWidth
          autoFocus
          type="number"
          label="المبلغ المستلم فعلياً"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          // إذا كان الصافي سالبًا، لا تسمح بتغيير القيمة عن صفر
          disabled={maxAmount < 0}
        />

        <TextField
          fullWidth
          disabled
          label="المبلغ المتبقي (عجز/زيادة)"
          value={formatCurrency(remainingBalance)}
          InputProps={{
            style: {
              color: remainingBalance > 0 ? 'red' : (remainingBalance < 0 ? 'blue' : 'green'),
              fontWeight: 'bold'
            }
          }}
        />

        <Button fullWidth variant="contained" onClick={handleSubmit}>
          تأكيد الاستلام
        </Button>
      </Box>
    </Modal>
  );
};

export default ReceiveAmountModal;
