import React from "react";
import { Doughnut, Bar } from "react-chartjs-2"; // استيراد Doughnut و Bar
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useTranslation } from "react-i18next"; // ✅ Import translation function

ChartJS.register(ArcElement, BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const PaymentChart = ({ data }) => {
  console.log("البيانات التي وصلت للمخطط:", data);
  const { t } = useTranslation(); // ✅ Initialize translation function
if (!data) {
    return null;
  }

  // 1. حساب الإجماليات مباشرة من الـ data prop
  const totalCash = (data.hallRevenue?.cash || 0) + (data.chaletRevenue?.cash || 0);
const totalBankTransfer = (data.hallRevenue?.bankTransfer || 0) + (data.chaletRevenue?.bankTransfer || 0); 
 const totalInsurance = (data.hallRevenue?.insurance || 0) + (data.chaletRevenue?.insurance || 0);
  const totalHallRevenue = data.totalHallRevenue || 0;
  const totalChaletRevenue = data.totalChaletRevenue || 0;
  

  // التحقق من القيم الخاصة بالدائري
  const isAllZeroDoughnut = totalCash === 0 && totalBankTransfer === 0 && totalInsurance === 0;

  // بيانات الرسم الدائري
  const doughnutData = {
    labels: ["نقداً", "حوالات بنكية", "شبكة"],
    datasets: [
      {
        data: isAllZeroDoughnut ? [1] : [totalCash, totalBankTransfer, totalInsurance],
        backgroundColor: isAllZeroDoughnut
          ? ["#d3d3d3", "#d3d3d3", "#d3d3d3"]
          : ["#F4A261", "#457B9D", "#2A9D8F"], // ألوان عادية
        hoverBackgroundColor: isAllZeroDoughnut
          ? ["#a9a9a9", "#a9a9a9", "#a9a9a9"]
          : ["#E76F51", "#1D3557", "#21867A"], // ألوان عند التمرير
        borderWidth: 2,
        borderColor: "#fff", // حدود بيضاء
      },
    ],
  };

  // التحقق من القيم الخاصة بالعمودي
  const isAllZeroBar = totalHallRevenue === 0 && totalChaletRevenue === 0;

  // بيانات الرسم العمودي
  const barData = {
    labels: ["إيرادات القاعة", "إيرادات الشاليهات"],
    datasets: [
      {
        label: "الإيرادات",
        data: isAllZeroBar ? [1, 1] : [totalHallRevenue, totalChaletRevenue],
        backgroundColor: isAllZeroBar ? "#d3d3d3" : "#2A9D8F", // لون رمادي إذا كانت القيم صفرًا
        hoverBackgroundColor: isAllZeroBar ? "#a9a9a9" : "#21867A", // لون عند التمرير
        borderRadius: 5, // زوايا الأعمدة
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#B38D46", // لون النصوص
          font: {
            size: 14,
            family: "Arial",
          },
          boxWidth: 20,
        },
      },
      tooltip: {
        backgroundColor: "#333", // خلفية التلميح
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 5,
        callbacks: {
          // إذا كانت القيم صفرًا، عرض رسالة مخصصة
          label: (tooltipItem) => {
            if (isAllZeroDoughnut) return "جميع القيم 0 ل.س";
            return `${tooltipItem.label}: ${tooltipItem.raw.toLocaleString()} ل.س`;
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        display: "flex", // لجعل العناصر جنبًا إلى جنب
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        margin: "20px auto",
        padding: "20px",
        background: "#f9f9f9", // خلفية الرسم
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", // ظل خفيف
        borderRadius: "10px", // زوايا دائرية
        height: "600px", // زيادة الطول
      }}
    >
      {/* الرسم الدائري */}
      <div style={{ flex: "1", height: "400px" }}>
        <h3
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#333",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          {t("report.charts.paymentDistribution")} 
        </h3>
        <Doughnut data={doughnutData} options={options} />
        {isAllZeroDoughnut && (
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              color: "#a9a9a9",
              fontSize: "1.2rem",
            }}
          >
          {t("report.charts.noData")} 
          </p>
        )}
      </div>

      {/* الرسم العمودي */}
      <div style={{ flex: "1", height: "400px" }}>
        <h3
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#333",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
        {t("report.charts.revenueDistribution")} 
        </h3>
        <Bar data={barData} options={options} />
        {isAllZeroBar && (
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              color: "#a9a9a9",
              fontSize: "1.2rem",
            }}
          >
           {t("report.charts.noData")} 
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentChart;
