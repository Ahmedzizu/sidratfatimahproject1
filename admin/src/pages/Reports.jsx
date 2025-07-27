import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../scss/report.scss";
import { Grid, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Reports = () => {
  const [lastReportEndDate, setLastReportEndDate] = useState(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const [savedReports, setSavedReports] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const today = new Date();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/reports/all-reports`);
        const reports = response.data;
        setSavedReports(reports);

        if (reports.length > 0) {
          const latestEndDate = new Date(
            Math.max(...reports.map((r) => new Date(r.endDate)))
          );
          setLastReportEndDate(latestEndDate);
        }
      } catch (error) {
        console.error("خطأ في جلب التقارير:", error);
      }
    };
    fetchReports();
  }, [apiUrl]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (date) => setEndDate(date);
  
  const handleSubmit = () => {
    if (!startDate || !endDate) {
      toast.error("الرجاء اختيار التاريخ والوقت من وإلى");
      return;
    }
    navigate("/report-details", {
      state: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };
// Add this code block before the "return (" line
  let minTimeForEndPicker = null;
  let maxTimeForEndPicker = null;

  if (endDate) {
    // Default to the full day
    minTimeForEndPicker = new Date(new Date(endDate).setHours(0, 0, 0, 0));
    maxTimeForEndPicker = new Date(new Date(endDate).setHours(23, 59, 59, 999));

    // If the selected day is the same as the start date, restrict the minTime
    if (isSameDay(endDate, startDate)) {
      minTimeForEndPicker = startDate;
    }

    // If the selected day is today, restrict the maxTime
    if (isSameDay(endDate, today)) {
      maxTimeForEndPicker = today;
    }
  }
  // أضف هذه الدالة داخل المكون Reports

const handleAutoReport = () => {
  // تحقق من وجود تقارير سابقة
  if (!lastReportEndDate) {
    toast.error("لا توجد تقارير سابقة لإنشاء تقرير تلقائي.");
    return;
  }
  
  // تاريخ النهاية هو الوقت الحالي
  const now = new Date();

  // انتقل إلى صفحة تفاصيل التقرير مع التواريخ المحددة
  navigate("/report-details", {
    state: {
      startDate: lastReportEndDate.toISOString(),
      endDate: now.toISOString(),
    },
  });
};
  return (
    <>
      <div className="cont" style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}>
        <ToastContainer />
        <h2>{t("reports.title")}</h2>
        <div className="date-picker-container">
          <div className="date-picker">
            <span>{t("reports.from")}</span>
           <DatePicker
  selected={startDate}
  onChange={handleStartDateChange}
  selectsStart
  startDate={startDate}
  endDate={endDate}
  showTimeSelect
  timeInputLabel="الوقت:"
  dateFormat="yyyy/MM/dd h:mm aa"
  timeIntervals={5}
  minDate={lastReportEndDate}
  {...(isSameDay(startDate, lastReportEndDate)
    ? {
        minTime: lastReportEndDate,
        maxTime: new Date(new Date(startDate).setHours(23, 59, 59)),
      }
    : {})}
/>
       
  <label>{t("reports.to")}</label>
  <DatePicker
    selected={endDate}
    onChange={handleEndDateChange}
    selectsEnd
    startDate={startDate}
    endDate={endDate}
    minDate={startDate}
    showTimeSelect
    timeInputLabel="الوقت:"
    dateFormat="yyyy/MM/dd h:mm aa"
    timeIntervals={5}
    maxDate={today}
    
    // Use the variables we defined above
    minTime={minTimeForEndPicker}
    maxTime={maxTimeForEndPicker}
  />


          </div>
        </div>
        <Grid container spacing={2} margin="25px" justifyContent="center">
    {/* الزر الحالي لإنشاء تقرير يدوي */}
    <Grid item xs={12} sm={5}>
        <Button 
            variant="contained" 
            onClick={handleSubmit} 
            fullWidth
            style={{ padding: '10px', fontSize: '1.1rem' }}
        >
            {t("report.financialReports")}
        </Button>
    </Grid>
    
    {/* ✅ الزر الجديد لإنشاء تقرير تلقائي */}
    <Grid item xs={12} sm={5}>
        <Button 
            variant="contained" 
          
            onClick={handleAutoReport} 
            disabled={!lastReportEndDate} // يتم تعطيل الزر إذا لم تكن هناك تقارير سابقة
            fullWidth
            style={{ padding: '10px', fontSize: '1.1rem' }}
        >
            {t("report.autoReport")} {/* 🔹 تأكد من إضافة هذه الترجمة */}
        </Button>
    </Grid>
</Grid>
        
      </div>
      <div className="report-page" style={{ textAlign: "center" }}>
        <h2>{t("report.savedReports")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("report.headers.number")}</th>
              <th>{t("report.headers.from")}</th>
              <th>{t("report.headers.to")}</th>
              <th>{t("report.headers.revenue")}</th>
              <th>{t("report.headers.expenses")}</th>
              <th>{t("report.headers.profit")}</th>
              <th>{t("report.headers.createdAt")}</th>
              <th>{t("report.headers.view")}</th>
            </tr>
          </thead>
          <tbody>
            {savedReports
              .slice()
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((rep, index) => (
                <tr key={rep._id}>
                  <td>{index + 1}</td>
                  {/* عرض التاريخ والوقت في الجدول */}
                  <td>{new Date(rep.startDate).toLocaleString("EG")}</td>
                  <td>{new Date(rep.endDate).toLocaleString("EG")}</td>
                  <td>{rep.totalIncome?.toFixed(2)}</td>
                  <td>{rep.totalExpenses?.toFixed(2)}</td>
                  <td style={{ color: rep.netRevenue >= 0 ? "green" : "red" }}>
                    {rep.netRevenue?.toFixed(2)}
                  </td>
                  <td>{new Date(rep.createdAt).toLocaleString("EG")}</td>
                  <td>
                    <button
                      onClick={() =>
                        navigate("/report-details", {
                          state: {
                            // إرسال التاريخ والوقت الكامل عند عرض تقرير محفوظ
                            startDate: rep.startDate,
                            endDate: rep.endDate,
                            paymentType: "جميع التقارير",
                          },
                        })
                      }
                    >
                      عرض
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Reports;
