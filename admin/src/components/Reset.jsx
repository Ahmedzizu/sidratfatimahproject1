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

  var dayNames = [
    "الأحد",
    "الاثنين",
    "التلات",
    "الاربع",
    "الخميس",
    "الجمعة",
    "السبت",
    "الأحد",
  ];
  function getDay(data) {
    let date = new Date(data).getDay();
    return dayNames[date];
  }

  return (
    <div className="border">
      <div className="resert-container">
        <div className="reset-header">
          <img src={logo} alt="logo" />
          <div className="header-data">
            <h3>{data?.entity?.name} </h3>
            {/* <h5>الفترة : {renderPeriod()}</h5> */}
            {/* <h5>للحفلات و المناسبات و الايجار اليومي</h5> */}
            {/* <p>الأحساء - الجبيل - طريق القرى</p> */}
            <p>مجموعة سدرة فاطمة </p>
            <p> قاعة مناسبات - شاليهات </p>
            <p>الحجوزات : 0505966297 - 0569500033</p>
          </div>
        </div>
        <div
          className="title"
          style={{
            margin: "0",
            marginRight: "auto",
            justifyContent: "space-around",
            width: "73%",
          }}
        >
          <p className="title-p">NO. {data?.contractNumber}</p>
          <h3>عقد ايجار </h3>
        </div>
        <div class="table-box">
          <div class="table-row">
            <p class="table-heading">اسم العميل</p>
            <p class="table-data">{data?.client?.name || "-"}</p>
            <p class="table-heading">رقم الهوية</p>
            <p class="table-data">{user?.nationalId || "-"}</p>
          </div>
          <div class="table-row">
            <p class="table-heading">رقم الجوال</p>
            <p class="table-data">{data?.client?.phone || "-"}</p>
            <p class="table-heading">رقم الجوال2</p>
            <p class="table-data">{user?.phone2 || "-"}</p>
          </div>
          <div class="table-row">
            <p class="table-heading">قيمة الاستئجار</p>
            <p class="table-data">{data?.cost}</p>
            <p class="table-heading"> مبلغ التأمين</p>
            <p class="table-data">{totalInsurance}</p>
          </div>
          {/*<div class="table-row">
                    <p class="table-heading">ساعة القدوم</p>
                    <p class="table-data">{renderTime("start")}</p>
                    <p class="table-heading"> ساعة المغادرة</p>
                    <p class="table-data">{renderTime("end")}</p>
                </div>*/}
          <div class="table-row">
            <p class="table-heading">تاريخ الدخول</p>
            <p class="table-data">{data?.period?.startDate}</p>
            <p class="table-heading">تاريخ المغادرة</p>
            <p class="table-data">
              {data?.period?.endDate || data?.period?.startDate}
            </p>
          </div>
          <div class="table-row">
            <p class="table-heading">فترة الدخول</p>
            <p class="table-data">{data?.period?.checkInPeriod }</p>
            <p class="table-heading">فترة المغادرة</p>
            <p class="table-data">{data?.period?.checkOutPeriod}</p>
          </div>

          <div class="table-row">
            <p class="table-heading">المكان</p>
            <p class="table-data">{data?.entity?.name}</p>
            <p class="table-heading">يوم الحجز</p>
            <p class="table-data">{getDay(data?.period?.startDate)}</p>
          </div>
          <div class="table-row"></div>
          <div class="table-row"></div>
        </div>
        <h3 className="rules-title">الرجاء قراءة الشروط قبل التوقيع </h3>
        <ul className="rules">
          <li> * عند إلغاء الحجز لا يتم استرداد أي مبالغ مدفوعة اطلاقاً </li>
          <li>
            {" "}
            * في حال تأجيل الحجز يتم التأجيل لمرة واحده وسط الأسبوع حسب اليوم
            المتوفر مع احتساب فرق السعر أن وجد
          </li>
          <li> * يمنع اصطحاب الاطفال داخل الشاليهات</li>
          <li>
            {" "}
            * على صاحب المناسبة الانتباه للأطفال أثناء السباحة والادارة غير
            مسئولة عن ذلك
          </li>
          <li>
            {" "}
            * في حال التأخير عن الوقت المحدد للخروج في العقد يتم احتساب مبلغ
            إضافية عن كل ساعة
          </li>
          <li> * لا يحق للمستأجر التأجير لطرف ثالث إطلاقاً</li>
          <li> * يجب دفع متبقي مبلغ الإيجار قبل موعد المناسبة بـ 30 يوم</li>
          <li>
            {" "}
            * في حالة استئجار كوشة أو تنسيق يجب التنبيه عليهم بعدم وضع ملصقات
            على الجدران أو الأثاث
          </li>
          <li> * ادارة المكان غير مسؤولة عن فقدان أو ضياع الاغراض الشخصية</li>
          <li> * يتعهد الطرف الثاني باستعمال الموقع للغرض الذي أُعده له</li>
          <li>
            {" "}
            * يتعهد الطرف الثاني بمسؤولية عن كل حريق، تلفيات أو سرقة تحصل للموقع
            أو موجوداته مهما كانت الأسباب
          </li>
          <li>
            {" "}
            * يتعهد الطرف الثاني بعدم حمل السلاح أو إطلاق نار أو استخدام الألعاب
            النارية من قبله أو من قبل المدعوين
          </li>
          <li>
            {" "}
            * عند إنقطاع الكهرباء خارج عن إرادتنا لا يحق للمستأجر المطالبة
            بالتعويض
          </li>
          <li>
            {" "}
            * في حال إقفال المنشاة من قبل الجهات الأمنية لأسباب تتعلق بالحظر أو
            لأي سبب كان، فلا يحق للمستأجر المطالبة بالمبالغ المدفوعة ويمكن
            تعويضه بيوم آخر بعد فتح المنشاة
          </li>
        </ul>
        {/* <h5 className='notes' >- الملاحظات :</h5> */}
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
        {/* <div className="line"></div> */}
        {/* <h5 className='promise'>تعهد</h5> */}
        {/* <p> اتعهد انا {data?.client?.name} أن أكون متواجدا ز مسئولا عن المسبح و عن مرتاديه و مرتدياته خلال فترة الايجار خالي المسئولية عن ما يترتب على ذلك و على ذلك اوقع     التوقيع :</p> */}
      </div>
    </div>
  );
};

export default forwardRef(Reset);
