import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { fetchTreasuryTransactions } from "../redux/reducers/treasury";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, CircularProgress, TextField, Button, Alert } from "@mui/material";
import ShiftClosureModal from "../components/ShiftClosureModal";
import Api from "../config/config";

const EmployeeTreasury = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { transactions, loading } = useSelector((state) => state.treasury);
    const { user } = useSelector((state) => state.employee.value);

    // حالة لتخزين بيانات الوردية النشطة من localStorage
    const [shiftInfo, setShiftInfo] = useState({ id: null, startTime: null });
    
    // حالات الواجهة
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [carryoverAmount, setCarryoverAmount] = useState(null);

    // التأثير الرئيسي: يتحقق من وجود وردية في localStorage ويجلب البيانات
    useEffect(() => {
        // 1. التحقق من وجود وردية نشطة في المتصفح
        const activeShiftId = localStorage.getItem('shiftId');
        const activeShiftStartTime = localStorage.getItem('shiftStart');

        if (activeShiftId && activeShiftStartTime) {
            // إذا وجدنا وردية، نحدث الحالة ونعرض الخزنة
            setShiftInfo({ id: activeShiftId, startTime: activeShiftStartTime });
            dispatch(fetchTreasuryTransactions());
        }
        // إذا لم نجد وردية، ستبقى shiftInfo.id فارغة، وسيظهر زر بدء الوردية تلقائياً
    }, [dispatch]);

    // تأثير لجلب الرصيد المُرحّل (يعمل مرة واحدة فقط)
    useEffect(() => {
        if (user?._id && shiftInfo.id) { // يعمل فقط إذا كانت هناك وردية نشطة
             const applyCarryover = async () => {
                try {
                    const response = await Api.post('/api/shift-closures/apply-carryover', { employeeId: user._id });
                    if (response.data.created && response.data.transaction) {
                        setCarryoverAmount(response.data.transaction.amount);
                        // إعادة جلب البيانات لتضمين حركة الترحيل
                        dispatch(fetchTreasuryTransactions());
                    }
                } catch (err) {
                    console.error("❌ Failed to apply carryover:", err);
                }
            };
            applyCarryover();
        }
    }, [user?._id, shiftInfo.id, dispatch]);

    // حسابات المبالغ
    const userTransactions = useMemo(() => transactions.filter(t => t.employee && (typeof t.employee === 'object' ? t.employee._id : t.employee) === user?._id && !t.includedInShiftClosure), [transactions, user?._id]);
     const totalIncome = useMemo(() => 
        userTransactions
            .filter(t => t.type === "إيداع" || t.type === "تسوية رصيد")
            .reduce((sum, t) => sum + t.amount, 0), 
    [userTransactions]);
    const totalExpenses = useMemo(() => userTransactions.filter(t => t.type === "سحب").reduce((sum, t) => sum + t.amount, 0), [userTransactions]);
    const currentBalance = totalIncome - totalExpenses;
    const filteredTransactions = useMemo(() => userTransactions.filter(t => t.details?.toLowerCase().includes(search.toLowerCase())), [userTransactions, search]);

    // دالة لبدء وردية جديدة
    const handleStartShift = () => {
        const newShiftId = `Shift-${Date.now()}`;
        const newShiftStartTime = new Date().toISOString();
        localStorage.setItem('shiftId', newShiftId);
        localStorage.setItem('shiftStart', newShiftStartTime);
        window.location.reload(); // إعادة تحميل الصفحة لإظهار الخزنة
    };

    // دالة لتقفيل الوردية وتسجيل الخروج
    const handleShiftClosureSuccess = () => {
        localStorage.removeItem('shiftId');
        localStorage.removeItem('shiftStart');
        const userChoice = window.confirm("تم تقفيل الوردية بنجاح.\nهل تريد بدء وردية جديدة؟\n\n- اضغط 'OK' لبدء وردية جديدة.\n- اضغط 'Cancel' لتسجيل الخروج.");
        if (userChoice) {
            handleStartShift();
        } else {
            localStorage.removeItem('adminToken');
            navigate('/signin');
        }
    };

    const formatDateTime = (dateString) => new Date(dateString).toLocaleString("ar-EG");

    // ----- عرض شاشة بدء الوردية إذا لم تبدأ بعد -----
    if (!shiftInfo.id) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <Typography variant="h4" gutterBottom>لم تبدأ ورديتك بعد</Typography>
                <Button variant="contained" size="large" onClick={handleStartShift}>
                    اضغط هنا لبدء وردية جديدة
                </Button>
            </Box>
        );
    }

    // ----- عرض شاشة الخزنة -----
    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd' }}>
                <Typography variant="h6">الوردية الحالية: <strong>{shiftInfo.id}</strong></Typography>
                <Typography variant="body1">وقت البدء: <strong>{formatDateTime(shiftInfo.startTime)}</strong></Typography>
            </Paper>

            <Typography variant="h4" gutterBottom>خزنة الموظف: {user?.name}</Typography>
            
  
      {carryoverAmount > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          تمت إضافة رصيد مُرحّل بقيمة **{carryoverAmount.toFixed(2)}** ريال إلى خزنتك.
        </Alert>
      )}
      
      <Typography variant="h6" sx={{ mb: 1 }}>إجمالي الإيرادات: <span style={{ color: "green", fontWeight: "bold" }}>{totalIncome.toFixed(2)} ريال</span></Typography>
      <Typography variant="h6" sx={{ mb: 1 }}>إجمالي المصروفات: <span style={{ color: "red", fontWeight: "bold" }}>{totalExpenses.toFixed(2)} ريال</span></Typography>
      <Typography variant="h5" gutterBottom sx={{ color: currentBalance >= 0 ? "green" : "red" }}>الرصيد الحالي (قبل التسليم): {currentBalance.toFixed(2)} ريال</Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField label="بحث بالتفاصيل" variant="outlined" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outlined" onClick={() => setModalOpen(true)}>تقفيل الوردية</Button>
      </Box>

      <ShiftClosureModal open={modalOpen} setOpen={setModalOpen} onSuccess={handleShiftClosureSuccess}  totalIncome={totalIncome} totalExpenses={totalExpenses} employeeId={user?._id} transactions={userTransactions.filter(t => !t.includedInShiftClosure)} />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}><TableRow><TableCell>التاريخ</TableCell><TableCell>النوع</TableCell><TableCell>المبلغ</TableCell><TableCell>التفاصيل</TableCell></TableRow></TableHead>
          <TableBody>
            {filteredTransactions.map((t) => (
              <TableRow key={t._id}>
                <TableCell>{formatDateTime(t.paymentDate)}</TableCell>
                <TableCell><Typography align="center" color={t.type === 'إيداع' ? 'green' : 'red'} sx={{fontWeight: 'bold'}}>{t.type}</Typography></TableCell>
                <TableCell align="right">{t.amount.toFixed(2)}</TableCell>
                <TableCell>{t.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmployeeTreasury;