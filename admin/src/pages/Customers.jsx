// Customers.js (Frontend Component)
import React, { useEffect, useState } from 'react';
import { TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email'; // ممكن ما تحتاجهاش لو مش بتعمل بيها حاجة
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import "../scss/addChalets.scss";
import { useDispatch, useSelector } from 'react-redux';
import Api from './../config/config';
import AddCutomerModal from '../modals/AddCustomer';
import { fetchCustomer } from './../redux/reducers/customer';
import { useTranslation } from 'react-i18next';
import UserReservationsDetails from '../modals/UserReservationsDetails';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Customers = () => {
    const user = useSelector((state) => state.employee.value.user); // تأكد إن الـ state ده موجود وصحيح
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [temp, setTemp] = useState();
    const dispatch = useDispatch();
    const [update, setUpdate] = useState(false);
    const [details, setDetails] = useState({ open: false, id: '', name: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const url = searchQuery ? `/admin/customer?search=${searchQuery}` : '/admin/customer';
        Api.get(url)
            .then((res) => {
                dispatch(fetchCustomer.fulfilled(res.data));
            })
            .catch((err) => {
                console.error("Error fetching customers:", err.response?.data || err.message);
                toast.error(t("failed_to_fetch_customers"));
            });
    }, [dispatch, searchQuery, t]);

    const handleOpenAdd = () => {
        setTemp(null);
        setUpdate(false);
        setOpen(true);
    };

    const handleClose = () => {
        setUpdate(false);
        setOpen(false);
        setDetails({ open: false, id: '', name: '' });
        setTemp(null);
    };

    const handleOpenEdit = (dataToEdit) => {
        setTemp(dataToEdit);
        setOpen(true);
        setUpdate(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("confirm_delete_customer"))) {
            try {
                await Api.delete(`/admin/customer/${id}`); // المسار ده هيكون محتاج تعديل في الـ Backend لو مش متطابق
                dispatch(fetchCustomer());
                toast.success(t("customer_deleted_successfully"));
            } catch (err) {
                console.error("Error deleting customer:", err.response?.data || err.message);
                toast.error(t("failed_to_delete_customer") + (err.response?.data?.message || ""));
            }
        }
    };

    const handleVerifyEmail = async (customerId, currentEmailStatus) => {
        if (currentEmailStatus) {
            toast.info(t("email_already_verified"));
            return;
        }
        if (window.confirm(t("confirm_verify_email"))) {
            try {
                // ✅ المسار هنا `verify-email`، تأكد إنه هو نفسه في الـ Backend
                await Api.patch(`/admin/customer/verify-email/${customerId}`);
                dispatch(fetchCustomer());
                toast.success(t("email_verified_successfully"));
            } catch (err) {
                console.error("Error verifying email:", err.response?.data || err.message);
                toast.error(t("failed_to_verify_email") + (err.response?.data?.message || ""));
            }
        }
    };

    const handleResetPassword = async (customerId) => {
        if (window.confirm(t("confirm_reset_password"))) {
            try {
                // ✅ المسار هنا `reset-password`، تأكد إنه هو نفسه في الـ Backend
                await Api.patch(`/admin/customer/reset-password/${customerId}`);
                dispatch(fetchCustomer());
                toast.success(t("password_reset_successfully"));
            } catch (err) {
                console.error("Error resetting password:", err.response?.data || err.message);
                toast.error(t("failed_to_reset_password") + (err.response?.data?.message || ""));
            }
        }
    };

    const handleSendWhatsappMessage = (phone, email, idNumber) => {
        const lastThreeIdDigits = idNumber ? String(idNumber).slice(-3) : '***';
        const message = `${t("whatsapp_welcome_message")}\n${t("whatsapp_email_is")}: ${email || t("not_available")}\n${t("whatsapp_password_hint")}: ${t("id_number")} (${lastThreeIdDigits})`;
        
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const customersData = useSelector((state) => state.customer.value.data);

    return (
        <div style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}>
            <div className="cont">
                <h2>{t("client.title")}</h2>
                <div className="search-box">
                    <TextField
                        type="text"
                        variant="outlined"
                        value={searchQuery}
                        placeholder={t("search_by_name_phone_email_nationality")}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ marginLeft: "20px", borderRadius: "50px" }}
                    />
                    <Button onClick={handleOpenAdd} variant='contained' className='btn'>{t("client.addBtn")}</Button>
                </div>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead className='tablehead'>
                            <TableRow>
                                <TableCell align='center' className='table-row'>{t("client.name")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("client.email")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("client.id")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("الجنسية")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("client.phone")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("client.address")}</TableCell>
                                <TableCell align='center' className='table-row'>{t("actions")}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {customersData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        {t("no_customers_found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customersData.map((row) => (
                                    <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell align="center">{row.name}</TableCell>
                                        <TableCell align="center">{row.email || "-"}</TableCell>
                                        <TableCell align="center">{row.idNumber}</TableCell>
                                        <TableCell align="center">{row.nationality}</TableCell>
                                        <TableCell align="center">{row.phone}</TableCell>
                                        <TableCell align="center">{row.address || "-"}</TableCell>
                                        <TableCell align="center">
                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Button
                                                    variant='contained'
                                                    size='small'
                                                    color='primary'
                                                    onClick={() => setDetails({ open: true, id: row._id, name: row.name })}
                                                >
                                                    {t("client.details")}
                                                </Button>

                                                <Button
                                                    variant='contained'
                                                    size='small'
                                                    color='warning'
                                                    onClick={() => handleOpenEdit(row)}
                                                >
                                                    {t("client.edit")}
                                                </Button>

                                                <Button
                                                    variant='contained'
                                                    size='small'
                                                    color='error'
                                                    onClick={() => handleDelete(row._id)}
                                                >
                                                    {t("client.delete")}
                                                </Button>

                                                <IconButton
                                                    color={row.emailVerification ? "success" : "error"}
                                                    onClick={() => handleVerifyEmail(row._id, row.emailVerification)}
                                                    title={row.emailVerification ? t("email_verified") : t("email_not_verified")}
                                                    sx={{ '&:hover': { backgroundColor: row.emailVerification ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)' } }}
                                                >
                                                    {row.emailVerification ? <CheckCircleIcon /> : <VisibilityOffIcon />}
                                                </IconButton>

                                                {row.idNumber && (
                                                    <IconButton
                                                        color="info"
                                                        onClick={() => handleResetPassword(row._id)}
                                                        title={t("reset_password_to_id_number")}
                                                    >
                                                        <LockResetIcon />
                                                    </IconButton>
                                                )}

                                                {row.phone && (
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => handleSendWhatsappMessage(row.phone, row.email, row.idNumber)}
                                                        title={t("send_whatsapp_message")}
                                                    >
                                                        <WhatsAppIcon />
                                                    </IconButton>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <AddCutomerModal update={update} handleClose={handleClose} data={temp} open={open} />
                <UserReservationsDetails handleClose={handleClose} data={temp} open={details.open} id={details.id} name={details.name} />
            </div>
        </div>
    );
};

export default Customers;