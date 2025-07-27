import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, Grid, TextField, Modal, List, ListItem, ListItemText, Divider } from '@mui/material';
import Api from '../config/config'; // تأكد من صحة المسار

// --- Modal Style ---
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const DrawersAdminPage = () => {
    const [drawers, setDrawers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [newDrawer, setNewDrawer] = useState({ name: '', balance: 0 });

    // 1. جلب كل الأدراج عند تحميل الصفحة
    const fetchDrawers = async () => {
        try {
            setLoading(true);
            // نفترض أن لديك مسار API لجلب كل الأدراج
            const { data } = await Api.get('/api/drawers'); 
            setDrawers(data);
        } catch (error) {
            console.error('فشل في جلب الأدراج:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrawers();
    }, []);

    // 2. دالة لإنشاء درج جديد
    const handleCreateDrawer = async () => {
        if (!newDrawer.name) {
            alert('يرجى إدخال اسم للدرج.');
            return;
        }
        try {
            // نفترض أن لديك مسار API لإنشاء درج جديد
            await Api.post('/api/drawers/create', newDrawer);
            setModalOpen(false);
            setNewDrawer({ name: '', balance: 0 });
            fetchDrawers(); // إعادة جلب الأدراج لتحديث القائمة
            alert('تم إنشاء الدرج بنجاح!');
        } catch (error) {
            console.error('فشل في إنشاء الدرج:', error);
            alert(error.response?.data?.message || 'فشل في إنشاء الدرج');
        }
    };
    
    const formatDateTime = (dateString) => new Date(dateString).toLocaleString("ar-EG");


    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">إدارة الأدراج</Typography>
                <Button variant="contained" onClick={() => setModalOpen(true)}>
                    إنشاء درج جديد
                </Button>
            </Box>

            <Grid container spacing={3}>
                {drawers.map((drawer) => (
                    <Grid item xs={12} md={6} lg={4} key={drawer._id}>
                        <Paper elevation={3} sx={{ p: 2, backgroundColor: drawer.isActive ? '#fffde7' : 'white' }}>
                            <Typography variant="h6">{drawer.name}</Typography>
                            <Typography color="text.secondary">
                                الحالة: {drawer.isActive ? `قيد الاستخدام (الموظف: ${drawer.currentEmployee?.name || 'غير معروف'})` : 'متاح'}
                            </Typography>
                            <Typography variant="h5" sx={{ my: 1, color: 'primary.main' }}>
                                الرصيد الحالي: {drawer.balance.toFixed(2)} ريال
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2">تاريخ الاستخدام:</Typography>
                            <List dense>
                                {drawer.history.slice(-3).map((h, index) => ( // عرض آخر 3 استخدامات
                                    <ListItem key={index}>
                                        <ListItemText 
                                            primary={`الموظف: ${h.employee?.name || 'غير معروف'}`}
                                            secondary={`من: ${formatDateTime(h.shiftStart)} إلى: ${h.shiftEnd ? formatDateTime(h.shiftEnd) : 'الآن'}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Modal for creating a new drawer */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box sx={style}>
                    <Typography variant="h6" component="h2">إنشاء درج جديد</Typography>
                    <TextField
                        label="اسم الدرج"
                        fullWidth
                        margin="normal"
                        value={newDrawer.name}
                        onChange={(e) => setNewDrawer({ ...newDrawer, name: e.target.value })}
                    />
                    <TextField
                        label="الرصيد الافتتاحي"
                        type="number"
                        fullWidth
                        margin="normal"
                        value={newDrawer.balance}
                        onChange={(e) => setNewDrawer({ ...newDrawer, balance: parseFloat(e.target.value) || 0 })}
                    />
                    <Button variant="contained" fullWidth onClick={handleCreateDrawer} sx={{ mt: 2 }}>
                        إنشاء
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default DrawersAdminPage;
