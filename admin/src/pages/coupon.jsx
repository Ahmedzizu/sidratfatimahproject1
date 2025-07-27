import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Modal,
  Box,
  Typography,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
};

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState("");
  const [expiryDate, setExpiryDate] = useState(null);
  const [discount, setDiscount] = useState(10);
  const [maxUsers, setMaxUsers] = useState(100);
  const [open, setOpen] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/reservation-payments/discounts`
      );
      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "فشل في جلب الكوبونات.");
      setCoupons(result.discounts || []);
    } catch (error) {
      showToast(`❌ ${error.message}`, "error");
    }
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon || !expiryDate || !discount || !maxUsers) {
      showToast("⚠️ يرجى إدخال جميع البيانات المطلوبة!", "warning");
      return;
    }

    const formattedDate = format(new Date(expiryDate), "yyyy-MM-dd");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/reservation-payments/discounts/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: newCoupon,
            discount: Number(discount),
            expiryDate: formattedDate,
            maxUsers: Number(maxUsers),
          }),
        }
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "❌ حدث خطأ أثناء الإضافة");

      showToast("🎉 تمت إضافة الكوبون بنجاح!");
      fetchCoupons();
      setNewCoupon("");
      setExpiryDate(null);
      setDiscount(10);
      setMaxUsers(100);
      setOpen(false);
    } catch (error) {
      showToast(`❌ ${error.message}`, "error");
    }
  };

  const confirmDelete = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteCoupon = async () => {
    const { id } = deleteDialog;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/reservation-payments/discounts/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("❌ فشل في حذف الكوبون.");
      showToast("✅ تم حذف الكوبون بنجاح!");
      fetchCoupons();
    } catch (error) {
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <Container>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "20px 0",
        }}
      >
        <h2>📌 إدارة الكوبونات</h2>
        <Button
          variant="contained"
          style={{ backgroundColor: "#B38D46", color: "white" }}
          onClick={() => setOpen(true)}
        >
          ➕ إضافة كوبون
        </Button>
      </div>

      <TableContainer component={Paper} style={{ marginBottom: "20px" }}>
        <Table>
          <TableHead>
            <TableRow style={{ backgroundColor: "#1976d2" }}>
              <TableCell style={{ color: "white" }}>كود الكوبون</TableCell>
              <TableCell style={{ color: "white" }}>نسبة الخصم</TableCell>
              <TableCell style={{ color: "white" }}>عدد المستخدمين</TableCell>
              <TableCell style={{ color: "white" }}>تاريخ الانتهاء</TableCell>
              <TableCell style={{ color: "white" }}>الحالة</TableCell>
              <TableCell style={{ color: "white" }}>إجراء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => {
              const isExpired = new Date(coupon.expiryDate) < new Date();
              return (
                <TableRow key={coupon._id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>{coupon.discount}%</TableCell>
                  <TableCell>{coupon.maxUsers}</TableCell>
                  <TableCell>{coupon.expiryDate}</TableCell>
                  <TableCell
                    style={{
                      color: isExpired ? "red" : "green",
                      fontWeight: "bold",
                    }}
                  >
                    {isExpired ? "منتهي الصلاحية" : "فعال"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => confirmDelete(coupon._id)}
                    >
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ مودال الإضافة */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {" "}
            إضافة كوبون جديد
          </Typography>
          <TextField
            label="كود الكوبون"
            variant="outlined"
            fullWidth
            margin="normal"
            value={newCoupon}
            onChange={(e) => setNewCoupon(e.target.value)}
          />
          <TextField
            label="نسبة الخصم (%)"
            variant="outlined"
            fullWidth
            margin="normal"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <TextField
            label="عدد المستخدمين"
            variant="outlined"
            fullWidth
            margin="normal"
            type="number"
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="تاريخ الانتهاء"
              value={expiryDate}
              onChange={(newValue) => setExpiryDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal",
                },
              }}
            />
          </LocalizationProvider>

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            style={{ backgroundColor: "#8B5E3C" }}
            onClick={handleCreateCoupon}
          >
            إضافة
          </Button>
        </Box>
      </Modal>

      {/* ✅ Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
        >
          {toast.message}
        </MuiAlert>
      </Snackbar>

      {/* ✅ Dialog الحذف */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContentText style={{ padding: "0 24px" }}>
          ⚠️ هل أنت متأكد من رغبتك في حذف هذا الكوبون؟ لا يمكن التراجع عن هذه
          العملية.
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteCoupon}
            color="error"
            variant="contained"
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CouponManager;
