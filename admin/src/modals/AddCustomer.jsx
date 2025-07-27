// AddCutomerModal.js (Frontend Component)
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import "../scss/addChalets.scss";
import { Grid, InputLabel, TextField } from "@mui/material";
import Api from "./../config/config";
import { useDispatch } from "react-redux";
import { fetchCustomer } from "../redux/reducers/customer";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
};

function AddCutomerModal({ handleClose, open, data: temp, update }) {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        name: "",
        idNumber: "",
        nationality: "",
        phone: "",
        address: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [backendErrors, setBackendErrors] = useState({});
    const [frontendErrors, setFrontendErrors] = useState({});

    const dispatch = useDispatch();

    useEffect(() => {
        if (open) { // عند فتح المودال بشكل عام (إضافة أو تعديل)
            if (update && temp) { // وضع التعديل
                setFormData({
                    name: temp.name || "",
                    idNumber: temp.idNumber || "",
                    nationality: temp.nationality || "",
                    phone: temp.phone || "",
                    address: temp.address || "",
                    email: temp.email || "",
                    password: "", // لا نعرض الباسورد الموجود
                    confirmPassword: "", // لا نعرض الباسورد الموجود
                });
            } else { // وضع الإضافة
                setFormData({
                    name: "",
                    idNumber: "",
                    nationality: "",
                    phone: "",
                    address: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
            }
            setBackendErrors({}); // مسح الأخطاء عند فتح المودال
            setFrontendErrors({});
        }
    }, [open, update, temp]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // مسح الخطأ بمجرد تغيير الحقل
        setBackendErrors((prev) => ({ ...prev, [name]: '' }));
        setFrontendErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateFrontend = () => {
        let errors = {};
        // التحقق من الاسم ثلاثي
        if (formData.name && formData.name.trim().split(' ').length < 3) {
            errors.name = t("full_name_required");
        }
        // التحقق من تطابق كلمة المرور (إذا كانت العملية إضافة)
        // في وضع التعديل، حقول كلمة المرور مش موجودة، فلا داعي للتحقق
        if (!update && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = t("password_mismatch");
        }
        setFrontendErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFrontend()) {
            toast.error(t("please_correct_errors"));
            return;
        }

        setBackendErrors({});

        let url;
        let dataToSend = { ...formData };

        if (update) {
            url = `/admin/customer/${temp._id}`;
            // لا نرسل كلمة المرور عند التعديل من هذا المودال
            delete dataToSend.password;
            delete dataToSend.confirmPassword;
            // تأكد أن الـ _id لا يرسل في الـ body في حالة التعديل لو كان موجود في الـ formData
            delete dataToSend._id; 
        } else {
            url = '/admin/customer';
            // في حالة الإضافة، لو الإيميل أو الباسورد فاضيين، احذفهم من الـ dataToSend عشان ما يبعتوش قيم فارغة
            if (!dataToSend.email) delete dataToSend.email;
            if (!dataToSend.password) delete dataToSend.password;
            // لو فيه باسورد وتاكيد باسورد ومش متطابقين، اظهر الخطأ
            if (dataToSend.password && dataToSend.password !== dataToSend.confirmPassword) {
                setFrontendErrors(prev => ({...prev, confirmPassword: t("password_mismatch")}));
                toast.error(t("password_mismatch"));
                return;
            }
        }

        try {
            const method = update ? Api.patch : Api.post;
            const response = await method(url, dataToSend);

            dispatch(fetchCustomer());
            toast.success(t("customer_operation_successful"));
            handleClose();
        } catch (err) {
            console.error("Error in customer operation:", err.response?.data || err.message);
            const errorData = err.response?.data;
            if (errorData?.message) {
                toast.error(errorData.message);
            } else if (errorData?.errors) {
                // لو الـ Backend بيرجع أخطاء لكل حقل، اعرضها
                setBackendErrors(errorData.errors);
                toast.error(t("please_correct_errors"));
            } else {
                toast.error(t("failed_to_perform_operation"));
            }
        }
    };

    return (
        <div>
            <Modal
                style={{ direction: i18n.language === 'en' ? 'ltr' : 'rtl' }}
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className='model'>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 5 }}>
                        {update ? t("client.edit") : t("client.add")} {t("client.title")}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="name">{t("client.name")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={!!frontendErrors.name || !!backendErrors.name}
                                    helperText={frontendErrors.name || backendErrors.name}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="idNumber">{t("client.id")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type="text"
                                    name="idNumber"
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    error={!!backendErrors.idNumber}
                                    helperText={backendErrors.idNumber}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="nationality">{t("الجنسية")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type="text"
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    error={!!backendErrors.nationality}
                                    helperText={backendErrors.nationality}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="phone">{t("client.phone")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    error={!!backendErrors.phone}
                                    helperText={backendErrors.phone}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="address">{t("client.address")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    error={!!backendErrors.address}
                                    helperText={backendErrors.address}
                                />
                            </Grid>

                            {/* البريد الإلكتروني وكلمة المرور:
                                حقل البريد الإلكتروني يظهر دائماً (لأننا نريد تعديله في وضع التعديل)
                                حقول كلمة المرور تظهر فقط عند الإضافة */}
                            <Grid item xs={6}>
                                <InputLabel htmlFor="email">{t("client.email")}</InputLabel>
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!backendErrors.email}
                                    helperText={backendErrors.email || t("email_optional_note")}
                                />
                            </Grid>
                            {!update && ( // حقول كلمة المرور تظهر فقط في وضع الإضافة
                                <>
                                    <Grid item xs={6}>
                                        <InputLabel htmlFor="password">{t("client.password")}</InputLabel>
                                        <TextField
                                            variant="outlined"
                                            fullWidth
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            error={!!backendErrors.password || !!frontendErrors.password}
                                            helperText={backendErrors.password || frontendErrors.password || t("password_optional_note")}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <InputLabel htmlFor="confirmPassword">{t("client.confirmPassword")}</InputLabel>
                                        <TextField
                                            variant="outlined"
                                            fullWidth
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={!!frontendErrors.confirmPassword}
                                            helperText={frontendErrors.confirmPassword}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <Button
                                    variant='contained'
                                    type='submit'
                                    fullWidth
                                    style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}
                                >
                                    {update ? t("client.update") : t("client.add")}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
export default AddCutomerModal;