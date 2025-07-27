import React, { forwardRef, useEffect } from 'react'
import "../scss/payment-reset.scss";
import logo from "../assets/Logo 1.png"
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useDispatch, useSelector } from "react-redux"
import { fetchHall } from '../redux/reducers/hall';
import { fetchResort } from '../redux/reducers/resort';
import { fetchChalets } from '../redux/reducers/chalet';
import { fetchCustomer } from '../redux/reducers/customer';
import { Grid } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import {format} from "date-fns"

const PaymentReset = ({ data, totalInsurance, paymentData, totalPaid, totalServices, children }) => {

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

    function renderTime(time) {
        switch (time) {
            case "start":
                if (data?.period?.type == "days") {
                    return entity?.dayStartHour
                } else {
                    if (data?.period?.dayPeriod == "صباحية") {
                        return entity?.dayStartHour
                    } else {
                        return entity?.nightStartHour
                    }
                }
            case "end":
                if (data?.period?.type == "days") {
                    return entity?.nightEndHour
                } else {
                    if (data?.period?.dayPeriod == "صباحية") {
                        return entity?.dayEndHour
                    } else {
                        return entity?.nightEndHour

                    }
                }
        }
    }
    var dayNames = ["الأحد", "الاثنين", "التلات", "الاربع", "الخميس", "الجمعة", "السبت", "الأحد"];
    function getDay(data) {
        let date = new Date(data).getDay()
        return dayNames[date]
    }

    console.log(paymentData);
    console.log("🚀 ~ paymentData:", paymentData);

    return (
        <div className='border'>
            <div className="resert-container">
                <div className="reset-header">
                    <div className="heading-img">
                        <img src={logo} alt="logo" />
                    </div>
                    <div className="center-heading">
                        <p>سند قبض</p>
                        <p>Receipt voucher</p>
                        <div className="line"></div>
                        <p>No . {paymentData?.paymentContractNumber} : سند رقم </p>

                    </div>
                    <div className="header-data">
                        <h3>{data?.entity?.name} </h3>
                        <p>مجموعة سدرة فاطمة </p>
                        <p> قاعة مناسبات - شاليهات </p>
                        <p>الحجوزات : 0505966297 - 0569500033</p>
                    </div>
                </div>
                <div className='row'>
                    <p dir='ltr'> Received from Mr./Mrs. </p>
                    <p> {data?.client?.name}</p>
                    <p> استلمنا من السيد/ السادة</p>
                </div>
                <div className='row'>
                    <p dir='ltr'>The sum of: </p>
                    <div className="box2"> {paymentData?.paid} ريال </div>
                    <p>مبلغ و قدره :</p>

                </div>
                <div className="row">
                    <p>.....................</p>
                    <div className='coloum'>
                        <p>التأمين</p>
                        <p dir='ltr'>Insurance </p>
                    </div>
                    <div className="small-box">{paymentData.type == "تأمين" && <CheckIcon color='success' />}</div>
                    <div className="coloum">
                        <p>حوالة بنكية </p>
                        <p>Bank transfer</p>
                       {paymentData?.bank?.name&& <p>{`(${paymentData?.bank?.name})`}</p>}
                    </div>
                    <div className="small-box">{paymentData.type == "تحويل بنكي" && <CheckIcon />}</div>
                    <div className="coloum">
                        <p>نقدي </p>
                        <p>Cash</p>
                    </div>
                    <div className="small-box">{paymentData.type == "نقدي" && <CheckIcon />}</div>
                </div>
                {/* <div className="row">
                    <p dir='ltr'>For : </p>
                    <p>....................................................................................................</p>
                    <p>وذلك عن : </p>
                </div> */}
                <div className="row">
                    <p dir='ltr'>Note : </p>
                    <p>....................................................................................................</p>
                    <p>ملاحظات : </p>
                </div>

                <div className="row">
                    <div className="coloum">
                        <p>الختم</p>
                        <p>..........................</p>
                    </div>
                    {/* <table>
                        <tr>
                            <td>المبلغ المطلوب</td>
                            <td></td>
                            <td>اجمالي المدفوع</td>
                            <td>{totalPaid}</td>
                        </tr>
                        <tr>
                            <td>المبلغ المدفوع</td>
                            <td></td>
                            <td>اجمالي المتبقي</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>مبلغ التأمين</td>
                            <td>{totalInsurance}</td>
                            <td colSpan={2}> يعاد مبلغ التأمين في حال عدم فقد او كسر اي شئ</td>
                        </tr>
                    </table> */}
                    <div className="coloum" >
                        <p style={{textAlign :"start" , width:"100%"}}>التاريخ : <span>{format(new Date() , "yyyy/MM/dd")}</span>  </p>
                        <p style={{textAlign :"start" , width:"100%"}}>الموافق : <span className='date'> / / </span>  </p>
                        <p style={{textAlign :"start" , width:"100%"}}>الموظف :  {employee?.name} </p>
                    </div>
                </div>

                {/* <Grid container spacing={2} justifyContent={'flex-start'} padding={2}>
                    <Grid item xs={6}>الطرف الاول : <b> قاعة و منتجع سدرة فاطمة</b></Grid>
                    <Grid item xs={6}> الختم</Grid>
                    <Grid item xs={12}> الطرف الثاني : {data?.client?.name}</Grid>
                    <Grid item xs={6}> رقم التواصل : {data?.client?.phone}</Grid>
                    <Grid item xs={6}> ...................................................</Grid>
                    <Grid item xs={12}>التوقيع : ...........................................</Grid>
                </Grid>
                <div className="line"></div>
                <p style={{ margin: "10px " }}>
                    الموظف : {employee?.name}
                </p>
                <div className="line"></div>
                <h5 className='promise'>تعهد</h5>
                <p> اتعهد انا {data?.client?.name} أن أكون متواجدا ز مسئولا عن المسبح و عن مرتاديه و مرتدياته خلال فترة الايجار خالي المسئولية عن ما يترتب على ذلك و على ذلك اوقع     التوقيع :</p> */}
            </div>
        </div>
    )
}

export default PaymentReset;