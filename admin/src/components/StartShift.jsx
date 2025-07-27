import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Button, CircularProgress, Paper, Grid } from '@mui/material';
import Api from '../config/config';

// نستقبل الدالة "onShiftStarted" كخاصية (prop)
const StartShift = ({ onShiftStarted }) => { 
    const [drawers, setDrawers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrawer, setSelectedDrawer] = useState(null);
    const { user } = useSelector((state) => state.employee.value);

    useEffect(() => {
        const fetchAvailableDrawers = async () => {
            try {
                setLoading(true);
                const { data } = await Api.get('/api/drawers/available');
                setDrawers(data);
            } catch (error) {
                console.error('فشل في جلب الأدراج المتاحة:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableDrawers();
    }, []);

    const handleStartShift = async (drawerId) => {
        setSelectedDrawer(drawerId);
        try {
            await Api.post('/api/drawers/start-shift', {
                drawerId: drawerId,
                employeeId: user._id,
            });
            
             localStorage.setItem('activeDrawerName', data.drawer.name);
            localStorage.setItem('activeShiftStartTime', new Date().toISOString());

            alert('تم بدء الوردية بنجاح!');

            // ✅ إعادة تحميل الصفحة بالكامل لضمان تحديث كل شيء بشكل صحيح
            window.location.reload();
        } catch (error) {
            console.error('فشل في بدء الوردية:', error);
            alert(error.response?.data?.message || 'فشل في بدء الوردية');
            setSelectedDrawer(null);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: 'auto', textAlign: 'center' }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    بدء وردية جديدة
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    مرحباً {user?.name}, يرجى اختيار الدرج الذي ستعمل عليه.
                </Typography>
                {drawers.length > 0 ? (
                    <Grid container spacing={2} justifyContent="center">
                        {drawers.map((drawer) => (
                            <Grid item xs={12} sm={6} md={4} key={drawer._id}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={() => handleStartShift(drawer._id)}
                                    disabled={!!selectedDrawer}
                                >
                                    {selectedDrawer === drawer._id ? <CircularProgress size={24} /> : drawer.name}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Typography color="error">لا توجد أدراج متاحة حالياً.</Typography>
                )}
            </Paper>
        </Box>
    );
};

export default StartShift;
