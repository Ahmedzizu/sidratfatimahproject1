import React from "react";
import {
  Modal, Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button,Alert
} from "@mui/material";

const ShiftClosureDetailsModal = ({ open, onClose, transactions, closure }) =>{ 
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        maxWidth: "90%",
        bgcolor: "white",
        p: 3,
        mt: 5,
        mx: "auto",
        borderRadius: 2,
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <Typography variant="h6" gutterBottom>
          تفاصيل عمليات الوردية
        </Typography>
{/* ✅ Add this block to show remaining balance info */}
        {closure?.remainingBalance > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            يوجد مبلغ متبقي وقدره **{closure.remainingBalance.toFixed(2)}** ريال
            من الوردية رقم **{closure.shiftNumber}** للموظف **{closure.employee?.name}**.
          </Alert>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>النوع</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>الوصف</TableCell>
                <TableCell>التاريخ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions?.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>{t.details}</TableCell>
                  <TableCell>{new Date(t.paymentDate).toLocaleString("ar-EG")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button onClick={onClose} variant="outlined" sx={{ mt: 2 }}>
          إغلاق
        </Button>
      </Box>
    </Modal>
  );
};

export default ShiftClosureDetailsModal;
