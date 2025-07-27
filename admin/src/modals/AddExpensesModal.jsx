import React, { forwardRef, useState, useRef, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,Alert,
} from "@mui/material";
import "../scss/addChalets.scss";
import Api from "./../config/config";
import { useDispatch } from "react-redux";
import { fetchExpenses } from "../redux/reducers/finance";
import { useTranslation } from "react-i18next";

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

const guaranteeOptions = [
  { label: "بضمان", value: "بضمان", key: "Guarantee" },
  { label: "بدون ضمان", value: "بدون ضمان", key: "noGuarantee" },
];

const expenseTypes = [
  { label: "صيانة", value: "صيانة", key: "Maintenance" },
  { label: "كهرباء", value: "كهرباء", key: "Electricity" },
  { label: "مياه", value: "مياه", key: "Water" },
  { label: "مشتريات", value: "مشتريات", key: "Purchases" },
  { label: "مرتبات", value: "مرتبات", key: "Salaries" },
  { label: "أخرى", value: "أخرى", key: "Other" },
];

const billTypes = [
  { label: "نقدي", value: "نقدي", key: "Cash" },
  { label: "تحويل بنكي", value: "تحويل بنكي", key: "BankTransfer" },
  { label: "شيك", value: "شيك", key: "Check" },
  { label: "أخرى", value: "أخرى", key: "Other" },
];

const AddExpensesModal = forwardRef(
  // ✅ إضافة employeeName كـ prop
  ({ handleClose, open, data: temp, update, employeeName }, ref) => {
    const [data, setData] = useState({
      type: "",
      reciver: "",
      billType: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      bill: "",
      guarantee: "",
      bank: "",
      note: "", // تأكد من وجود حقل الملاحظات إذا كنت تستخدمه
    });

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const imagesKey = process.env.REACT_APP_UPLOAD_URL;
 const [customType, setCustomType] = useState('');
    const [banksList, setBanksList] = useState([]);
    const [selectedBankOption, setSelectedBankOption] = useState(null);

    useEffect(() => {
      // ✅ عند فتح المودال أو تحديثه، إذا كان 'temp' موجودًا، قم بتهيئته
      if (temp && update) { // تأكد من وجود update لنميز بين الإضافة والتعديل
        setData({ 
          ...temp, 
          date: temp.date ? temp.date.split('T')[0] : new Date().toISOString().split("T")[0],
          note: temp.note || "", // تأكد من تهيئة الملاحظات
        }); 
        // 💡 جديد: التحقق إذا كان النوع غير قياسي
    const standardTypes = expenseTypes.map(t => t.value);
    if (!standardTypes.includes(temp.type)) {
      setData(prev => ({ ...prev, type: 'أخرى' }));
      setCustomType(temp.type);
    } else {
      setCustomType('');
    }
        // إذا كان نوع الفاتورة تحويل بنكي، حاول إيجاد البنك المختار مسبقًا
        if (temp.billType === 'تحويل بنكي' && temp.bankName) {
          setSelectedBankOption({ label: temp.bankName, value: temp.bankName });
        } else {
          setSelectedBankOption(null);
        }
      } else {
        // لو بنضيف مصروف جديد، صفّر الداتا
        setData({
          type: "",
          reciver: "",
          billType: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          bill: "",
          guarantee: "",
          bankName: "",
          note: "", // صفّر الملاحظات أيضًا
        });
        setFile(null);
        setSelectedBankOption(null);
      }
      setError(null); // مسح الأخطاء عند الفتح/الإغلاق
    }, [temp, open, update]); // أضف 'open' و 'update' كاعتماد لتصفير البيانات عند الإغلاق والفتح

    // جلب قائمة البنوك عند تحميل المكون
    useEffect(() => {
      const fetchBanks = async () => {
        try {
          const res = await Api.get("/bank-details/all"); // تأكد من المسار الصحيح للـ API
          setBanksList(res.data.map(bank => ({ label: bank.name, value: bank._id })));
        } catch (err) {
          console.error("❌ Error fetching banks list in AddExpensesModal", err);
          // يمكنك تعيين رسالة خطأ للمستخدم هنا إذا أردت
        }
      };
      fetchBanks();
    }, []); 
 useEffect(() => {
        console.log("AddExpensesModal received employeeName:", employeeName);
    }, [employeeName, open]);
    
    const handleUploadFile = (e) => {
      const uploadedFile = e.target.files[0];
      if (uploadedFile && !uploadedFile.type.match("image.*")) {
        setError(t("finance.fileTypeError"));
        setFile(null); // مسح الملف غير الصالح
        return;
      }
      setFile(uploadedFile);
      // لا نحتاج لتعيين `bill` في `data` هنا إذا كان `bill` هو اسم الحقل الذي يحمل الملف في FormData
      setError(null);
    };
const handleSubmit = async (e) => {
  e.preventDefault();
    console.log("اسم الموظف المنشئ للمصروف:", employeeName);

  setLoading(true);
  setError(null);
if (data.billType === 'تحويل بنكي' && !data.bank) {
    setError('يرجى اختيار البنك الذي تم الدفع منه.'); // رسالة خطأ واضحة للمستخدم
    setLoading(false); // إيقاف التحميل
    return; // إيقاف إرسال الفورم
  }
  const formData = new FormData();

  // ✅ The corrected loop without duplication
  Object.entries(data).forEach(([key, value]) => {
    if (key === "type") return;
    if (key === "date" && !update) return;
    if (key === "bank" && data.billType !== "تحويل بنكي") return;
    
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  // ✅ Adding the correct type (custom or standard)
  if (data.type === "أخرى" && customType) {
    formData.append("type", customType.trim());
  } else if (data.type) {
    formData.append("type", data.type);
  }

  // ✅ Employee name
  if (employeeName) {
    formData.append("addedByEmployeeName", employeeName);
  }

  // ✅ The file, if it exists
  if (file) {
    formData.append("bill", file);
  }

  try {
    const url = update ? `/api/expenses/${data._id}` : "/api/expenses";
    const method = update ? Api.put : Api.post;

    await method(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    dispatch(fetchExpenses());
    handleClose();
  } catch (err) {
    console.error("❌ Submit Error:", err);
    //
    // Now look at your SERVER'S console for the detailed error message
    //
    if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else if (typeof err.response?.data === "string") {
      setError(err.response.data);
    } else {
      setError(t("finance.submitError"));
    }
  } finally {
    setLoading(false);
  }
};

    return (
      <Modal
        ref={ref}
        open={open}
        onClose={handleClose}
        aria-labelledby="expense-modal-title"
        style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}
      >
        <Box sx={style} className="model">
          <Typography
            variant="h6"
            sx={{ marginBottom: 5 }}
            id="expense-modal-title"
          >
            {update ? t("finance.editExpenses") : t("finance.addExpenses")}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  label={t("finance.receiver")}
                  value={data.reciver}
                  onChange={(e) =>
                    setData({ ...data, reciver: e.target.value })
                  }
                  inputProps={{ "aria-label": t("finance.receiver") }}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={expenseTypes}
    getOptionLabel={(option) => t(`finance.${option.key}`)}
    value={expenseTypes.find((opt) => opt.value === data.type) || null}
    onChange={(e, newValue) => {
      setData({ ...data, type: newValue ? newValue.value : "" });
      if (newValue?.value !== "أخرى") {
        setCustomType("");
      }
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label={t("finance.expensesType")}
        required
        fullWidth
      />
    )}
  />
</Grid>

{data.type === "أخرى" && (
  <Grid item xs={12}>
    <TextField
      variant="outlined"
      fullWidth
      required
      label={t("finance.customExpenseType")} // تأكد من وجود الترجمة في ملف i18n
      value={customType}
      onChange={(e) => setCustomType(e.target.value)}
    />
  </Grid>
)}

              
              <Grid item xs={12}>
                <Autocomplete
                  options={billTypes}
                  getOptionLabel={(option) => t(`finance.${option.key}`)}
                  value={
                    billTypes.find((opt) => opt.value === data.billType) || null
                  }
                  onChange={(e, newValue) => {
                    setData({
                      ...data,
                      billType: newValue ? newValue.value : "",
                      // ✅ جديد: صفّر bankName لو تم تغيير billType لغير "تحويل بنكي"
                      bankName: newValue && newValue.value === "تحويل بنكي" ? data.bankName : "",
                    });
                    // ✅ جديد: صفّر اختيار البنك في الـ Autocomplete
                    if (!newValue || newValue.value !== "تحويل بنكي") {
                      setSelectedBankOption(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("finance.billType")}
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* ✅ جديد: حقل اختيار البنك يظهر فقط عند اختيار "تحويل بنكي" */}
              {data.billType === "تحويل بنكي" && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={banksList}
                    getOptionLabel={(option) => option.label || ""}
                    value={selectedBankOption} // ربطه بالحالة الجديدة
                    onChange={(e, newValue) => {
                      setSelectedBankOption(newValue);
                      setData((prev) => ({
                        ...prev,
                          bank: newValue ? newValue.value : "", // حفظ قيمة البنك في بيانات الفورم
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("finance.bankName")} // ترجم النص ده في ملف الـ translation بتاعك
                        required // اجعله مطلوبًا إذا كان "تحويل بنكي"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              )}


              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="number"
                  label={t("finance.amount")}
                  value={data.amount}
                  onChange={(e) => setData({ ...data, amount: e.target.value })}
                  inputProps={{ min: 0, "aria-label": t("finance.amount") }}
                />
              </Grid>

              {/* <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  type="date"
                  label={t("finance.date")}
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid> */}

              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  label={t("finance.note")} // حقل جديد للملاحظات
                  value={data.note}
                  onChange={(e) => setData({ ...data, note: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={guaranteeOptions}
                  getOptionLabel={(option) => t(`finance.${option.key}`)}
                  value={guaranteeOptions.find((opt) => opt.value === data.guarantee) || null}

                  onChange={(e, newValue) => {
                    setData({ ...data, guarantee: newValue ? newValue.value : "" });
                  }}

                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("finance.Guarantee")}
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {data.guarantee === "بضمان" && (
                <>
                  <Grid item xs={12} sx={{ textAlign: "center" }}>
                    {(file || data.bill) && (
                      <img
                        src={
                          file
                            ? URL.createObjectURL(file)
                            : `${imagesKey}${data.bill}`
                        }
                        height="50px"
                        width="50px"
                        style={{ borderRadius: "50%" }}
                        alt={t("finance.billImage")}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      className="bills-btn"
                      onClick={() => fileInputRef.current.click()}
                      disabled={loading}
                    >
                      {t("finance.addbill")}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleUploadFile}
                      accept="image/*"
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  type="submit"
                  fullWidth
                  className="bills-btn"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {update ? t("finance.update") : t("finance.add")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    );
  }
);

export default AddExpensesModal;