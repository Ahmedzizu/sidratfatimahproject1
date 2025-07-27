import React, { useEffect, useState } from 'react';
import EmployeeNavigation from '../components/EmployeeNavigation';
import { TextField, Button } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import '../scss/addChalets.scss';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployeeAbsence } from './../redux/reducers/employee';
import DeleteDialoge from '../components/DeleteDialoge';
import { useTranslation } from 'react-i18next';
import '../scss/employee.scss';
import AddEmployeeAbsence from '../modals/AddEmployeeAbsence';
import axios from 'axios'; // ✅ استيراد axios

const EmployeeAbsense = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const [deleteId, setDeletedId] = useState();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({ data: {}, update: false, open: false });
  const user = useSelector((state) => state.employee.value.user);
  const data = useSelector((state) => state.employee.value.absence);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = [...new Set(data.filter(item => item?.date).map(item => item.date.split('-')[0]))];
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);

  useEffect(() => {
    dispatch(fetchEmployeeAbsence());
  }, [dispatch]);

  const handleClose = () => {
    dispatch(fetchEmployeeAbsence());
    setDeleteOpen(false);
    setEditData({ data: {}, update: false, open: false });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/employee/absence/${deleteId}`);
      dispatch(fetchEmployeeAbsence()); // ✅ تحديث بعد الحذف
      handleClose();
    } catch (error) {
      console.error('Error deleting absence:', error);
    }
  };

  const handleOpenEdit = (data) => {
    setEditData({ open: true, update: true, data });
  };

  const openDelete = (id) => {
    setDeletedId(id);
    setDeleteOpen(true);
  };

  let filteredData = data;

  if (selectedMonth) {
    filteredData = filteredData.filter((ele) => {
      if (!ele?.date) return false;
      let tempMonth = parseInt(ele.date.split('-')[1]) - 1;
      return tempMonth === months.indexOf(selectedMonth);
    });
  }

  if (selectedYear) {
    filteredData = filteredData.filter((ele) => {
      if (!ele?.date) return false;
      let tempYear = parseInt(ele.date.split('-')[0]);
      return tempYear === parseInt(selectedYear);
    });
  }

  return (
    <>
      <EmployeeNavigation id={2} />
      <div className="cont" style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
        <h2>{t('employee.employeeAbsence')}</h2>
        <div className="search-box">
          <select className="select-filter" value={selectedMonth} onChange={handleMonthChange}>
            <option value="">All</option>
            {months.map((month, index) => (
              <option key={index} value={month}>{month}</option>
            ))}
          </select>
          <select value={selectedYear} className="select-filter" onChange={handleYearChange}>
            <option value="">All</option>
            {years.map((year, index) => (
              <option key={index} value={year}>{year}</option>
            ))}
          </select>
          <Button onClick={() => setEditData({ open: true })} variant="contained" className="btn">
            {t('employee.employeAbsence')}
          </Button>
        </div>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead className="tablehead">
              <TableRow>
                <TableCell align="center" className="table-row">{t('employee.name')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.type')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.delayTime')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.phone')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.position')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.date')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.edit')}</TableCell>
                <TableCell align="center" className="table-row">{t('employee.delete')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, ind) => (
                <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" align="center" scope="row">{row?.employee?.name}</TableCell>
                  <TableCell align="center">{row.type === 'delay' ? 'تأخير' : 'غياب'}</TableCell>
                  <TableCell align="center">{row.delay || '-'}</TableCell>
                  <TableCell component="th" align="center" scope="row">{row?.employee?.phone}</TableCell>
                  <TableCell align="center">{row?.employee?.position}</TableCell>
                  <TableCell align="center">{row.date}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      onClick={() => handleOpenEdit(row)}
                    >
                      {t('employee.edit')}
                    </Button>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={() => openDelete(row._id)}
                    >
                      {t('employee.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <DeleteDialoge 
        url="/employee/absence/" 
        id={deleteId} 
        open={deleteOpen} 
        handleClose={handleClose} 
        handleDelete={handleDelete} // ✅ مضاف هون كمان
      />
      <AddEmployeeAbsence handleClose={handleClose} data={editData.data} update={editData.update} open={editData.open} />
    </>
  );
};

export default EmployeeAbsense;
