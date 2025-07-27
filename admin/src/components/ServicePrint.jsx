import React, { forwardRef, useEffect } from 'react'
import "../scss/reset.scss";
import logo from "../assets/Logo 1.png"
import { useDispatch, useSelector } from "react-redux"
import { fetchHall } from '../redux/reducers/hall';
import { fetchResort } from '../redux/reducers/resort';
import { fetchChalets } from '../redux/reducers/chalet';
import { fetchCustomer } from '../redux/reducers/customer';
import { Grid } from '@mui/material';

// const ServicePrint = ({ data, services }) => {
    const ServicePrint = forwardRef(({ data, services }, ref) => {
    function renderPeriod() {
        let period = data?.period

        switch (period?.type) {
            case "days":
                return `${period?.startDate} / ${period?.endDate}`

            case "dayPeriod":
                return `${period?.startDate} / ${period?.dayPeriod || "كامل اليوم"}`

            default: return ""
        }
    }
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(fetchChalets())
        dispatch(fetchHall())
        dispatch(fetchResort())
        dispatch(fetchCustomer())
    }, [])
    let entityId = data?.entity?.id
    let chalets = useSelector((state) => state?.chalet?.value?.data)
    let halls = useSelector((state) => state?.hall?.value?.data)
    let resorts = useSelector((state) => state?.resort?.value?.data)
    let entyties = [...chalets, ...resorts, ...halls]
    let entity = entyties.find((ele) => ele._id == entityId)
    const users = useSelector((state) => state.customer.value.data)
    const user = users.find((ele) => ele._id == data?.client?.id)
    const employee = useSelector((state) => state.employee.value.user)
    const totalServicess = services.reduce((acc, curr) => acc + Number(curr.price || 0), 0);


    var dayNames = ["الأحد", "الاثنين", "التلات", "الاربع", "الخميس", "الجمعة", "السبت", "الأحد"];
    function getDay(data) {
        let date = new Date(data).getDay()
        return dayNames[date]
    }
    console.log(services);
    return (
  <div ref={ref} className='border'>
    <div className="resert-container">
      <div className="reset-header">
        <img src={logo} alt="logo" />
        <div className="header-data">
          <h3>{data?.entity?.name} </h3>
          <h5>الفترة : {renderPeriod()}</h5>
          <h5>للحفلات و المناسبات و الايجار اليومي</h5>
          <p>الأحساء - الجبيل - طريق القرى</p>
          <p>الحجوزات : 0505966297 - 0579500033</p>
          <p>الادارة : 0543993689</p>
        </div>
      </div>

      <p style={{ textAlign: "center", margin: "0 0 10px", fontWeight: "900", fontSize: "20px" }}>
        إيصال خدمات
      </p>

      <div className="table-box">
        <div className="table-row">
          <p className="table-heading">الخدمة</p>
          <p className="table-heading">الباكدج</p>
          <p className="table-heading">السعر</p>
        </div>
        {services.map((ele, key) => (
          <div className="table-row" key={key}>
            <p className="table-data">{ele.service}</p>
            <p className="table-data">{ele.package}</p>
            <p className="table-data">{ele.price}</p>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: '10px', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <p dir="ltr">Total price:</p>
        <p>{totalServicess} ريال</p>
        <p>اجمالي السعر:</p>
      </div>

      <Grid container spacing={2} justifyContent={'flex-start'} padding={2}>
        <Grid item xs={6}>الطرف الاول : <b> قاعة و منتجع سدرة فاطمة</b></Grid>
        <Grid item xs={6}> الختم</Grid>
        <Grid item xs={12}> الطرف الثاني : {data?.client?.name}</Grid>
        <Grid item xs={6}> رقم التواصل : {data?.client?.phone}</Grid>
        <Grid item xs={6}> ...................................................</Grid>
        <Grid item xs={12}>التوقيع : ...........................................</Grid>
      </Grid>

      <div className="line"></div>
      <p style={{ margin: "10px" }}>
        الموظف : {employee?.name}
      </p>
    </div>
  </div>
);

    }
    )
    
export default ServicePrint;


