import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTreasuryTransactions } from '../redux/reducers/treasury';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, CircularProgress, TextField, Autocomplete, Button, Chip 
} from '@mui/material';
import { Link } from "react-router-dom";

const Treasury = () => {
  const dispatch = useDispatch();
const { transactions, loading, error, currentBalance, grandTotalBalance, unclaimedCarryover } = useSelector((state) => state.treasury);  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(null); // ✅ فلتر الحالة الجديد
  const [isReset, setIsReset] = useState(true);

  useEffect(() => {
    dispatch(fetchTreasuryTransactions());
  }, [dispatch]);
 // ✅ التأثير لمراقبة تغيير الفلاتر
  useEffect(() => {
    // أي تغيير في الفلاتر يعني أننا لم نعد في حالة "إعادة التعيين"
    if (search || typeFilter || employeeFilter || fromDate || toDate || statusFilter !== null) {
      setIsReset(false);
    }
  }, [search, typeFilter, employeeFilter, fromDate, toDate, statusFilter]);

  // ✅ 1. دالة جديدة لتنسيق الأرقام كعملة سهلة القراءة
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('EG', {
      style: 'currency',
      currency: 'SAR'
    }).format(num || 0);
  };

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.filter((t) => {
      const matchesSearch =
        t.details?.toLowerCase().includes(search.toLowerCase()) ||
        t.employee?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter ? t.type === typeFilter : true;
      const matchesEmployee = employeeFilter ? t.employee?.name === employeeFilter : true;
      const transactionDate = new Date(t.paymentDate);
      const matchesFromDate = fromDate ? new Date(fromDate) <= transactionDate : true;
      const matchesToDate = toDate ? new Date(toDate) >= transactionDate : true;
      const matchesStatus = statusFilter !== null ? t.receivedByManager === statusFilter : true;
      return matchesSearch && matchesType && matchesEmployee && matchesFromDate && matchesToDate && matchesStatus;
    });
  }, [transactions, search, typeFilter, employeeFilter, fromDate, toDate, statusFilter]);
// ✅ 3. حساب الإجماليات الخاصة بنتيجة الفلترة فقط
  const filteredIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'إيداع' || t.type === 'تسوية رصيد').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const filteredExpenses = useMemo(() => filteredTransactions.filter(t => t.type === 'سحب').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const filteredHandedOver = useMemo(() => filteredTransactions.filter(t => t.type === 'تسليم وردية').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const filteredBalance = filteredIncome - (filteredExpenses + filteredHandedOver);

 // --- ✅ إعادة إضافة حسابات الإيرادات والمصروفات النشطة للعرض ---
  const activeTransactions = useMemo(() => 
    (transactions || []).filter(t => !t.receivedByManager), 
    [transactions]
  );
  
  const totalActiveIncome = useMemo(() => 
    activeTransactions.filter(t => t.type === 'إيداع' || t.type === 'تسوية رصيد').reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );
  
  const totalActiveExpenses = useMemo(() =>
    activeTransactions.filter(t => t.type === 'سحب').reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );

    const totalHandedOver = useMemo(() =>
    activeTransactions.filter(t => t.type === 'تسليم وردية').reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );

  const formatDateTime = (dateString) => {
    if (!dateString) return "غير محدد";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, calendar: 'gregory' };
    return new Date(dateString).toLocaleString('ar-EG', options);
  };

  const employeeOptions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...new Set(transactions.map(t => t.employee?.name).filter(Boolean))];
  }, [transactions]);
// ✅ 1. دالة جديدة لتحديد لون نوع الحركة
  const getTypeColor = (type) => {
    switch (type) {
      case 'إيداع':
        return 'green';
      case 'سحب':
        return 'red';
      case 'تسليم وردية':
        return '#1976d2'; // لون أزرق
      default:
        return 'inherit';
    }
  };
  // ✅ دالة جديدة لإعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setEmployeeFilter('');
    setFromDate('');
    setToDate('');
    setStatusFilter(null);
    setIsReset(true); // تفعيل حالة إعادة التعيين لتصفير الأرقام
  };
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center">خطأ في تحميل البيانات: {error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
        
      <Typography variant="h4" gutterBottom>الخزنة الرئيسية</Typography>
      
    
      
      <Box sx={{ p: 2, mb: 3, border: '1px solid #ddd', borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Typography variant="h5" sx={{ color: '#004d40' }}>
          الرصيد الإجمالي للخزنة: 
          <span style={{ color: grandTotalBalance >= 0 ? '#004d40' : 'red', fontWeight: 'bold', margin: '0 8px' }}>
            {formatCurrency(grandTotalBalance)}
          </span>
        </Typography>
        <Typography variant="h5">
          الرصيد الحالي النشط: 
          <span style={{ color: currentBalance >= 0 ? 'green' : 'red', fontWeight: 'bold', margin: '0 8px' }}>
            {formatCurrency(currentBalance)}
          </span>
        </Typography>
       <Typography variant="h6">
            إجمالي الإيرادات النشطة: <span style={{ color: 'green' }}>{formatCurrency(totalActiveIncome)}</span>
        </Typography>
        <Typography variant="h6">
            إجمالي المصروفات النشطة: <span style={{ color: 'red' }}>{formatCurrency(totalActiveExpenses)}</span>
        </Typography>
         <Typography variant="h6">
            إجمالي المبالغ المسلمة: <span style={{ color: '#1976d2' }}>{formatCurrency(totalHandedOver)}</span>
        </Typography>
         <Typography variant="h6" sx={{ color: '#bf360c' }}>
          عهدة معلقة (غير مستلمة): 
          <span style={{ color: '#bf360c', fontWeight: 'bold', margin: '0 8px' }}>
            {formatCurrency(unclaimedCarryover)}
          </span>
        </Typography>
       </Box> 
      {/* ✅ قسم إجماليات الفلتر المحدث */}
      <Box sx={{ p: 2, mb: 3, border: '1px solid #1976d2', borderRadius: 2, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Typography variant="h6">الإجمالي المحدد: <span style={{ color: '#1976d2', fontWeight: 'bold' }}>{isReset ? formatCurrency(0) : formatCurrency(filteredBalance)}</span></Typography>
        <Typography variant="body1">الإيرادات المحددة: <span style={{ color: 'green' }}>{isReset ? formatCurrency(0) : formatCurrency(filteredIncome)}</span></Typography>
        <Typography variant="body1">المصروفات المحددة: <span style={{ color: 'red' }}>{isReset ? formatCurrency(0) : formatCurrency(filteredExpenses)}</span></Typography>
        <Typography variant="body1">المبالغ المسلمة المحددة: <span style={{ color: '#2f3ad3ff' }}>{isReset ? formatCurrency(0) : formatCurrency(filteredHandedOver)}</span></Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="بحث"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Autocomplete options={["إيداع", "سحب", "تسليم وردية","تسوية رصيد"]} value={typeFilter || null} onChange={(e, newValue) => setTypeFilter(newValue || '')} renderInput={(params) => <TextField {...params} label="نوع الحركة" />} sx={{ minWidth: 150 }} />
        <Autocomplete
          options={employeeOptions}
          value={employeeFilter || null}
          onChange={(e, newValue) => setEmployeeFilter(newValue || '')}
          renderInput={(params) => <TextField {...params} label="الموظف" />}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="من التاريخ" type="datetime-local" InputLabelProps={{ shrink: true }}
          value={fromDate} onChange={(e) => setFromDate(e.target.value)} sx={{ width: 200 }}
        />
        <TextField
          label="إلى التاريخ" type="datetime-local" InputLabelProps={{ shrink: true }}
          value={toDate} onChange={(e) => setToDate(e.target.value)} sx={{ width: 200 }}
        />
         <Autocomplete 
          options={[{ label: 'نشط', value: false }, { label: 'مستلم', value: true }]}
          value={statusFilter === null ? null : statusFilter ? { label: 'مستلم', value: true } : { label: 'نشط', value: false }}
          onChange={(e, newValue) => setStatusFilter(newValue?.value ?? null)}
          renderInput={(params) => <TextField {...params} label="الحالة" />}
          sx={{ minWidth: 150 }}
        />
       <Button variant="outlined" onClick={handleResetFilters}>إعادة التصفية</Button>
        <Button component={Link} to="/shift-closures" variant="outlined">
          عرض تقفيلات الورديات
        </Button>
          <Button component={Link} to="/drawers-admin" variant="contained">
        إدارة الأدراج 🗄️
    </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {/* ✅ 5. إضافة عمود جديد لرقم الوردية */}
              <TableCell align="center">رقم الوردية</TableCell>
              <TableCell align="center">الحالة</TableCell>
              <TableCell>التاريخ والوقت</TableCell>
              <TableCell>نوع الحركة</TableCell>
              <TableCell>المبلغ</TableCell>
              <TableCell>التفاصيل</TableCell>
              <TableCell>الموظف</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((t) => {
              // ✅ 1. تعريف متغير للنمط لتجنب التكرار
              const receivedStyle = t.receivedByManager ? { color: '#bbbabaff' } : {};
              return (
                <TableRow 
                  key={t._id}
                  sx={{ 
                    backgroundColor: t.receivedByManager ? '#ffffffff' : 'inherit',
                  }}
                >
                  {/* ✅ 2. تطبيق النمط على كل خلية بشكل منفصل */}
                  <TableCell align="center" sx={{ fontWeight: 'bold', ...receivedStyle }}>{t.shiftClosure?.shiftNumber || '—'}</TableCell>
                      <TableCell align="center">
                    <Chip 
                      label={t.receivedByManager ? 'تم الاستلام' : 'نشط'}
                      color={t.receivedByManager ? 'default' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={receivedStyle}>{formatDateTime(t.paymentDate)}</TableCell>
                  <TableCell>
                    <Typography align="center" sx={{ color: getTypeColor(t.type), fontWeight: 'bold' }}>{t.type}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ direction: 'ltr', fontWeight: 'bold', ...receivedStyle }}>{formatCurrency(t.amount)}</TableCell>
                  <TableCell sx={receivedStyle}>{t.details}</TableCell>
                  <TableCell sx={receivedStyle}>{t.employee?.name || 'غير محدد'}</TableCell>
              
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Treasury;