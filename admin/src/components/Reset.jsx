import React, { forwardRef, useEffect } from "react";
import "../scss/reset.scss";
import logo from "../assets/Logo 1.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchHall } from "../redux/reducers/hall";
import { fetchResort } from "../redux/reducers/resort";
import { fetchChalets } from "../redux/reducers/chalet";
import { fetchCustomer } from "../redux/reducers/customer";
import { Grid } from "@mui/material";

const Reset = ({ data, totalInsurance, totalPaid, totalServices }) => {
  function renderPeriod() {
    let period = data?.period;

    switch (period?.type) {
      case "days":
        return `${period?.startDate} / ${period?.endDate}`;

      case "dayPeriod":
        return `${period?.startDate} / ${period?.dayPeriod || "كامل اليوم"}`;

      default:
        return "";
    }
  }
  const formatTime12Hour = (timeString, lang) => {
    if (!timeString || !timeString.includes(":")) return "";

    const [hour, minute] = timeString.split(":");
    let h = parseInt(hour, 10);

    // ✅ تحديد الاختصار بناءً على اللغة الحالية
    const ampm = lang === "ar" ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12; // الساعة 0 يجب أن تكون 12

    const minuteStr = minute.padStart(2, "0");

    return `${h}:${minuteStr} ${ampm}`;
  };
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchChalets());
    dispatch(fetchHall());
    dispatch(fetchResort());
    dispatch(fetchCustomer());
  }, []);

  let entityId = data?.entity?.id;
  let chalets = useSelector((state) => state?.chalet?.value?.data);
  let halls = useSelector((state) => state?.hall?.value?.data);
  let resorts = useSelector((state) => state?.resort?.value?.data);
  let entyties = [...chalets, ...resorts, ...halls];
  let entity = entyties.find((ele) => ele._id == entityId);
  const users = useSelector((state) => state.customer.value.data);
  const user = users.find((ele) => ele._id == data?.client?.id);
  const employee = useSelector((state) => state.employee.value.user);

  function renderTime(time) {
    switch (time) {
      case "start":
        if (data?.period?.type == "days") {
          return entity?.dayStartHour;
        } else {
          if (data?.period?.dayPeriod == "صباحية") {
            return entity?.dayStartHour;
          } else {
            return entity?.nightStartHour;
          }
        }
      case "end":
        if (data?.period?.type == "days") {
          return entity?.nightEndHour;
        } else {
          if (data?.period?.dayPeriod == "صباحية") {
            return entity?.dayEndHour;
          } else {
            return entity?.nightEndHour;
          }
        }
    }
  }

  function getDay(data) {
    if (!data) return "";
    const date = new Date(data);
    // 'ar-EG' للغة العربية، و 'long' لعرض اسم اليوم كاملاً
    return date.toLocaleDateString("ar-EG", { weekday: "long" });
  }

  return (
    <div className="border">
      <div className="resert-container">
        <div className="receipt-header">
          <div className="company-details">
            <h3>مجموعة سدرة فاطمة</h3>
            <p>قاعة مناسبات - شاليهات</p>
            <p>للحجوزات: 0505966297 - 0569500033</p>
          </div>
          <img src={logo} alt="logo" className="company-logo" />
        </div>

        <div className="contract-title">
          <h2>عقد إيجار</h2>
          <p className="contract-number">رقم العقد: {data?.contractNumber}</p>
        </div>
        <div class="table-box">
          <div class="table-row">
            <p class="table-heading">اسم العميل</p>
            <p class="table-data">{data?.client?.name || "-"}</p>
            <p class="table-heading">رقم الهوية</p>
            <p class="table-data">{user?.idNumber || "-"}</p>
          </div>
          <div class="table-row">
            <p class="table-heading">رقم الجوال</p>
            <p class="table-data">{data?.client?.phone || "-"}</p>
            <p class="table-heading">المكان</p>
            <p class="table-data">{data?.entity?.name}</p>
          </div>
          <div class="table-row">
            <p class="table-heading">قيمة الاستئجار</p>
            <p class="table-data">{data?.cost}</p>
            <p class="table-heading"> مبلغ التأمين</p>
            <p class="table-data">{totalInsurance}</p>
          </div>

          <div class="table-row">
            <p class="table-heading">تاريخ الدخول</p>
            <p class="table-data">{data?.period?.startDate}</p>
            <p class="table-heading">تاريخ المغادرة</p>
            <p class="table-data">{data?.period?.startDate}</p>
          </div>
          <div class="table-row">
            <p class="table-heading">فترة الدخول</p>
            <p class="table-data">
              {data?.period?.checkIn?.name} (
              {formatTime12Hour(data?.period?.checkIn?.time)})
            </p>
            <p class="table-heading">فترة المغادرة</p>
            <p class="table-data">
              {data?.period?.checkOut?.name} (
              {formatTime12Hour(data?.period?.checkOut?.time)})
            </p>
          </div>

          <div class="table-row">
            <p class="table-heading">يوم الدخول </p>
            <p class="table-data">{getDay(data?.period?.startDate)}</p>
            <p class="table-heading">يوم المغادرة </p>
            <p class="table-data">{getDay(data?.period?.endDate)}</p>
          </div>
        </div>
        <h3 className="rules-title">الرجاء قراءة الشروط قبل التوقيع </h3>
        <ul className="rules">
          <li>*عند إلغاء الحجز لا يتم استرداد أي مبالغ مدفوعة اطلاقاً </li>
          <li>*
            {" "}
            في حال تأجيل الحجز يتم التأجيل لمرة واحده وسط الأسبوع حسب اليوم
            المتوفر مع احتساب فرق السعر أن وجد
          </li>
          <li>* يمنع اصطحاب الاطفال داخل الشاليهات</li>
          <li>*
            {" "}
            على صاحب المناسبة الانتباه للأطفال أثناء السباحة والادارة غير مسئولة
            عن ذلك
          </li>
          <li>*
            {" "}
            في حال التأخير عن الوقت المحدد للخروج في العقد يتم احتساب مبلغ
            إضافية عن كل ساعة
          </li>
          <li>* لا يحق للمستأجر التأجير لطرف ثالث إطلاقاً</li>
          <li>* يجب دفع متبقي مبلغ الإيجار قبل موعد المناسبة بـ 30 يوم</li>
          <li>*
            {" "}
            في حالة استئجار كوشة أو تنسيق يجب التنبيه عليهم بعدم وضع ملصقات على
            الجدران أو الأثاث
          </li>
          <li>* ادارة المكان غير مسؤولة عن فقدان أو ضياع الاغراض الشخصية</li>
          <li>* يتعهد الطرف الثاني باستعمال الموقع للغرض الذي أُعده له</li>
          <li>*
            {" "}
            يتعهد الطرف الثاني بمسؤولية عن كل حريق، تلفيات أو سرقة تحصل للموقع
            أو موجوداته مهما كانت الأسباب
          </li>
          <li>*
            {" "}
            يتعهد الطرف الثاني بعدم حمل السلاح أو إطلاق نار أو استخدام الألعاب
            النارية من قبله أو من قبل المدعوين
          </li>
          <li>*
            {" "}
            عند إنقطاع الكهرباء خارج عن إرادتنا لا يحق للمستأجر المطالبة
            بالتعويض
          </li>
          <li>*
            {" "}
            في حال إقفال المنشاة من قبل الجهات الأمنية لأسباب تتعلق بالحظر أو
            لأي سبب كان، فلا يحق للمستأجر المطالبة بالمبالغ المدفوعة ويمكن
            تعويضه بيوم آخر بعد فتح المنشاة
          </li>
        </ul>
        <div className="line"></div>
        <Grid
          container
          spacing={2}
          justifyContent={"center"}
          alignItems={"center"}
          padding={2}
        >
          <Grid item xs={12}>
            الطرف الاول : <b> قاعة و منتجع سدرة فاطمة</b>
          </Grid>
          <Grid item xs={12}>
            {" "}
            الطرف الثاني : {data?.client?.name}
          </Grid>
          <Grid item xs={6}>
            {" "}
            رقم التواصل : {data?.client?.phone}
          </Grid>
          <Grid item xs={6} textAlign={"center"}>
            {" "}
            الختم
          </Grid>
          <Grid item xs={6}>
            التوقيع : ...........................................
          </Grid>
          <Grid item xs={6} textAlign={"center"} sx={{ margin: "24px 0" }}>
            {" "}
            ...................................................
          </Grid>
        </Grid>

        <div className="line"></div>
        <p style={{ margin: "10px " }}>الموظف : {employee?.name}</p>
      </div>
    </div>
  );
};

export default forwardRef(Reset);
