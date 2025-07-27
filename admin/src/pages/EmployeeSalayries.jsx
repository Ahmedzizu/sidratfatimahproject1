// ✅ تم تحسين الكود بناءً على طلبك: حماية صرف مزدوج حقيقية من الـ backend، تحسين تجربة المستخدم، وتصحيح العرض

import React, { useEffect, useRef, useState } from "react";
import EmployeeNavigation from "../components/EmployeeNavigation";
import {
  Button,
  CircularProgress,
  Snackbar,
  Dialog, // جديد
  DialogActions, // جديد
  DialogContent, // جديد
  DialogContentText, // جديد
  DialogTitle, // جديد
  RadioGroup, // جديد
  Radio, // جديد
  FormControlLabel, // جديد
  FormControl, // جديد
  FormLabel, // جديد
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployeeAbsence,
  fetchEmployeeFinance,
} from "../redux/reducers/employee";
import { useTranslation } from "react-i18next";
import SalarySlip from "../components/SalarySlip";
import SalarySummaryTable from "../components/SalarySummaryTable";
import AddEmployeeFinance from "../modals/AddEmployeeFinance";
import ReactToPrint from "react-to-print";
import Api from "../config/config"; // ✅ Use our custom API instance
import "../scss/addChalets.scss";
import "../scss/employee.scss";

const EmployeeSalaries = () => {
  const dispatch = useDispatch();
  const employees = useSelector((state) => state.employee.value.data);
  const finance = useSelector((state) => state.employee.value.finance);
  const absences = useSelector((state) => state.employee.value.absence);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paidSalaries, setPaidSalaries] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
    const user = useSelector((state) => state.employee.value.user);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [processingIds, setProcessingIds] = useState([]);
  const summaryRef = useRef();
  const employeeRefs = useRef({});
  const { t, i18n } = useTranslation();

  const [openPaymentModal, setOpenPaymentModal] = useState(false); // لفتح مودال طريقة الدفع
  const [paymentMethod, setPaymentMethod] = useState("نقدي"); // لتخزين طريقة الدفع المختارة
  const [currentEmployeeToPay, setCurrentEmployeeToPay] = useState(null); // لتخزين الموظف الحالي عند الصرف الفردي
  const [isBulkPayment, setIsBulkPayment] = useState(false); // لتحديد ما إذا كان 
  const [selectedBank, setSelectedBank] = useState(""); // جديد: لتخزين اسم البنك المختار
  const [banksList, setBanksList] = useState([]); // جديد: لتخزين قائمة البنوك المتاحة

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [
    ...new Set(finance.filter((f) => f?.date).map((f) => f.date.split("-")[0])),
  ];

 useEffect(() => {
  
  dispatch(fetchEmployeeFinance());
  dispatch(fetchEmployeeAbsence());
}, [dispatch]);


useEffect(() => {
  const fetchPaidSalaries = async () => {
  try {
    const params = {
      month: months.indexOf(selectedMonth) + 1,
      year: parseInt(selectedYear),
      type: "Salaries",
    };

    // ✅ Use .get to fetch data, and pass the filters as params
    const res = await Api.get(`/api/expenses`, { params });

    console.log("Fetched paid salaries:", res.data);
    setPaidSalaries(res.data);
  } catch (err) {
    console.error("❌ Error fetching paid salaries", err);
  }
};

  fetchPaidSalaries();
}, [selectedMonth, selectedYear]);

useEffect(() => {
  const fetchBanks = async () => {
    try {
      // ✅ ده المسار اللي هيستخدم الراوت اللي وريتهولي
      const res = await Api.get(`/bank-details/all`);
      setBanksList(res.data);
    } catch (err) {
      console.error("❌ Error fetching banks list", err);
      // ... (قائمة بنوك افتراضية لو فشل الطلب)
    }
  };
  fetchBanks();
}, []);



const getSalaryStatus = (employeeId) => {
  const paid = paidSalaries.find(f =>
    (f.employee?._id || f.employee) === employeeId &&
    f.month === months.indexOf(selectedMonth) + 1 &&
    f.year === parseInt(selectedYear) &&
    f.isSalaryPaid === true
  );

  const selectedDate = new Date(`${selectedYear}-${months.indexOf(selectedMonth) + 1}-01`);
  const now = new Date();

  const isSameMonth =
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  const isFuture = selectedDate > now;
  const isPast = selectedDate < now && !isSameMonth;

  if (paid) {
    const paidDateStr = new Date(paid.date || paid.salaryPaidAt).toLocaleDateString("ar-EG");
    return {
      color: "success",
      label: `تم الصرف (${paidDateStr})`, // ✅ الآن نستخدم متغير معرف
      disabled: true,
    };
  }

  if (isFuture) return { color: "default", label: "لم يحن وقت الصرف بعد", disabled: true };
  if (isPast) return { color: "error", label: "تأخير في الصرف", disabled: false };

  return { color: "warning", label: "جاهز للصرف", disabled: false };
};






const filterData = (dataArray) => {
  return dataArray.filter(item => {
    const itemDate = new Date(item.date || item.salaryPaidAt);
    return (
      itemDate.getMonth() + 1 === months.indexOf(selectedMonth) + 1 &&
      itemDate.getFullYear() === parseInt(selectedYear)
    );
  });
};

  const filteredFinance = filterData(finance);
  const filteredAbsence = filterData(absences);

  const calcValue = (id, type) =>
    filteredFinance
      .filter((e) => e?.employee?._id === id && e.type === type)
      .reduce((s, e) => s + (e.amount || 0), 0);

  const calcBonusHours = (id) =>
    filteredFinance
      .filter((e) => e?.employee?._id === id && e.type === "bonus")
      .reduce((s, e) => s + (e.bonusHours || 0), 0);

  const calcAbsence = (id) =>
    filteredAbsence.filter((e) => e?.employee?._id === id).length;

  const calcNetSalary = (id, base) =>
    base + calcValue(id, "bonus") - calcValue(id, "discount");

  const salaryData = employees.map((emp) => {
    const bonus = calcValue(emp._id, "bonus");
    const bonusHours = calcBonusHours(emp._id);
    const deduction = calcValue(emp._id, "discount");
    const absence = calcAbsence(emp._id);
    const net = calcNetSalary(emp._id, emp.salary);
    return {
      _id: emp._id,
      name: emp.name,
      salary: emp.salary,
      bonusHours,
      bonus,
      deduction,
      absenceDays: absence,
      netSalary: net,
    };
  });

  const totalNetSalary = salaryData.reduce((s, e) => s + e.netSalary, 0);
 const handlePaySalary = (employee) => {
  if (
    processingIds.includes(employee._id) ||
    getSalaryStatus(employee._id).color === "success"
  )
    return;

  setCurrentEmployeeToPay(employee); // حفظ الموظف الذي سيتم صرف راتبه
  setIsBulkPayment(false); // تحديد أن هذا صرف فردي
  setOpenPaymentModal(true); // فتح مودال طريقة الدفع
};

const handlePayAll = () => {
  const unpaidEmployees = employees.filter(
    (emp) =>
      !finance.some(
        (f) =>
          f.type === "Salaries" &&
          f.isSalaryPaid &&
          f.employee?._id === emp._id &&
          f.month === months.indexOf(selectedMonth) + 1 &&
          f.year === parseInt(selectedYear)
      )
  );

  if (unpaidEmployees.length === 0) {
    alert("✅ تم صرف جميع الرواتب مسبقًا");
    return;
  }

  setCurrentEmployeeToPay(null); // لا يوجد موظف محدد للصرف الجماعي
  setIsBulkPayment(true); // تحديد أن هذا صرف جماعي
  setOpenPaymentModal(true); // فتح مودال طريقة الدفع
};
   
const confirmPayment = async () => {
  setOpenPaymentModal(false);

  // تحقق من أن اسم البنك موجود في حالة "تحويل بنكي"
  if (paymentMethod === "تحويل بنكي" && !selectedBank) {
    setSnack({ open: true, message: "❌ يرجى اختيار اسم البنك.", severity: "error" });
    return;
  }
 const bankDisplayName = banksList.find(b => b._id === selectedBank)?.name || selectedBank;
  // 👉 1. الصرف الجماعي
  if (isBulkPayment) {
    const unpaidEmployees = employees.filter((emp) =>
      !finance.some(
        (f) =>
          f.type === "Salaries" &&
          f.isSalaryPaid &&
          f.employee?._id === emp._id &&
          f.month === months.indexOf(selectedMonth) + 1 &&
          f.year === parseInt(selectedYear)
      )
    );

    if (unpaidEmployees.length === 0) {
      setSnack({ open: true, message: "✅ تم صرف جميع الرواتب مسبقًا", severity: "success" });
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        unpaidEmployees.map(async (employee) => {
          const salary = salaryData.find((s) => s._id === employee._id);
          if (!salary) return;

          const newExpense = {
            type: "Salaries",
            amount: salary.netSalary,
            billType: paymentMethod,
            reciver: employee.name,
            guarantee: "بضمان",
            date: new Date().toISOString(),
            month: months.indexOf(selectedMonth) + 1,
            year: parseInt(selectedYear),
            employee: employee._id,
              addedByEmployeeName: user?.name || "نظام أوتوماتيكي",
            isSalaryPaid: true,
            salaryPaidAt: new Date(),
            ...(paymentMethod === "تحويل بنكي" && { bank: selectedBank }),
            note: `صرف راتب الموظف ${employee.name} عن شهر ${selectedMonth} ${selectedYear} - طريقة الدفع: ${paymentMethod}${
              paymentMethod === "تحويل بنكي" ? ` (${bankDisplayName})` : ""
            }`,
          };

          await Api.post(`/api/expenses`, newExpense);
        })
      );

      setPaidSalaries((prev) => [
        ...prev,
        ...unpaidEmployees.map((e) => ({
          employee: e._id,
          type: "Salaries",
          isSalaryPaid: true,
          month: months.indexOf(selectedMonth) + 1,
          year: parseInt(selectedYear),
        })),
      ]);

      await dispatch(fetchEmployeeFinance());
      fetchPaidSalaries();

      setSnack({
        open: true,
        message: "✅ تم صرف الرواتب المتبقية بنجاح",
        severity: "success",
      });
    } catch (error) {
      setSnack({
        open: true,
        message: "❌ حدث خطأ أثناء صرف بعض الرواتب",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  // 👉 2. الصرف الفردي
  else if (currentEmployeeToPay) {
    setProcessingIds((prev) => [...prev, currentEmployeeToPay._id]);

    try {
      const salary = salaryData.find((s) => s._id === currentEmployeeToPay._id);
      if (!salary) throw new Error("لم يتم العثور على بيانات الراتب");

      const note = `صرف راتب الموظف ${currentEmployeeToPay.name} عن شهر ${selectedMonth} ${selectedYear} - طريقة الدفع: ${paymentMethod}${
        paymentMethod === "تحويل بنكي" ? ` (${bankDisplayName})` : ""
      }`;

      const newExpensePayload = {
        type: "Salaries",
        amount: salary.netSalary,
        billType: paymentMethod,
        reciver: currentEmployeeToPay.name,
        guarantee: "بضمان",
        date: new Date().toISOString(),
        month: months.indexOf(selectedMonth) + 1,
        year: parseInt(selectedYear),
        employee: currentEmployeeToPay._id,
          addedByEmployeeName: user?.name || "نظام أوتوماتيكي",

        isSalaryPaid: true,
        salaryPaidAt: new Date(),
        ...(paymentMethod === "تحويل بنكي" && { bank: selectedBank }),
        note,
      };

      await Api.post(`/api/expenses`, newExpensePayload);

      setPaidSalaries((prev) => [
        ...prev,
        {
          employee: currentEmployeeToPay._id,
          type: "Salaries",
          isSalaryPaid: true,
          month: months.indexOf(selectedMonth) + 1,
          year: parseInt(selectedYear),
        },
      ]);

      await dispatch(fetchEmployeeFinance());
      fetchPaidSalaries();

      setSnack({
        open: true,
        message: `✅ تم صرف ${salary.netSalary} لـ ${currentEmployeeToPay.name}`,
        severity: "success",
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 400
          ? "تم صرف الراتب مسبقاً"
          : "فشل في الاتصال بالخادم");
      setSnack({ open: true, message: `❌ ${message}`, severity: "error" });
    } finally {
      setProcessingIds((prev) =>
        prev.filter((id) => id !== currentEmployeeToPay._id)
      );
      setCurrentEmployeeToPay(null);
    }
  }
};



  return (
    <>
      <EmployeeNavigation id={3} />
      <div
        className="cont"
        style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}
      >
        <h2>{t("employee.Employee payroll management")}</h2>
        <div className="search-box">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <Button onClick={() => setOpen(true)}>
            {t("employee.bonusOrDeduction")}
          </Button>
        </div>

       <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
  <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">اسم</TableCell>
                <TableCell align="center">راتب أساسي</TableCell>
                <TableCell align="center">ساعات إضافية</TableCell>
                <TableCell align="center">مكافأة</TableCell>
                <TableCell align="center">خصم</TableCell>
                <TableCell align="center">غياب</TableCell>
                <TableCell align="center">صافي</TableCell>
                <TableCell align="center">إجراء</TableCell>
                <TableCell align="center">صرف</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => {
                const isProcessing = processingIds.includes(emp._id);
                const s = salaryData.find((e) => e._id === emp._id);
                const { color, label, disabled } = getSalaryStatus(emp._id);


  // ✅ جديد: ابحث عن سجل الصرف لهذا الموظف في paidSalaries
  const employeePaidRecord = paidSalaries.find(f =>
    (f.employee?._id || f.employee) === emp._id &&
    f.month === months.indexOf(selectedMonth) + 1 &&
    f.year === parseInt(selectedYear) &&
    f.isSalaryPaid === true  );
                if (!employeeRefs.current[emp._id])
                  employeeRefs.current[emp._id] = React.createRef();

                return (
                  <TableRow key={emp._id}>
                    <TableCell align="center">{emp.name}</TableCell>
                    <TableCell align="center">{s.salary}</TableCell>
                    <TableCell align="center">{s.bonusHours}</TableCell>
                    <TableCell align="center">{s.bonus}</TableCell>
                    <TableCell align="center">{s.deduction}</TableCell>
                    <TableCell align="center">{s.absenceDays}</TableCell>
                    <TableCell align="center">{s.netSalary}</TableCell>
          
                    <TableCell align="center">
                      <ReactToPrint
                        trigger={() => (
                          <Button variant="outlined">طباعة</Button>
                        )}
                        content={() => employeeRefs.current[emp._id].current}
                      />
                      <div style={{ display: "none" }}>
                        <SalarySlip
                          ref={employeeRefs.current[emp._id]}
                          employee={emp}
                          salaryDetails={s}
                          selectedMonth={selectedMonth}
                          selectedYear={selectedYear}
                          absences={filteredAbsence}
                          finance={filteredFinance}
                          paymentInfo={employeePaidRecord || null} // نمرر السجل لو موجود، أو null لو لم يتم الصرف
                        />
                      </div>
                      
                    </TableCell>
                    <TableCell align="center">
                      <Button
  variant={color === "success" ? "outlined" : "contained"}
  color={color}
  disabled={disabled || isProcessing}
  onClick={() => handlePaySalary(emp)}
>
  {isProcessing ? <CircularProgress size={20} /> : label}
</Button></TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <strong>الإجمالي</strong>
                </TableCell>
                <TableCell align="center">
                  {totalNetSalary.toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <ReactToPrint
            trigger={() => <Button variant="contained">طباعة المسير</Button>}
            content={() => summaryRef.current}
          />
         <Button
  variant="contained"
  onClick={handlePayAll}
  disabled={
    loading ||
    employees.length === 0 ||
    employees.every((emp) =>
      finance.some(
        (f) =>
          f.type === "Salaries" &&
          f.isSalaryPaid === true &&
          f.employee?._id === emp._id &&
          f.month === months.indexOf(selectedMonth) + 1 &&
          f.year === parseInt(selectedYear)
      )
    )
  }
>
  {loading ? <CircularProgress size={20} /> : "صرف الكل"}
</Button>

        </div>

        <div style={{ display: "none" }}>
          <SalarySummaryTable
            ref={summaryRef}
            salaries={salaryData}
            month={selectedMonth}
            year={selectedYear}
          />
        </div>
      </div>
 

<Dialog
  open={openPaymentModal}
  onClose={() => setOpenPaymentModal(false)}
  aria-labelledby="payment-method-dialog-title"
  aria-describedby="payment-method-dialog-description"
>
  <DialogTitle id="payment-method-dialog-title">
    {isBulkPayment ? "تأكيد صرف الرواتب الجماعي" : "تأكيد صرف الراتب"}
  </DialogTitle>
  <DialogContent>
    <DialogContentText id="payment-method-dialog-description">
      {isBulkPayment
        ? `هل أنت متأكد من صرف رواتب جميع الموظفين غير المدفوعة للشهر ${selectedMonth} ${selectedYear}؟`
        : `هل أنت متأكد من صرف راتب الموظف ${currentEmployeeToPay?.name} عن شهر ${selectedMonth} ${selectedYear}؟`}
    </DialogContentText>
    <FormControl component="fieldset" sx={{ mt: 2 }}>
      <FormLabel component="legend">اختر طريقة الدفع:</FormLabel>
      <RadioGroup
        row
        aria-label="payment-method"
        name="payment-method-group"
        value={paymentMethod}
        onChange={(e) => {
          setPaymentMethod(e.target.value);
          // ✅ إذا تم التغيير من "تحويل بنكي" إلى شيء آخر، قم بمسح البنك المختار
          if (e.target.value !== "تحويل بنكي") {
            setSelectedBank("");
          }
        }}
      >
        <FormControlLabel
          value="نقدي"
          control={<Radio />}
          label="نقدي"
        />
        <FormControlLabel
          value="تحويل بنكي"
          control={<Radio />}
          label="تحويل بنكي"
        />
      </RadioGroup>
    </FormControl>

    {/* ✅ إضافة حقل اختيار البنك يظهر فقط عند اختيار "تحويل بنكي" */}
    {paymentMethod === "تحويل بنكي" && (
      <FormControl fullWidth sx={{ mt: 2 }}>
        <FormLabel component="legend">اسم البنك:</FormLabel>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', minHeight: '36px' }}
        >
           <option value="">اختر بنك...</option>
  {banksList.map((bank) => (
    <option key={bank._id} value={bank._id}> {/* ✅ التصحيح هنا: استخدم bank._id */}
      {bank.name}
    </option>
          ))}
        </select>
      </FormControl>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenPaymentModal(false)} color="error">
      إلغاء
    </Button>
    <Button onClick={confirmPayment} color="primary" autoFocus>
      تأكيد الصرف
    </Button>
  </DialogActions>
</Dialog>


     <AddEmployeeFinance
  open={open}
  handleClose={() => setOpen(false)}
  onFinish={() => {
    console.log("onFinish triggered"); // ✅ هذا هو السطر المطلوب
    dispatch(fetchEmployeeFinance());
     setSnack({ open: true, message: "✅ تم إضافة المكافأة / الخصم بنجاح", severity: "success" });
  
    setOpen(false);
  }}
/>



      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
          <MuiAlert elevation={6} variant="filled" severity={snack.severity}>
            {snack.message}
          </MuiAlert>
        </Snackbar>
    </>
  );
};

export default EmployeeSalaries;
