import { TextField, Button, Typography, Box, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow ,Autocomplete,IconButton,Grid} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Api from '../config/config';
import AddExpenses from '../modals/AddExpensesModal';
import { fetchExpenses } from '../redux/reducers/finance';
import React, { useEffect, useState, useMemo } from 'react';
import { fetchBankDetails } from '../redux/reducers/bank';
import ReceiptIcon from '@mui/icons-material/Receipt'; // 💡 جديد: استيراد أيقونة
const expenseTypes = [
  { label: "صيانة", value: "صيانة", key: "Maintenance" },
  { label: "كهرباء", value: "كهرباء", key: "Electricity" },
  { label: "مياه", value: "مياه", key: "Water" },
  { label: "مشتريات", value: "مشتريات", key: "Purchases" },
  { label: "مرتبات", value: "مرتبات", key: "Salaries" },
  { label: "أخرى", value: "أخرى", key: "Other" },
];

const billTypes = [
  { label: "الكل", value: "", key: "All" },
  { label: "نقدي", value: "نقدي", key: "Cash" },
  { label: "تحويل بنكي", value: "تحويل بنكي", key: "BankTransfer" },
  { label: "شيك", value: "شيك", key: "Check" },
  { label: "أخرى", value: "أخرى", key: "Other" },
];
const Expenses = () => {
  const { t, i18n } = useTranslation();
   const dispatch = useDispatch();
  const data = useSelector((state) => state.finance.value.expenses) || [];
  const user = useSelector((state) => state.employee.value.user);

  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState({});
  const [update, setUpdate] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
 const banks = useSelector((state) => state.bank.value.data) || [];
 
// ... داخل مكون Expenses
const [employeeFilter, setEmployeeFilter] = useState(''); // 💡 جديد: فلتر الموظف
const [expenseTypeFilter, setExpenseTypeFilter] = useState(''); // 💡 جديد: فلتر نوع المصروف
const imagesKey = process.env.REACT_APP_UPLOAD_URL; // تعريف متغير رابط الصور

  const getKey = (label) => {
    const match =
      [...expenseTypes, ...billTypes].find((item) => item.label === label);
    return match?.key || label;
  };
// Add this function inside your Expenses component
const formatDateTime = (dateString) => {
    if (!dateString) return "غير متوفر";
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
useEffect(() => {
  dispatch(fetchExpenses());
  dispatch(fetchBankDetails()); //  ✅ أضف هذا السطر
}, [dispatch]);
  
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    let filtered = [...safeData];

    if (search) {
      filtered = filtered.filter(ele =>
        ele && ['billType', 'reciver', 'date', 'type', 'note','addedByEmployeeName'].some(
          key => ele[key]?.toString()?.toLowerCase()?.includes(search.toLowerCase())
        )
      );
    }

    if (billTypeFilter) {
      filtered = filtered.filter(ele => ele.billType === billTypeFilter);
    }
 // 💡 جديد: إضافة منطق الفلترة بالموظف
  if (employeeFilter) {
    filtered = filtered.filter(ele => ele.employee?.name === employeeFilter);
  }

  // 💡 جديد: إضافة منطق الفلترة بنوع المصروف
  if (expenseTypeFilter) {
      filtered = filtered.filter(ele => ele.type === expenseTypeFilter);
  }
    if (fromDate) {
      filtered = filtered.filter(ele => new Date(ele.date) >= new Date(fromDate));
    }

    if (toDate) {
      filtered = filtered.filter(ele => new Date(ele.date) <= new Date(toDate));
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a?.date || 0);
      const dateB = new Date(b?.date || 0);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [search, data, sortOrder, billTypeFilter, fromDate, toDate, employeeFilter, expenseTypeFilter]); // 💡 إضافة المتغيرات الجديدة

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTemp({});
    setUpdate(false);
  };

  const handleDelete = (id) => {
    if (window.confirm(t("finance.confirmDelete"))) {
      Api.delete(`/admin/expenses/delete/${id}`)
        .then(() => dispatch(fetchExpenses()))
        .catch((err) => console.error(err));
    }
  };

  const handleOpenEdit = (data) => {
    setTemp(data);
    setOpen(true);
    setUpdate(true);
  };


// 💡 جديد: استخراج قائمة الموظفين الفريدة للفلتر
const employeeList = useMemo(() => {
  const employees = data.map(item => item.employee?.name).filter(Boolean);
  return [...new Set(employees)];
}, [data]);

// 💡 جديد: استخراج قائمة أنواع المصروفات الفريدة للفلتر
const dynamicExpenseTypes = useMemo(() => {
    const baseTypes = ["صيانة", "كهرباء", "مياه", "مشتريات", "مرتبات"];
    const customTypes = data.map(item => item.type).filter(Boolean);
    const allTypes = [...new Set([...baseTypes, ...customTypes])];
    return allTypes.map(type => ({ label: type, value: type }));
}, [data]);

const bankMap = useMemo(() => {
  const map = {};
  if (Array.isArray(banks)) {
    banks.forEach(bank => {
      map[bank._id] = bank.name;
    });
  }
  return map;
}, [banks]);

  return (

    <div className="page-content-wrapper">

<div style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
  <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
      {t('finance.expenses')}
    </Typography>

    <Grid container spacing={2} alignItems="center">
      {/* 🔍 البحث */}
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="text"
          variant="outlined"
          value={search}
          placeholder={t('search')}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Grid>

      {/* ➕ إضافة مصروف */}
      <Grid item xs={12} md={2}>
        <Button fullWidth onClick={handleOpen} variant="contained">
          {t('finance.addExpenses')}
        </Button>
      </Grid>

      {/* 🔃 ترتيب حسب التاريخ */}
      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          select
          SelectProps={{ native: true }}
          label={t("finance.sortByDate")}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">{t("finance.newestFirst")}</option>
          <option value="asc">{t("finance.oldestFirst")}</option>
        </TextField>
      </Grid>

      {/* 💳 نوع الدفع */}
      <Grid item xs={12} sm={6} md={2}>
        <Autocomplete
          fullWidth
          options={billTypes}
          getOptionLabel={(option) => t(`finance.${option.key}`)}
          value={billTypes.find((opt) => opt.value === billTypeFilter) || billTypes[0]}
          onChange={(e, newValue) => setBillTypeFilter(newValue ? newValue.value : "")}
          renderInput={(params) => (
            <TextField {...params} label={t("finance.billType")} />
          )}
        />
      </Grid>

      {/* 👤 الموظف */}
      <Grid item xs={12} sm={6} md={2}>
        <Autocomplete
          fullWidth
          options={employeeList}
          getOptionLabel={(option) => option}
          value={employeeFilter || null}
          onChange={(e, newValue) => setEmployeeFilter(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label={t("finance.employee")} />
          )}
        />
      </Grid>

      {/* 💼 نوع المصروف */}
      <Grid item xs={12} sm={6} md={2}>
        <Autocomplete
          fullWidth
          options={dynamicExpenseTypes}
          getOptionLabel={(option) => option.label}
          value={dynamicExpenseTypes.find(opt => opt.value === expenseTypeFilter) || null}
          onChange={(e, newValue) => setExpenseTypeFilter(newValue ? newValue.value : "")}
          renderInput={(params) => (
            <TextField {...params} label={t("finance.expensesType")} />
          )}
        />
      </Grid>

      {/* 📅 التاريخ من */}
      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          type="datetime-local"
          label={t("finance.fromDate")}
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
      </Grid>

      {/* 📅 التاريخ إلى */}
      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          type="datetime-local"
          label={t("finance.toDate")}
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </Grid>

      {/* ♻️ زر تصفير الفلاتر */}
      <Grid item xs={12} sm={6} md={2}>
        <Button
          fullWidth
          onClick={() => {
            setSearch('');
            setBillTypeFilter('');
            setEmployeeFilter('');
            setExpenseTypeFilter('');
            setSelectedDate('');
            setFromDate('');
            setToDate('');
          }}
          variant="outlined"
        >
          {t('finance.resetFilters')}
        </Button>
      </Grid>

      {/* 💰 المجموع */}
      <Grid item xs={12}>
        <Typography
          align="center"
          fontWeight="bold"
          variant="h6"
          sx={{ mt: 2, color: 'primary.main' }}
        >
          {t('finance.total')}:{" "}
          {filteredData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toFixed(2)}{" "}
          {t('currency')}
        </Typography>
      </Grid>
    </Grid>
  </Paper>


        <TableContainer component={Paper} className="table-print">
          <Table aria-label="expenses table">
            <TableHead className="tablehead">
              <TableRow>
                <TableCell align="center" className="table-row">{t('finance.receiver')}</TableCell>
                <TableCell align="center" className="table-row">{t('finance.expensesType')}</TableCell>
                <TableCell align="center" className="table-row">{t('finance.amount')}</TableCell>
                <TableCell align="center" className="table-row">{t('finance.billType')}</TableCell>
                <TableCell align="center" className="table-row">{t('date')}</TableCell>
                <TableCell align="center" className="table-row">{t('finance.Guarantee')}</TableCell>
               <TableCell align="center" className="table-row">{t('finance.note')}</TableCell>
                <TableCell align="center" className="table-row">
                  {t('finance.addedBy')} {/* ✅ إضافة رأس العمود لاسم الموظف */}
                </TableCell>
                  <TableCell align="center" className="table-row">{t('finance.invoice')}</TableCell> {/* 💡 جديد: عمود الفاتورة */}
<TableCell align="center" className="table-row">{t('finance.bankName')}</TableCell>
                {/* <TableCell align="center" className="table-row">{t('finance.edit')}</TableCell> */ }
                {/* <TableCell align="center" className="table-row">{t('finance.delete')}</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row._id}>
                  <TableCell align="center">{row.reciver}</TableCell>
                  <TableCell align="center">{t(`finance.${getKey(row.type)}`)}</TableCell>
                  <TableCell align="center">{row.amount}</TableCell>
                  <TableCell align="center">{t(`finance.${getKey(row.billType)}`)}</TableCell>
<TableCell align="center">{formatDateTime(row.date)}</TableCell>
                  <TableCell align="center">{t(`finance.${row.guarantee === "بضمان" ? "Guarantee" : "noGuarantee"}`)}</TableCell>
                  <TableCell align="center">{row.note || "-"}</TableCell>
      

<TableCell align="center">{row.addedByEmployeeName || 'غير معروف'}</TableCell>
  {/* 💡 جديد: خلية الفاتورة */}
  <TableCell align="center">
    {row.guarantee === "بضمان" && row.bill ? (
      <IconButton
        component="a"
        href={`${imagesKey}/expenses/${row.bill}`}
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
      >
        <ReceiptIcon />
      </IconButton>
    ) : (
      "-"
    )}
  </TableCell>
<TableCell align="center">
  {row.billType === 'تحويل بنكي' ? (
    // ✅ استخدم bankMap للبحث عن الاسم باستخدام ID البنك
    bankMap[row.bank] || 'غير محدد'
  ) : (
    '---'
  )}
</TableCell>
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
        </TableContainer>

        <AddExpenses
          handleClose={handleClose}
          data={temp}
          handleOpen={handleOpen}
          open={open}
          update={update}
          employeeName={user?.name} 
        />
      </div> </div>
    )
 
};

export default Expenses;
