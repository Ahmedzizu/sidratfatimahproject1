import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, IconButton, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import Api from '../config/config';
import format from 'date-fns/format';
import { parseISO } from 'date-fns';

import '../scss/_reservationDetailsModal.scss';

// دوال مساعدة لتنسيق البيانات
const getStatusInArabic = (status) => {
  switch (status) {
    case "confirmed":
      return 'مؤكد';
    case "completed":
      return 'مكتمل';
    case "unConfirmed":
      return 'غير مؤكد';
    case "deferred":
      return 'مؤجل';
    case "canceled":
      return 'ملغى';
    default:
      return 'غير معروف';
  }
};

const formatTime12Hour = (timeString) => {
  if (!timeString || !timeString.includes(':')) return '';
  const [hour, minute] = timeString.split(':');
  let h = parseInt(hour, 10);
  const ampm = (h >= 12 ? 'م' : 'ص');
  h = h % 12;
  h = h ? h : 12;
  const minuteStr = minute.padStart(2, '0');
  return `${h}:${minuteStr} ${ampm}`;
};

const ReservationDetailsModal = ({ open, handleClose, reservation }) => {
    const { t, i18n } = useTranslation();
    
    const [payments, setPayments] = useState([]);
    const [paidServices, setPaidServices] = useState([]);
    const [freeServices, setFreeServices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [totalServices, setTotalServices] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [remainingAmount, setRemainingAmount] = useState(0);

    const fetchReservationData = async () => {
        if (!reservation) return;
        setLoading(true);
        try {
            const paymentsRes = await Api.get(`/reservation-payments/get-payment/${reservation._id}`);
            const fetchedPayments = paymentsRes.data || [];
            setPayments(fetchedPayments);

            const servicesRes = await Api.get(`/admin/reservation/service/${reservation._id}`);
            const allServices = servicesRes.data || [];
            
            setPaidServices(allServices.filter(s => s.type === 'service'));
            setFreeServices(allServices.filter(s => s.type === 'free'));
            setRequests(allServices.filter(s => s.type === 'request'));

            const servicesTotal = allServices.reduce((prev, cur) => prev + parseFloat(cur?.price || 0), 0);
            const paidTotal = fetchedPayments.reduce((prev, cur) => prev + parseFloat(cur?.paid || 0), 0);

            setTotalServices(servicesTotal);
            setTotalPaid(paidTotal);

            const initialCost = parseFloat(reservation?.cost || 0);
            const discount = parseFloat(reservation?.discountAmount || 0);
            const calculatedRemaining = (initialCost - discount + servicesTotal) - paidTotal;
            setRemainingAmount(calculatedRemaining);
            
        } catch (error) {
            console.error('Failed to fetch reservation details:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (open && reservation) {
            fetchReservationData();
        }
        if(!open) {
            setPayments([]);
            setPaidServices([]);
            setFreeServices([]);
            setRequests([]);
            setTotalServices(0);
            setTotalPaid(0);
            setRemainingAmount(0);
        }
    }, [open, reservation]);

    if (!reservation) {
        return null;
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth className="reservation-details-modal">
            <DialogTitle>
                <Typography variant="h6">{t('common.reservationDetails')}</Typography>
                <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box className="loading-box">
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" className="section-title">{t('details.reservationInfo')}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow><TableCell>{t('details.customerName')}</TableCell><TableCell>{reservation.client?.name || '---'}</TableCell></TableRow>
                                    {/* 👈 تم إضافة رقم العقد هنا */}
                                    <TableRow><TableCell>{t('details.contractNumber')}</TableCell><TableCell>{reservation.contractNumber || '---'}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.bookingAmount')}</TableCell><TableCell>{reservation.cost || 0} {t('common.currency')}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.discount')}</TableCell><TableCell>{reservation.discountAmount || 0} {t('common.currency')}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.reservationStatus')}</TableCell><TableCell>{getStatusInArabic(reservation.status)}</TableCell></TableRow>
                                    <TableRow>
                                        <TableCell>{t('details.checkInDate')}</TableCell>
                                        {/* 👈 تم إضافة فئة تنسيق التاريخ */}
                                        <TableCell className="date-details">{format(parseISO(reservation.period.startDate), 'yyyy-MM-dd')}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>{t('details.checkOutDate')}</TableCell>
                                        {/* 👈 تم إضافة فئة تنسيق التاريخ */}
                                        <TableCell className="date-details">{format(parseISO(reservation.period.endDate), 'yyyy-MM-dd')}</TableCell>
                                    </TableRow>
                                    <TableRow><TableCell>{t('details.checkInTime')}</TableCell><TableCell>{reservation.period.checkIn?.time || '---'}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.checkOutTime')}</TableCell><TableCell>{reservation.period.checkOut?.time || '---'}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.additionalServices')}</TableCell><TableCell>{totalServices.toFixed(2)} {t('common.currency')}</TableCell></TableRow>
                                    <TableRow><TableCell>{t('details.paid')}</TableCell><TableCell>{totalPaid.toFixed(2)} {t('common.currency')}</TableCell></TableRow>
                                    <TableRow>
                                        <TableCell>{t('details.remaining')}</TableCell>
                                        {/* 👈 تم إضافة فئة تنسيق المبلغ المتبقي */}
                                        <TableCell className="remaining-amount">{remainingAmount.toFixed(2)} {t('common.currency')}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Typography variant="h6" className="section-title">{t('payments.title')}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{t('payments.table.type')}</TableCell>
                                        <TableCell align="center">{t('payments.table.amount')}</TableCell>
                                        <TableCell align="center">{t('payments.table.insurance')}</TableCell>
                                        <TableCell align="center">{t('payments.table.bank')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payments.length > 0 ? payments.map((p, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center">{p.type}</TableCell>
                                            <TableCell align="center">{p.paid}</TableCell>
                                            <TableCell align="center">{p.insurance}</TableCell>
                                            <TableCell align="center">{p.type === 'تحويل بنكي' ? (p.bank?.name || '---') : '---'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} align="center">{t('payments.noPayments')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" className="section-title">{t('additionalServices.title')}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{t('additionalServices.table.service')}</TableCell>
                                        <TableCell align="center">{t('additionalServices.table.type')}</TableCell>
                                        <TableCell align="center">{t('additionalServices.table.pricePerUnit')}</TableCell>
                                        <TableCell align="center">{t('additionalServices.table.totalAmount')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paidServices.length > 0 ? paidServices.map((s, index) => {
                                      const pricePerUnit = s.price / s.number;
                                      return (
                                        <TableRow key={index}>
                                            <TableCell align="center">{s.service}</TableCell>
                                            <TableCell align="center">{s.package || '---'}</TableCell>
                                            <TableCell align="center">{pricePerUnit.toFixed(2)}</TableCell>
                                            <TableCell align="center">{s.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}) : (
                                        <TableRow><TableCell colSpan={4} align="center">{t('additionalServices.noServices')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Typography variant="h6" className="section-title">{t('freeServices.title')}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{t('freeServices.table.service')}</TableCell>
                                        <TableCell align="center">{t('freeServices.table.count')}</TableCell>
                                        <TableCell align="center">{t('freeServices.table.notes')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {freeServices.length > 0 ? freeServices.map((s, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center">{s.service}</TableCell>
                                            <TableCell align="center">{s.number}</TableCell>
                                            <TableCell align="center">{s.note || '---'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} align="center">{t('freeServices.noFreeServices')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Typography variant="h6" className="section-title">{t('requests.title')}</Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">{t('requests.table.service')}</TableCell>
                                        <TableCell align="center">{t('requests.table.statement')}</TableCell>
                                        <TableCell align="center">{t('requests.table.price')}</TableCell>
                                        <TableCell align="center">{t('requests.table.notes')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.length > 0 ? requests.map((s, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center">{s.service}</TableCell>
                                            <TableCell align="center">{s.statement}</TableCell>
                                            <TableCell align="center">{s.price}</TableCell>
                                            <TableCell align="center">{s.note || '---'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} align="center">{t('requests.noRequests')}</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReservationDetailsModal;