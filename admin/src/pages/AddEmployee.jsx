import React, { useEffect, useState } from 'react';
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
import axios from 'axios'; // استيراد axios
import { fetchEmploees } from './../redux/reducers/employee';
import AddEmployeeModal from './../modals/AddEmployeeModal';
import Permissions from './../modals/Permissions';
import DeleteDialoge from './../components/DeleteDialoge';
import { useTranslation } from 'react-i18next';
import '../scss/employee.scss';
import { useNavigate } from 'react-router-dom';
import EmployeeNavigation from './../components/EmployeeNavigation';
import PermissionsControl from './../components/PermissionsControl';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [deleteId, setDeleteId] = useState();
  const [id, setId] = useState();
  const [temp, setTemp] = useState();
  const user = useSelector((state) => state.employee.value.user);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setOpen2(false);
    setTemp(null);
    setDeleteOpen(false);
  };
  const [search, setSearch] = useState('');
  const dispatch = useDispatch();
  const data = useSelector((state) => state.employee.value.data);
  useEffect(() => {
    dispatch(fetchEmploees());
  }, [dispatch]);

  const handleOpen2 = (id) => {
    setId(id);
    setOpen2(true);
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleOpenEdit = (data) => {
    setTemp(data);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/employee/data/${deleteId}`);
      dispatch(fetchEmploees()); // تحديث قائمة الموظفين بعد الحذف
      handleClose();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  let filteredData = data;
  if (search) filteredData = filteredData.filter((ele) => ele.name.includes(search));

  return (
    <>
      <EmployeeNavigation id={1} />
      <PermissionsControl role="employee">
        <div className="cont" style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
          <h2>{t('employee.title')}</h2>
          <div className="search-box">
            <TextField
              type="text"
              variant="outlined"
              value={search}
              placeholder={t('dashboard.search')}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ marginLeft: '20px', borderRadius: '50px' }}
            />
            <Button onClick={handleOpen} variant="contained" className="btn">
              {t('employee.add')}
            </Button>
          </div>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead className="tablehead">
                <TableRow>
                  <TableCell align="center" className="table-row">
                    {t('employee.name')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.id')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.position')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.salary')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.phone')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.email')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.permissions')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.edit')}
                  </TableCell>
                  <TableCell align="center" className="table-row">
                    {t('employee.delete')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, ind) => (
                  <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" align="center" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell component="th" align="center" scope="row">
                      {row.nationalId}
                    </TableCell>
                    <TableCell component="th" align="center" scope="row">
                      {row.position}
                    </TableCell>
                    <TableCell align="center">{row.salary}</TableCell>
                    <TableCell align="center">{row.phone}</TableCell>
                    <TableCell align="center">{row.email}</TableCell>
                    <TableCell align="center">
                      <Button variant="contained" size="small" onClick={() => handleOpen2(row)}>
                        {t('employee.permissions')}
                      </Button>
                    </TableCell>
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
          <AddEmployeeModal handleClose={handleClose} data={temp} handleOpen={handleOpen} open={open} />
          <Permissions handleClose={handleClose} open={open2} data={id} />
          <DeleteDialoge 
            url={'/employee/data/'} 
            id={deleteId} 
            open={deleteOpen} 
            handleClose={handleClose} 
            handleDelete={handleDelete} // ✅ هي هون كانت ناقصة
          />
        </div>
      </PermissionsControl>
    </>
  );
};

export default AddEmployee;

 
