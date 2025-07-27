import React, { useEffect, useState } from 'react';
import { TextField, Button, Select, MenuItem, Typography, CircularProgress } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useDispatch } from 'react-redux';
import Api from './../config/config';
import { fetchNotification } from './../redux/reducers/reservation';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../scss/UnPaidClients.scss';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const UnPaidClients = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    fetchUnPaidClients();
    removeNotification();
  }, []);

  function fetchUnPaidClients() {
    setLoading(true);
    Api.get(`${process.env.REACT_APP_API_URL}/admin/reservations/unpaid-clients`)
      .then((response) => {
        if (response.data && Array.isArray(response.data.unpaidClients)) {
          setData(response.data.unpaidClients);
        } else {
          console.error("❌ البيانات غير صحيحة:", response.data);
          setData([]);
        }
      })
      .catch((error) => {
        console.error("❌ خطأ أثناء جلب البيانات:", error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }

  function removeNotification() {
    Api.patch("/admin/notification", { type: "Deferred" })
      .then(() => dispatch(fetchNotification()))
      .catch((err) => console.error("❌ خطأ في حذف الإشعار:", err));
  }

  let filteredData = [...data];

  if (statusFilter !== 'all') {
    filteredData = filteredData.filter((row) => {
      if (statusFilter === 'paid') return row.totalPaid > 0;
      if (statusFilter === 'unpaid') return row.totalPaid === 0;
      return true;
    });
  }

  if (search) {
    filteredData = filteredData.filter(
      (ele) =>
        ele.clientName.includes(search) ||
        ele.entityName.includes(search) ||
        ele.phone.includes(search) ||
        ele.reservationId.toString().includes(search)
    );
  }
  if (statusFilter === 'endingToday') {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  filteredData = filteredData.filter(row => {
    return row.period?.endDate?.slice(0, 10) === today;
  });
}


  const halls = filteredData.filter(client => client.entityType === 'hall');
  const chalets = filteredData.filter(client => client.entityType === 'chalet');
  const totalPaidHalls = halls.reduce((acc, cur) => acc + (cur.totalPaid || 0), 0);
  const totalServicesHalls = halls.reduce((acc, cur) => acc + (cur.totalServices || 0), 0); 
  const totalUnpaidHalls = halls.reduce((acc, cur) => acc + (cur.remainingAmount || 0), 0);
  const totalPaidChalets = chalets.reduce((acc, cur) => acc + (cur.totalPaid || 0), 0);
  const totalUnpaidChalets = chalets.reduce((acc, cur) => acc + (cur.remainingAmount || 0), 0);
 const totalServicesChalets = chalets.reduce((acc, cur) => acc + (cur.totalServices || 0), 0);
  return (
    <div className="unpaid-clients-container">
      <Typography variant="h3" component="h1" className="main-title">
        {t("العملاء غير المسددين")}
      </Typography>

      <div className="search-box">
        <TextField
          type="text"
          variant="outlined"
          value={search}
          placeholder={t("search")}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          size="medium"
        />
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          displayEmpty 
          className="status-select"
        >
          <MenuItem value="all">{t("جميع العملاء")}</MenuItem>
          <MenuItem value="paid">{t("مدفوع")}</MenuItem>
          <MenuItem value="unpaid">{t("غير مدفوع")}</MenuItem>
          <MenuItem value="endingToday">{t("تنتهي اليوم")}</MenuItem> {/* ✅ فلتر جديد */}
        </Select>
      </div>

      {loading ? (
        <div className="loading-container">
          <CircularProgress className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* جدول القاعات */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="halls-section"
          >
            <Typography variant="h4" className="section-title halls-title">
              عملاء القاعات
            </Typography>
            
            <TableContainer component={Paper} className="table-container">
              <Table className="data-table" size="medium" stickyHeader>
                <TableHead>
                  <TableRow className="table-header">
                    <TableCell align="center">#</TableCell>
                    <TableCell align="center">رقم العقد</TableCell>
                    <TableCell align="center">اسم العميل</TableCell>
                    <TableCell align="center">رقم الهاتف</TableCell>
                    <TableCell align="center">اسم الجهة</TableCell>
                    <TableCell align="center">تاريخ البداية</TableCell>
                    <TableCell align="center">تاريخ النهاية</TableCell>
                    <TableCell align="center">المبلغ المدفوع</TableCell>
                    <TableCell align="center">الخدمات الإضافية</TableCell> 
                    <TableCell align="center">المبلغ المتبقي</TableCell>
                     <TableCell align="center">التفاصيل</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...halls]
                    .sort((a, b) => new Date(a.period?.endDate) - new Date(b.period?.endDate))
                    .map((row, ind) => (
                      <TableRow key={ind} className={`table-row ${ind % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                        <TableCell align="center">{ind + 1}</TableCell>
                        <TableCell align="center">{row.contractNumber}</TableCell>
                        <TableCell align="center">{row.clientName}</TableCell>
                             <TableCell align="center" style={{ fontFamily: 'Cairo' }}>
                                            <a href={`https://wa.me/${row.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                              <span>{row.phone}</span>
                                              <span style={{ fontSize: '20px' }}>🟢</span>
                                            </a>
                                          </TableCell>
                        <TableCell align="center">{row.entityName}</TableCell>
                        <TableCell align="center">
                          {row.period?.startDate ? new Date(row.period.startDate).toLocaleDateString('EG') : '—'}
                        </TableCell>
                        <TableCell align="center" className={new Date(row.period?.endDate) < new Date() ? 'expired-date' : ''}>
                          {row.period?.endDate ? new Date(row.period.endDate).toLocaleDateString('EG') : '—'}
                        </TableCell>
                        
                              <TableCell align="center" className="paid-amount">{row.totalPaid.toLocaleString()}</TableCell>
                      <TableCell align="center" className="services-amount">{(row.totalServices || 0).toLocaleString()}</TableCell>
                        <TableCell align="center" className="remaining-amount">{row.remainingAmount.toLocaleString()}</TableCell>
                        <TableCell align="center">
                            <Button
                                variant="contained" size="small" onClick={() => navigate(`/reservationDetails/${row.reservationId}`)}
                                style={{ fontFamily: 'Cairo', margin: '0 5px', backgroundColor: '#ca73a6ff', color: '#FFFFFF' }}
                            >
                                {t("reservation.details")}
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  <TableRow className="total-row">
                    <TableCell align="center" colSpan={7}>الإجمالي</TableCell>
                    <TableCell align="center" className="total-paid">{totalPaidHalls.toLocaleString()}</TableCell>
                   <TableCell align="center" className="total-services">{totalServicesHalls.toLocaleString()}</TableCell>
                    <TableCell align="center" className="total-remaining">{totalUnpaidHalls.toLocaleString()}</TableCell>
                      <TableCell></TableCell> 
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>

          {/* جدول الشاليهات */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="chalets-section"
          >
            <Typography variant="h4" className="section-title chalets-title">
              عملاء الشاليهات
            </Typography>

            <TableContainer component={Paper} className="table-container chalets-table">
              <Table className="data-table" size="medium" stickyHeader>
                <TableHead>
                  <TableRow className="table-header chalets-header">
                    <TableCell align="center">#</TableCell>
                    <TableCell align="center">رقم العقد</TableCell>
                    <TableCell align="center">اسم العميل</TableCell>
                    <TableCell align="center">رقم الهاتف</TableCell>
                    <TableCell align="center">اسم الجهة</TableCell>
                    <TableCell align="center">تاريخ البداية</TableCell>
                    <TableCell align="center">تاريخ النهاية</TableCell>
                    <TableCell align="center">المبلغ المدفوع</TableCell>
                      <TableCell align="center">الخدمات الإضافية</TableCell> 
                    <TableCell align="center">المبلغ المتبقي</TableCell>
                    <TableCell align="center">التفاصيل</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...chalets]
                    .sort((a, b) => new Date(a.period?.endDate) - new Date(b.period?.endDate))
                    .map((row, ind) => (
                      <TableRow key={ind} className={`table-row ${ind % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                        <TableCell align="center">{ind + 1}</TableCell>
                        <TableCell align="center">{row.contractNumber || '—'}</TableCell>
                        <TableCell align="center">{row.clientName}</TableCell>
                         <TableCell align="center" style={{ fontFamily: 'Cairo' }}>
                                            <a href={`https://wa.me/${row.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                              <span>{row.phone}</span>
                                              <span style={{ fontSize: '20px' }}>🟢</span>
                                            </a>
                                          </TableCell>
                        <TableCell align="center">{row.entityName}</TableCell>
                        <TableCell align="center">
                          {row.period?.startDate ? new Date(row.period.startDate).toLocaleDateString('EG') : '—'}
                        </TableCell>
                        <TableCell align="center" className={new Date(row.period?.endDate) < new Date() ? 'expired-date' : ''}>
                          {row.period?.endDate ? new Date(row.period.endDate).toLocaleDateString('EG') : '—'}
                        </TableCell>
                        <TableCell align="center" className="paid-amount">{row.totalPaid?.toLocaleString()}</TableCell>
                       <TableCell align="center" className="services-amount">{(row.totalServices || 0).toLocaleString()}</TableCell>
                        <TableCell align="center" className="remaining-amount">{row.remainingAmount?.toLocaleString()}</TableCell>
                        <TableCell align="center">
                            <Button
                                variant="contained" size="small" onClick={() => navigate(`/reservationDetails/${row.reservationId}`)}
                                style={{ fontFamily: 'Cairo', margin: '0 5px', backgroundColor: '#ca73a6ff', color: '#FFFFFF' }}
                            >
                                {t("reservation.details")}
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                  <TableRow className="total-row chalets-total">
                    <TableCell align="center" colSpan={7}>الإجمالي</TableCell>
                    <TableCell align="center" className="total-paid">{totalPaidChalets.toLocaleString()}</TableCell>
                     <TableCell align="center" className="total-services">{totalServicesChalets.toLocaleString()}</TableCell>
                    <TableCell align="center" className="total-remaining">{totalUnpaidChalets.toLocaleString()}</TableCell>
                     <TableCell></TableCell> 
                    
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default UnPaidClients;