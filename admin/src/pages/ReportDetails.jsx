import React, { useEffect, useState } from "react";
import PaymentChart from "./PaymentChart"; // استدعاء الرسم البياني
import "../scss/ReportDetails.scss";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReportDetails = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { startDate, endDate, paymentType } = location.state || {}; // استقبال البيانات الممررة من الصفحة السابقة
  const [activeTab, setActiveTab] = useState("all");
  const [data, setData] = useState(null); // لتخزين البيانات القادمة من الـ API
  const [transactionData, setTransactionData] = useState([]); // لتخزين البيانات القادمة من الـ API
  const [treasuryTransactions, setTreasuryTransactions] = useState([]);
  const [handoverTraceData, setHandoverTraceData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // لتخزين الأخطاء إذا حدثت أثناء جلب البيانات
// في بداية ReportDetails.jsx
const [bankRevenueData, setBankRevenueData] = useState([]);
const [bankExpenseData, setBankExpenseData] = useState([]);
const [shiftSummaryData, setShiftSummaryData] = useState([]);
  const [chartData, setChartData] = useState(null);

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      setError("البيانات المطلوبة غير مكتملة.");
      return;
    }

    let paymentType = ""; // قيمة نوع الدفع بناءً على التبويب

    switch (activeTab) {
      case "نقداً":
        paymentType = t("report.payment.cash");
        break;
      case "بنكي":
        paymentType = t("report.payment.bankTransfer");
        break;
      case "شبكة":
        paymentType = t("report.payment.insurance");
        break;
      default:
        paymentType = t("report.payment.allReports");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reports/financial-report`,
        {
          paymentType,
          startDate,
          endDate,
        }
      );

      setData(response.data); // تخزين البيانات القادمة من الـ API
      setLoading(false);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.");
      setLoading(false);
    }
  };
  // أضف هذه الدالة قبل جملة return
  const formatReadableDateTime = (dateString) => {
    if (!dateString) return "غير محدد"; // للتعامل مع أي قيمة فارغة

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // لاستخدام توقيت 12 ساعة (صباحًا/مساءً)
      timeZone: "Africa/Cairo", // لضمان عرض الوقت بتوقيت مصر
    };

    return new Date(dateString).toLocaleString("ar-EG", options);
  };
  // أنشئ دالة جديدة لجلب بيانات الخزنة
  const fetchTreasuryTransactions = async () => {
    if (!startDate || !endDate) return;
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reports/treasury-transactions`,
        { startDate, endDate }
      );
      setTreasuryTransactions(data);
    } catch (err) {
      console.error("Error fetching treasury transactions:", err);
    }
  };
  // أنشئ دالة جديدة لجلب بيانات تتبع الأرصدة
  // في ReportDetails.jsx

  const fetchHandoverTrace = async () => {
    // التأكد من وجود التواريخ قبل إرسال الطلب
    if (!startDate || !endDate) return;

    try {
      // ✅ إرسال التواريخ كـ query parameters
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reports/handover-trace`,
        {
          params: {
            startDate,
            endDate,
          },
        }
      );
      setHandoverTraceData(data);
    } catch (err) {
      console.error("Error fetching handover trace data:", err);
    }
  };

  const expenses = data?.expenses || [];
  const fetchTransactionData = async () => {
    if (!startDate || !endDate) {
      setError("البيانات المطلوبة غير مكتملة.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const body = {
        paymentType: paymentType || "جميع التقارير",
        startDate,
        endDate,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reports/detailed-transactions`,
        body,

        { headers }
      );

      // Save the transaction data
      setTransactionData(response.data.reservations || []); // Assume the API returns `reservations`
      setLoading(false);
    } catch (err) {
      console.error("Error fetching transaction data:", err);
      setError("حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.");
      setLoading(false);
    }
  };
// أضف هذه الدالة مع دوال fetch الأخرى
const fetchBankRevenueData = async () => {
  if (!startDate || !endDate) return;
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/reports/bank-revenue-summary`,
      { startDate, endDate }
    );
    setBankRevenueData(data);
  } catch (err) {
    console.error("Error fetching bank revenue data:", err);
  }
};
const fetchBankExpenseData = async () => {
  if (!startDate || !endDate) return;
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/reports/bank-expense-summary`,
      { startDate, endDate }
    );
    setBankExpenseData(data);
  } catch (err) {
    console.error("Error fetching bank expense data:", err);
  }
};
const fetchShiftSummaryData = async () => {
  if (!startDate || !endDate) return;
  try {
    const { data } = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/reports/shift-summary-by-employee`,
      { startDate, endDate }
    );
    setShiftSummaryData(data);
  } catch (err) {
    console.error("Error fetching shift summary data:", err);
  }
};
  // استدعاء الدالة عند تحميل الصفحة أو عند تغيير التبويب
  useEffect(() => {
    fetchReportData();
    fetchTransactionData();
    fetchTreasuryTransactions();
    fetchHandoverTrace();
      fetchBankRevenueData(); 
        fetchBankExpenseData();
          fetchShiftSummaryData();

    // ✅ استدعاء الدالة الجديدة هنا
  }, [activeTab, startDate, endDate]);
  useEffect(() => {
    console.log("📌 بيانات التقرير:", data);
    console.log("📌 بيانات المعاملات:", transactionData);
  }, [data, transactionData]);

  if (loading) {
    return <p>جارٍ تحميل البيانات...</p>;
  }

  if (!data) {
    return <p>لم يتم العثور على بيانات لعرضها.</p>;
  }

  const reportData = [
    {
      title: "إيرادات القاعة",
      data: [
        {
          paymentMethod: "نقداً",
          amount: data.hallRevenue?.cash?.toFixed(2) || 0,
        },
        {
          paymentMethod: "بنكي",
          amount: data.hallRevenue?.bankTransfer?.toFixed(2) || 0,
        },
        {
          paymentMethod: "شبكة",
          amount: data.hallRevenue?.insurance?.toFixed(2) || 0,
        },
      ],
      total: data.totalHallRevenue?.toFixed(2) || 0,
    },
    {
      title: "إيرادات الشاليهات",
      data: [
        {
          paymentMethod: "نقداً",
          amount: data.chaletRevenue?.cash?.toFixed(2) || 0,
        },
        {
          paymentMethod: "بنكي",
          amount: data.chaletRevenue?.bankTransfer?.toFixed(2) || 0,
        },
        {
          paymentMethod: "شبكة",
          amount: data.chaletRevenue?.insurance?.toFixed(2) || 0,
        },
      ],
      total: data.totalChaletRevenue?.toFixed(2) || 0,
    },
  ];

  const transactionDataShow = transactionData.map((transaction) => ({
    transactionId: transaction.paymentContractNumber,
    name: transaction.client.name,
    amount: `${transaction.totalCost}`,
    totalPaid: transaction.totalPaid ?? 0, // ✅ {t("finance.totals")} المدفوع
    remainingAmount: transaction.remainingAmount ?? 0, // ✅ {t("finance.totals")} المتبقي
    transactionType: transaction.type === "hall" ? "حجز قاعة" : "حجز شاليه",
    paymentMethod: transaction.paymentType,
    user: transaction.client.name, // Assuming "user" is the client's name
    date: transaction.paymentDate,
    entity: transaction.entity || {}, // ✅ أضف هذا السطر
     employee: transaction.employee?.name || "غير محدد", 
     bankName: transaction.bankName || "غير مطبق",
     // ✅ أضف هذا السطر
  }));

  const filterDataByPaymentMethod = (method) => {
    if (method === "all") return reportData;
    return reportData.map((report) => ({
      ...report,
      data: report.data.filter((entry) => entry.paymentMethod === method),
      total: report.data
        .filter((entry) => entry.paymentMethod === method)
        .reduce((acc, entry) => acc + entry.amount, 0),
    }));
  };

  const filteredData = filterDataByPaymentMethod(activeTab);

  // بيانات الإيرادات والمصروفات لعرضها
  const hallRevenue = Number(data.totalHallRevenue?.toFixed(2)) || 0;
  const chaletRevenue = Number(data.totalChaletRevenue?.toFixed(2)) || 0;
  const revenueTotal = Number(data.totalRevenue?.toFixed(2)) || 0;
  const expenseTotal = Number(data.totalExpenses?.toFixed(2)) || 0;
  const netRevenue = Number(data.netRevenue?.toFixed(2)) || 0;

  const cashTransactions = transactionDataShow.filter(
    (tr) => tr.paymentMethod === "نقدي"
  );
  const networkTransactions = transactionDataShow.filter(
    (tr) => tr.paymentMethod === "شبكة"
  );
  const bankTransactions = transactionDataShow.filter(
    (tr) => tr.paymentMethod === "تحويل بنكي"
  );
  const insuranceTransactions = transactionDataShow.filter(
    (tr) => tr.paymentMethod === "تأمين"
  );
  const partialPayments = transactionDataShow.filter(
    (tr) => tr.paymentMethod === "دفعة"
  );

  const expensesData = [
    {
      paymentMethod: t("report.payment.cash"),
      amount: `${data.totalExpenses?.toFixed(2) || 0} ${t("report.currency")}`,
    },
    {
      paymentMethod: t("report.payment.bank"),
      amount: `0.00 ${t("report.currency")}`,
    },
    {
      paymentMethod: t("report.payment.totalExpenses"),
      amount: `${data.totalExpenses?.toFixed(2) || 0} ${t("report.currency")}`,
    },
  ];

  const transfersData = [
    {
      paymentMethod: t("report.payment.bankTransfers"),
      amount: `${data.totalBankTransactions?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.cashDraws"),
      amount: `${data.totalCashDraws?.toFixed(2) || 0} ${t("report.currency")}`,
    },
    {
      paymentMethod: t("report.payment.totalTransfers"),
      amount: `${
        (data.totalCashDraws + data.totalBankTransactions)?.toFixed(2) || 0
      } ${t("report.currency")}`,
    },
  ];

  const hallRevenueData = [
    {
      paymentMethod: t("report.payment.cash"),
      amount: `${(
        (data.hallRevenue?.cash || 0) 
      ).toFixed(2)} ${t("report.currency")}`,
    },
    {
      paymentMethod: t("report.payment.bank"),
      amount: `${data.hallRevenue?.bankTransfer?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.insurance"),
      amount: `${data.hallRevenue?.insurance?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.totalHallRevenue"),
      amount: `${data.totalHallRevenue?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
  ];

  const chaletRevenueData = [
    {
      paymentMethod: t("report.payment.cash"),
      amount: `${data.chaletRevenue?.cash?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.bank"),
      amount: `${data.chaletRevenue?.bankTransfer?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.insurance"),
      amount: `${data.chaletRevenue?.insurance?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.totalChaletRevenue"),
      amount: `${data.totalChaletRevenue?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
  ];


  const cashRevenueData = [
    {
      paymentMethod: t("report.payment.cashHall"),
      amount: `${data.hallRevenue?.cash?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.cashChalet"),
      amount: `${data.chaletRevenue?.cash?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.totalCash"),
      amount: `${
        (data.hallRevenue?.cash + data.chaletRevenue?.cash)?.toFixed(2) || 0
      } ${t("report.currency")}`,
    },
  ];

  const bankRevenueData1 = [
    {
      paymentMethod: t("report.payment.bankHall"),
      amount: `${data.hallRevenue?.bankTransfer?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.bankChalet"),
      amount: `${data.chaletRevenue?.bankTransfer?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.totalBank"),
      amount: `${
        (
          data.hallRevenue?.bankTransfer + data.chaletRevenue?.bankTransfer
        )?.toFixed(2) || 0
      } ${t("report.currency")}`,
    },
  ];

  const networkRevenueData = [
    {
      paymentMethod: t("report.payment.networkHall"),
      amount: `${data.hallRevenue?.insurance?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.networkChalet"),
      amount: `${data.chaletRevenue?.insurance?.toFixed(2) || 0} ${t(
        "report.currency"
      )}`,
    },
    {
      paymentMethod: t("report.payment.totalNetwork"),
      amount: `${
        (data.hallRevenue?.insurance + data.chaletRevenue?.insurance)?.toFixed(
          2
        ) || 0
      } ${t("report.currency")}`,
    },
  ];

  // بيانات الأرصدة التي سيتم عرضها في جدول الأرصدة
  const balanceData = [
    {
      account: "حساب القاعة",
      openingBalance: "0.00 ريال",
      currentBalance: "0.00 ريال",
      total: "0.00 ريال",
    },
    {
      account: "حساب الشاليهات",
      openingBalance: "0.00 ريال",
      currentBalance: "0.00 ريال",
      total: "0.00 ريال",
    },
    {
      account: "حساب المصروفات",
      openingBalance: "0.00 ريال",
      currentBalance: "0.00 ريال",
      total: "0.00 ريال",
    },
  ];

  // دالة لطباعة التقرير
  const printReport = () => {
    // احصل على القسم الذي تريد طباعته
    const reportContainer = document.querySelector(".report-container");

    // قم بنسخ محتوى التقرير (بدون التشارتات)
    const clonedReport = reportContainer.cloneNode(true);

    // قم بإزالة العناصر الخاصة بالتشارتات من النسخة
    const charts = clonedReport.querySelectorAll("canvas"); // حذف كل العناصر <canvas> الخاصة بالتشارتات
    charts.forEach((chart) => chart.remove());

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open("", "_blank");

    // كتابة محتوى التقرير في النافذة الجديدة
    printWindow.document.open();
    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>طباعة التقرير</title>
        <style>
          /* إضافة التنسيقات الخاصة للطباعة هنا */
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: center;
            margin: 0;
            padding: 20px;
            background: #f9f9f9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table th {
            background-color: #457B9D;
            color: white;
          }
          h2, h3 {
            color: #333;
          }
          .summary-cards {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
          }
          .summary-card {
            flex: 1;
            margin: 0 10px;
            padding: 20px;
            background-color: #e8f4f8;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .summary-card h3 {
            margin-top: 10px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>التقرير المالي</h1>
        ${clonedReport.innerHTML} <!-- نسخ المحتوى بدون التشارتات -->
      </body>
    </html>
  `);
    printWindow.document.close();

    // بدء الطباعة
    printWindow.print();

    // بعد الطباعة، يمكن غلق النافذة
    printWindow.close();
  };

  // ✅ إعداد البيانات للرسم البياني الدائري حسب نوع الدفع
  const totalCash =
    (data.hallRevenue?.cash || 0) + (data.chaletRevenue?.cash || 0);
  const totalBank =
    (data.hallRevenue?.bankTransfer || 0) +
    (data.chaletRevenue?.bankTransfer || 0);
  const totalInsurance =
    (data.hallRevenue?.insurance || 0) + (data.chaletRevenue?.insurance || 0);

  const pieChartData = {
    labels: ["نقداً", "تحويل بنكي", "شبكة"],
    datasets: [
      {
        label: "الإيرادات حسب طريقة الدفع",
        data: [totalCash, totalBank, totalInsurance],
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"],
        hoverOffset: 6,
      },
    ],
  };

  const handleSaveReport = async () => {
    try {
      const body = {
        startDate,
        endDate,
        totalIncome: parseFloat(revenueTotal),
        totalExpenses: parseFloat(expenseTotal),
        netRevenue: parseFloat(netRevenue), // ✅ تم التصحيح هنا
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reports/save-report`,
        body
      );
      alert("تم حفظ التقرير بنجاح");
    } catch (err) {
      if (err.response?.status === 400) {
        toast.info(err.response.data.message || "⚠️ التقرير محفوظ مسبقًا");
      } else {
        toast.error("❌ فشل في حفظ التقرير");
      }
      console.error("❌ API Error:", err?.response?.data || err.message);
    }
  };

  return (
    <div className="report-container">
      {/* ✅ الهيدر */}
      <div className="report-header">
        <h1 className="report-title">{t("report.title")}</h1>
        <h3>
          📅 التقرير من: {formatReadableDateTime(startDate)} إلى:{" "}
          {formatReadableDateTime(endDate)}
        </h3>

        {/* زر الطباعة */}
        <div className="print-button-icon">
          <button className="print-button" onClick={printReport}>
            <i className="fa fa-print"></i>
            <span className="print-text">طباعة</span>
          </button>
        </div>
      </div>

      {/* ✅ التبويبات */}
      <div className="tabs">
        <button
          className={activeTab === "all" ? "tab active" : "tab"}
          onClick={() => setActiveTab("all")}
        >
          {t("report.tabs.allReports")}
        </button>
        <button
          className={activeTab === "نقداً" ? "tab active" : "tab"}
          onClick={() => setActiveTab("نقداً")}
        >
          {t("report.tabs.cash")}
        </button>
        <button
          className={activeTab === "بنكي" ? "tab active" : "tab"}
          onClick={() => setActiveTab("بنكي")}
        >
          {t("report.tabs.bankTransfers")}
        </button>
        <button
          className={activeTab === "شبكة" ? "tab active" : "tab"}
          onClick={() => setActiveTab("شبكة")}
        >
          {t("report.tabs.network")}
        </button>
        <button onClick={handleSaveReport}>
          💾{t("report.summary.savereport")}
        </button>
        <ToastContainer />
      </div>

      {/* ✅ بطاقات الإيرادات والمصروفات */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="icon">🏛️</div>
          <div className="summary-text">
            <p>{t("report.summary.hallRevenue")}</p>
            <h3 style={{ color: hallRevenue >= 0 ? "#383f49" : "#c41132" }}>
              {hallRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              {t("report.currency")}
            </h3>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon">🏠</div>
          <div className="summary-text">
            <p>{t("report.summary.chaletRevenue")}</p>
            <h3 style={{ color: chaletRevenue >= 0 ? "#383f49" : "#c41132" }}>
              {chaletRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              {t("report.currency")}
            </h3>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon">💰</div>
          <div className="summary-text">
            <p>{t("report.summary.totalRevenue")}</p>
            <h3 style={{ color: revenueTotal >= 0 ? "#383f49" : "#c41132" }}>
              {revenueTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              {t("report.currency")}
            </h3>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon">💸</div>
          <div className="summary-text">
            <p>{t("report.summary.totalExpenses")}</p>
            <h3 style={{ color: expenseTotal >= 0 ? "#383f49" : "#c41132" }}>
              {expenseTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              {t("report.currency")}
            </h3>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon">💰</div>
          <div className="summary-text">
            <p>{t("report.summary.netRevenue")}</p>
            <h3 style={{ color: netRevenue >= 0 ? "green" : "red" }}>
              {netRevenue < 0
                ? `-${Math.abs(netRevenue).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}`
                : netRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
            </h3>{" "}
          </div>
        </div>
      </div>
      {/* ✅ الرسم البياني */}
<PaymentChart data={data} />

      <div className="tables-row">
        {/* جدول المصروفات المفصل */}
        <div className="table-container">
          <h2>{t("report.tables.expenses")}</h2>
          <table>
            <thead>
              <tr>
                <th>نوع المصروف</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ عرض البيانات التفصيلية القادمة من الخادم */}
              {data.expenses &&
                data.expenses.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.type}</td>
                    <td>{entry.paymentMethod}</td>
                    <td>
                      {entry.amount.toFixed(2)} {t("report.currency")}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              {/* ✅ عرض الإجمالي في نهاية الجدول */}
              <tr style={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}>
                <td colSpan="2">إجمالي المصروفات</td>
                <td>
                  {data.totalExpenses.toFixed(2)} {t("report.currency")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* جدول التحويلات
        <div className="table-container">
          <h2>{t("report.tables.transfers")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("report.tables.transferType")}</th>
                <th>{t("report.tables.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {transfersData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>*/}
        {/* جدول المصروفات حسب النوع */}
        {/* <div className="table-container">
  <h2>💸 {t("report.summary.Expensesbytype")}</h2>
  <table>
    <thead>
      <tr>
        <th>{t("finance.expensesType")}</th>
        <th>{t("report.tables.total")}</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(
        expenses.reduce((acc, curr) => {
          const type = curr.type || t("finance.unknown");
          acc[type] = (acc[type] || 0) + parseFloat(curr.amount || 0);
          return acc;
        }, {})
      ).map(([type, total], index) => (
        <tr key={index}>
          <td>{type}</td>
          <td>
            {total.toLocaleString()} {t("report.currency")}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div> */}
      </div>

      <div className="tables-row">
        {/* جدول إيرادات القاعة */}
        <div className="table-container">
          <h2>{t("report.tables.hallRevenue")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("finance.Source")}</th>
                <th>{t("report.tables.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {hallRevenueData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* جدول إيرادات الشاليهات */}
        <div className="table-container">
          <h2>{t("report.tables.chaletRevenue")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("report.tables.paymentType")}</th>
                <th>{t("report.tables.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {chaletRevenueData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tables-row">
        {/* ✅ جدول الإيرادات النقدية */}
        <div className="table-container">
          <h2>💵 {t("report.summary.Cashrevenues")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("finance.Source")}</th>
                <th>{t("finance.totals")}</th>
              </tr>
            </thead>
            <tbody>
              {cashRevenueData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ جدول الإيرادات البنكية */}
        <div className="table-container">
          <h2>🏦 {t("report.summary.Bankrevenues")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("finance.Source")}</th>
                <th>{t("finance.totals")}</th>
              </tr>
            </thead>
            <tbody>
              {bankRevenueData1.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ جدول الإيرادات الشبكية */}
        <div className="table-container">
          <h2>💳 {t("report.summary.Networkrevenue")}</h2>
          <table>
            <thead>
              <tr>
                <th>{t("finance.Source")}</th>
                <th>{t("finance.totals")}</th>
              </tr>
            </thead>
            <tbody>
              {networkRevenueData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.paymentMethod}</td>
                  <td>{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
<div className="tables-row"> 

{/* ✅ جدول الإيرادات حسب البنك */}
<div className="table-container">
  <h2>🏦 الإيرادات حسب البنك</h2>
  <table>
    <thead>
      <tr>
        <th>اسم البنك</th>
        <th>إجمالي الإيرادات</th>
      </tr>
    </thead>
    <tbody>
      {bankRevenueData.length > 0 ? (
        bankRevenueData.map((bank, index) => (
          <tr key={index}>
            <td>{bank.bankName}</td>
            <td>
              {bank.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              {t("report.currency")}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="4">لا توجد بيانات لعرضها</td>
        </tr>
      )}
    </tbody>
    <tfoot>
        <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
            <td>الإجمالي</td>
            <td>
                {bankRevenueData.reduce((sum, bank) => sum + bank.totalRevenue, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                {t("report.currency")}
            </td>
        </tr>
    </tfoot>
  </table>
</div>
{/* ✅ جدول المصروفات حسب البنك */}
<div className="table-container">
  <h2>💸 المصروفات حسب البنك</h2>
  <table>
    <thead>
      <tr>
        <th>اسم البنك</th>
        <th>إجمالي المصروفات</th>
      </tr>
    </thead>
    <tbody>
      {bankExpenseData.length > 0 ? (
        bankExpenseData.map((bank, index) => (
          <tr key={index}>
            <td>{bank.bankName}</td>
            <td>
              {bank.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              {t("report.currency")}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="2">لا توجد بيانات لعرضها</td>
        </tr>
      )}
    </tbody>
    <tfoot>
      <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
        <td>الإجمالي</td>
        <td>
          {bankExpenseData.reduce((sum, bank) => sum + bank.totalExpenses, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
          {t("report.currency")}
        </td>
      </tr>
    </tfoot>
  </table>
</div>
</div>
      {/* ✅ جدول المعاملات النقدية */}
      <div className="transaction-table-container">
        <h2>💵 {t("report.summary.Cashtransactions")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("report.tables.transactionId")}</th>
              <th>{t("report.tables.name")}</th>
              <th>{t("report.tables.totalAmount")}</th>
              <th>{t("report.tables.paidAmount")}</th>
              <th>{t("report.tables.remainingAmount")}</th>
              <th>{t("report.tables.transactionType")}</th>
              <th>{t("report.tables.date")}</th>
              <th>{t("report.tables.employee")}</th>
            </tr>
          </thead>
          <tbody>
            {cashTransactions.map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.transactionId}</td>
                <td>{transaction.name}</td>
                <td>
                  {transaction.amount} {t("report.currency")}
                </td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  {transaction.totalPaid} {t("report.currency")}
                </td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {transaction.remainingAmount} {t("report.currency")}
                </td>
                <td>
                  {transaction.transactionType}
                  <br />
                  <strong>{transaction.entity?.name || "غير معروف"}</strong>
                </td>

                <td>{formatReadableDateTime(transaction.date)}</td>
                <td>{transaction.employee}</td> 
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
              <td colSpan="2">{t("report.tables.total")}</td>
              <td>
                {cashTransactions
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "green" }}>
                {cashTransactions
                  .reduce((sum, t) => sum + parseFloat(t.totalPaid), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "red" }}>
                {cashTransactions
                  .reduce((sum, t) => sum + parseFloat(t.remainingAmount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td colSpan="4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ✅ جدول المعاملات البنكية */}
      <div className="transaction-table-container">
        <h2>🏦{t("report.summary.Banktransactions")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("report.tables.transactionId")}</th>
               <th>اسم البنك</th>
              <th>{t("report.tables.name")}</th>
              <th>{t("report.tables.totalAmount")}</th>
              <th>{t("report.tables.paidAmount")}</th>
              <th>{t("report.tables.remainingAmount")}</th>
              <th>{t("report.tables.transactionType")}</th>
              <th>{t("report.tables.date")}</th>
              <th>{t("report.tables.employee")}</th>
            </tr>
          </thead>
          <tbody>
            {bankTransactions.map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.transactionId}</td>
                 <td><strong>{transaction.bankName}</strong></td>
                <td>{transaction.name}</td>
                <td>
                  {transaction.amount} {t("report.currency")}
                </td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  {transaction.totalPaid} {t("report.currency")}
                </td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {transaction.remainingAmount} {t("report.currency")}
                </td>
                <td>
                  {transaction.transactionType}
                  <br />
                  <strong>{transaction.entity?.name || "غير معروف"}</strong>
                </td>{" "}
                <td>{formatReadableDateTime(transaction.date)}</td>
                <td>{transaction.employee}</td> 

              </tr>
            ))}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
              <td colSpan="2">{t("report.tables.total")}</td>
              <td>
                {bankTransactions
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "green" }}>
                {bankTransactions
                  .reduce((sum, t) => sum + parseFloat(t.totalPaid), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "red" }}>
                {bankTransactions
                  .reduce((sum, t) => sum + parseFloat(t.remainingAmount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td colSpan="4"></td>
            </tr>
          </tbody>
        </table>
      </div>
{/* في الجزء السفلي من ملف ReportDetails.jsx داخل الـ return */}

      {/* ✅ جدول المعاملات التأمينية */}
      <div className="transaction-table-container">
        <h2>💳 {t("report.summary.Networktransactions")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("report.tables.transactionId")}</th>
              
              <th>{t("report.tables.name")}</th>
              <th>{t("report.tables.totalAmount")}</th>
              <th>{t("report.tables.paidAmount")}</th>
              <th>{t("report.tables.remainingAmount")}</th>
              <th>{t("report.tables.transactionType")}</th>
              <th>{t("report.tables.date")}</th>
              <th>{t("report.tables.employee")}</th>
            </tr>
          </thead>
          <tbody>
            {networkTransactions.map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.transactionId}</td>
                <td>{transaction.name}</td>
                <td>
                  {transaction.amount} {t("report.currency")}
                </td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  {transaction.totalPaid} {t("report.currency")}
                </td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {transaction.remainingAmount} {t("report.currency")}
                </td>
                
                <td>
                  {transaction.transactionType}
                  <br />
                  <strong>{transaction.entity?.name || "غير معروف"}</strong>
                </td>{" "}
                <td>{formatReadableDateTime(transaction.date)}</td>
                <td>{transaction.employee}</td> 
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f1f1f1" }}>
              <td colSpan="2">{t("report.tables.total")}</td>
              <td>
                {networkTransactions
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "green" }}>
                {networkTransactions
                  .reduce((sum, t) => sum + parseFloat(t.totalPaid), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td style={{ color: "red" }}>
                {networkTransactions
                  .reduce((sum, t) => sum + parseFloat(t.remainingAmount), 0)
                  .toFixed(2)}{" "}
                {t("report.currency")}
              </td>
              <td colSpan="4"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
{/* ✅ جدول ملخص ورديات الموظفين */}
<div className="transaction-table-container">
  <h2>📊 ملخص ورديات الموظفين</h2>
  <table>
    <thead>
      <tr>
        <th>اسم الموظف</th>
        <th>عدد الورديات</th>
        <th>أرقام الورديات</th>
        <th>إجمالي الإيرادات</th>
        <th>إجمالي المصروفات</th>
        <th>إجمالي رصيد الإغلاق</th>
      </tr>
    </thead>
    <tbody>
      {shiftSummaryData.length > 0 ? (
        shiftSummaryData.map((summary, index) => (
          <tr key={index}>
            <td>{summary.employeeName || "غير محدد"}</td>
            <td>{summary.shiftCount}</td>
            <td>{summary.shiftNumbers.join(", ")}</td>
            <td style={{ color: 'green' }}>{summary.totalIncome.toFixed(2)}</td>
            <td style={{ color: 'red' }}>{summary.totalExpenses.toFixed(2)}</td>
            <td style={{ fontWeight: 'bold' }}>{summary.totalClosingBalance.toFixed(2)}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6">لا توجد ورديات مغلقة في هذه الفترة</td>
        </tr>
      )}
    </tbody>
  </table>
</div>

      {/* ✅ جدول تتبع الأرصدة المتبقية (المرحّلة) */}
      <div className="transaction-table-container">
        <h2>متابعة الأرصدة المرحّلة</h2>
        <table>
          <thead>
            <tr>
              <th>من وردية رقم</th>
              <th>الموظف المُسلِّم</th>
              <th>تاريخ التسليم</th>
              <th>المبلغ المُستلم</th>
              <th>المدير المُستلِم</th> {/* ✅ إضافة عمود جديد */}
              <th>المبلغ المُرحَّل (الفرق)</th>
              <th>إلى وردية رقم</th>
              <th>الموظف المُستلِم للرصيد</th>
            </tr>
          </thead>
          <tbody>
            {handoverTraceData.map((trace) => (
              <tr key={trace._id}>
                <td style={{ fontWeight: "bold" }}>
                  {trace.sourceShiftNumber}
                </td>
                <td>{trace.handedOverBy}</td>
                <td>{new Date(trace.handoverDate).toLocaleString("EG")}</td>
                <td style={{ color: "blue" }}>
                  {trace.amountReceivedByManager.toFixed(2)}
                </td>
                <td style={{ color: "#005a9c" }}>{trace.managerWhoReceived}</td>{" "}
                {/* ✅ عرض اسم المدير */}
                <td
                  style={{
                    fontWeight: "bold",
                    color: trace.remainingBalance > 0 ? "green" : "red",
                  }}
                >
                  {trace.remainingBalance.toFixed(2)}
                </td>
                <td style={{ fontWeight: "bold" }}>
                  {trace.receivingShiftNumber}
                </td>
                <td>{trace.receivedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDetails;
