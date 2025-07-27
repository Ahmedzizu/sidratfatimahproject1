import React, { useEffect, useRef, useState } from 'react'
import EmployeeNavigation from '../components/EmployeeNavigation';
import { TextField, Button, Grid, Box } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import "../scss/addChalets.scss"
import { useDispatch, useSelector } from 'react-redux';
import Api from './../config/config';
import { fetchEmploees, fetchEmployeeAbsence, fetchEmployeeFinance } from './../redux/reducers/employee';
import { useTranslation } from 'react-i18next';
import "../scss/employee.scss"
import { useNavigate, useParams } from 'react-router-dom';
import AddEmployeeFinance from '../modals/AddEmployeeFinance';
import logo from "../assets/logo2.png"
import "../scss/employeedata.scss"
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import ReactToPrint from 'react-to-print';

const EmployeeMonthDetails = () => {

  let {id} = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user=useSelector((state)=>state.employee.value.user)
  const users=useSelector((state)=>state.employee.value.data)
  const employees=useSelector((state)=>state.employee.value.data)
  const employee=employees.find((ele)=>ele._id === id)
  const finance=useSelector((state)=>state.employee.value.finance)
  const absences=useSelector((state)=>state.employee.value.absence)
  const [open ,setOpen]=useState(false)
  const [detailsOpen ,setDetailsOpen]=useState({open:false,id:""})
  const { t, i18n } = useTranslation();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = [...new Set(finance.map(item => item.date.split('-')[0]))]; 

  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

useEffect(()=>{
  dispatch(fetchEmployeeFinance())
  dispatch(fetchEmployeeAbsence())
},[]) 

const handleClose = () => {
  dispatch(fetchEmployeeFinance())
  setOpen(false)
  setDetailsOpen({open:false,id:""})
}
let filterdFinance = finance 
let filterdAbsence =  absences


if(selectedMonth){
  filterdFinance= filterdFinance.filter((ele)=>{
    let tempMonth = parseInt( ele?.date?.split("-")[1]) -1
    return tempMonth == months.indexOf(selectedMonth)
  })
  filterdAbsence= filterdAbsence.filter((ele)=>{
    let tempMonth = parseInt( ele?.date?.split("-")[1]) -1
    return tempMonth == months.indexOf(selectedMonth)
  })
}

if(selectedYear){
  filterdFinance= filterdFinance.filter((ele)=>{
    let tempYear = parseInt( ele?.date?.split("-")[0])
    return tempYear==selectedYear
  })
  filterdAbsence= filterdAbsence.filter((ele)=>{
    let tempYear = parseInt( ele?.date?.split("-")[0])
    return tempYear==selectedYear
  })
}



function calcBousHours(id){
  let tempData = filterdFinance.filter((ele)=>ele?.employee?._id == id && ele.type == "bonus")
  let bounsHours = tempData?.reduce((prev,curr)=>{
    return prev +curr.bonusHours
  },0)
  return bounsHours
}

function calcBonus(id){
  let tempData = filterdFinance.filter((ele)=>ele?.employee?._id == id && ele.type == "bonus")
  let bouns = tempData?.reduce((prev,curr)=>{
    return prev +curr.amount
  },0)
  return bouns
}

function calcDiscount(id){
  let tempData = filterdFinance.filter((ele)=>ele?.employee?._id == id && ele.type == "discount")
  let discount = tempData?.reduce((prev,curr)=>{
    return prev +curr.amount
  },0)
  return discount
}

function calcAbsencent(id){
  let tempData = filterdAbsence.filter((ele)=>ele?.employee?._id == id)
  return tempData.length
}

function calcRemainSalary(id,salary){
  let totalBonus = calcBonus(id)
  let totalDiscount = calcDiscount(id)

  return (totalBonus + salary) - totalDiscount 
}
const currentDate = new Date();


const [daysInMonth , setDaysInMonth]= useState(0)

useEffect(()=>{
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are 0-indexed
  const daysInMonth = new Date(year, month, 0).getDate();
  setDaysInMonth(daysInMonth);
},[])

const noOfRows = Array.from({ length: daysInMonth }, (_, i) => i + 1);


let employeeFinance = finance.filter((ele)=>ele?.employee?._id == id)


if(selectedMonth){
  employeeFinance= employeeFinance.filter((ele)=>{
    let tempMonth = parseInt( ele?.date?.split("-")[1]) -1
    return tempMonth == months.indexOf(selectedMonth)
  })
  filterdAbsence= filterdAbsence.filter((ele)=>{
    let tempMonth = parseInt( ele?.date?.split("-")[1]) -1
    return tempMonth == months.indexOf(selectedMonth)
  })
}

if(selectedYear){
  employeeFinance= employeeFinance.filter((ele)=>{
    let tempYear = parseInt( ele?.date?.split("-")[0])
    return tempYear==selectedYear
  })
  filterdAbsence= filterdAbsence.filter((ele)=>{
    let tempYear = parseInt( ele?.date?.split("-")[0])
    return tempYear==selectedYear
  })
}
let bonusFinance = employeeFinance.filter((ele)=>ele.type=="bonus")
let discountFinance = employeeFinance.filter((ele)=>ele.type=="discount")


const createPDF = () => {
  setTimeout(() => {
    const element = document.querySelector('#reservation-reset');
    const scaleFactor = 2; // Increase the scale factor for higher DPI
    html2canvas(element, {
      scale: scaleFactor,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont('Arial');
      pdf.addImage(imgData, 'JPEG', 5, 5, pdf.internal.pageSize.width-10 , pdf.internal.pageSize.height - 20);
      pdf.save(`${employee.name}`);
    });
  }, 100);
};

function getDayDate (date){
  let day = date.split("-")[2]
  return parseInt(day)
}
function daybonusHours (date){
    let bonsuDays = bonusFinance.filter((ele)=>getDayDate(ele.date) == date )
    let totalBonus = bonsuDays.reduce((prev,cur)=>prev+= cur.bonusHours,0) 
    return  totalBonus?totalBonus: "-"
  }
  function daybonus (date){
    let bonsuDays = bonusFinance.filter((ele)=>getDayDate(ele.date) == date && ele.type=="bonus")
    let totalBonus = bonsuDays.reduce((prev,cur)=>prev+= cur.amount,0) 
    return  totalBonus?totalBonus: "-"
}
function dayDiscount (date){
  let bonsuDays = bonusFinance.filter((ele)=>getDayDate(ele.date) == date && ele.type=="discount")
  let totalBonus = bonsuDays.reduce((prev,cur)=>prev+= cur.amount,0) 
  return  totalBonus?totalBonus: "-"
}
function dayNotes (date){
  let note = employeeFinance.find((ele)=>getDayDate(ele.date) == date )
  return note && note.notes? note.notes :"-"
}
function dayAbsence (date){
  let day = filterdAbsence.find((ele)=>getDayDate(ele.date) == date )
  return day ? "-" :"✔️ "
}

var dayNames = ["الأحد", "الاثنين", "التلات", "الاربع", "الخميس", "الجمعة", "السبت","الأحد"];
function getDay(day){
  let year = selectedYear || new Date().getFullYear()
  let month = selectedMonth || new  Date().getMonth()
  let date = new Date(`${year}-${month}-${day}`).getDay()
  return dayNames[date]
}
const [loading,setLoading]=useState(false)
const tempRef = useRef()
const componentRef = useRef()

function handlePrint(){
  setLoading(true)
  setTimeout(()=>{
      tempRef.current.click()
  },100)
}

  return (
    <>
        <EmployeeNavigation id={3}/>
        {/* {user.admin || (user.permissions&&user.permissions.employee)? <div className="cont" style={{marginTop:"20px"}}> */}

        <ReactToPrint
        trigger={() => <button ref={tempRef} style={{display:"none"}}>Print this out!</button>}
        content={() => componentRef.current}
        onAfterPrint={()=>setLoading(false)}
        onBeforePrint={()=>setLoading(true)}
        // pageStyle={{width:"120%"}}
        copyStyles={true}
      />
        <LocalPrintshopIcon id="share" className='onshare' onClick={handlePrint}/>




        <div className="search-box">  
        <select className='select-filter' value={selectedMonth} onChange={handleMonthChange}>
           <option value="">All</option>
            {months.map((month, index) => (
            <option key={index} value={month}>{month}</option>
            ))}
       </select>
       <select value={selectedYear} className='select-filter' onChange={handleYearChange}>
        <option value="">All</option>
        {years.map((year, index) => (
          <option key={index} value={year}>{year}</option>
        ))}
      </select>
      </div>
        <div className='border' id='reservation-reset' ref={componentRef}>
        <div className="resert-container">
            <div className="reset-header">
                <img src={logo} alt="logo" />
                <div className="salary-header">
                    <p>مسير رواتب الشهر</p>
                    <p>Month salary details</p>
                    <p>{new Date().getFullYear()} / {months[new Date().getUTCMonth()]} {new Date().getDate()} </p>
                </div>
                <div className="header-data">
                    {/* <h3>{data?.entity?.name}</h3> */}
                    <h5>للحفلات و المناسبات و الايجار اليومي</h5>
                    <p>الأحساء - الجبيل - طريق القرى</p>
                    <p>الحجوزات : 0505966297 - 0579500033</p>
                    <p>الادارة : 0558855547</p>
                </div>
            </div>
           
            <div class="table-box">
                <div class="table-row">
                    <p class="table-heading">
                      <p>رقم الهوية</p>
                      <p>ID Number</p>
                    </p>
                    <p class="table-heading">
                      <p>اسم الموظف</p>
                      <p>Employee Name</p>
                    </p>
                    <p class="table-heading">
                      <p>الوظيفة</p>
                      <p>Job</p>
                    </p>
                </div>
                <div class="table-row">
                    <p className='table-data'>{employee?.nationalId}</p>
                    <p className='table-data'>{employee?.name}</p>
                    <p className='table-data'>{employee?.position}</p>
                </div>
            </div>
            <div class="table-box" style={{marginTop:"20px "}}>
                <div class="table-row">
                    <p class="table-heading">
                      <p>التاريخ</p>
                      <p>Dater</p>
                    </p>
                    <p class="table-heading">
                      <p>اليوم</p>
                      <p>Day</p>
                    </p>
                    <p class="table-heading">
                      <p>يوم عمل</p>
                      <p>Work Day</p>
                    </p>
                    <p class="table-heading">
                      <p>وقت اضافي</p>
                      <p>Over time</p>
                    </p>
                    <p class="table-heading">
                      <p> اضافة</p>
                      <p>Bonus</p>
                    </p>
                    <p class="table-heading">
                      <p>خصم</p>
                      <p>Discount</p>
                    </p>
                    <p class="table-heading">
                      <p>ملاحظات</p>
                      <p>Notes</p>
                    </p>
                </div>
                   {
                    noOfRows.map((e,ind)=>(
                <div class="table-row" key={ind}>
                      <p className='table-data'>{e}</p>
                      <p className='table-data'>{getDay(e)}</p>
                      <p className='table-data'>{dayAbsence(e)}</p>
                      <p className='table-data'>{daybonusHours(e)}</p>
                      <p className='table-data'>{daybonus(e)}</p>
                      <p className='table-data'>{dayDiscount(e)}</p>
                      <p className='table-data'>{dayNotes(e)}</p>
                </div>
                    ))}
            </div>
            <Grid container spacing={2} sx={{marginTop:"1px"}}>
              <Grid item xs={6} sx={{ height:200 }}>
                <div class="table-row" className='salary-box'>
                    <p>الراتب الاساسي</p>
                    <p>{employee?.salary}</p>
                    <p>Basic Salary</p>
                </div>
                <div class="table-row" className='salary-box'>
                    <p>الساعات الاضافية</p>
                    <p>{bonusFinance.reduce((prev,cur)=>prev+=cur.bonusHours,0)}</p>
                    <p>Over time</p>
                </div>
                <div class="table-row" className='salary-box'>
                    <p>الخصومات</p>
                    <p>{discountFinance.reduce((prev,cur)=>prev+=cur.amount,0)}</p>
                    <p>Discount</p>
                </div>
                <div class="table-row" className='salary-box'>
                    <p>الأضافات</p>
                    <p>{bonusFinance.reduce((prev,cur)=>prev+=cur.amount,0)}</p>
                    <p>Bonus</p>
                </div>
                <div class="table-row" className='salary-box'>
                    <p>صافي الراتب</p>
                    <p>{calcRemainSalary(employee?._id,employee?.salary)}</p>
                    <p>net salary</p>
                </div>
              </Grid>
              <Grid item xs={6}>
                <Box border={1} width={"100%"} height={200}>

                </Box>
              </Grid>
            </Grid>
            <Grid container sx={{textAlign:"center"}}>
                <Grid item xs={4}>
                      <p>المستلم  Reciver</p>
                      <p>..............</p>
                </Grid>
                <Grid item xs={4}>
                  <p>حرر بتاريخ</p>
                  <p>{format(new Date(),"dd/MM/yyyy")}</p>
                </Grid>
                <Grid item xs={4}>
                      <p>المحاسب  Acountant</p>
                      <p>..............</p>
                </Grid>
            </Grid>
            {/* <p> اتعهد انا {data?.client?.name} أن أكون متواجدا ز مسئولا عن المسبح و عن مرتاديه و مرتدياته خلال فترة الايجار خالي المسئولية عن ما يترتب على ذلك و على ذلك اوقع     التوقيع :</p> */}
      </div>
    </div>
    {/* </div>
    :<h3 style={{textAlign:"center"}}>Sorry, this page not available</h3> */}
  {/* } */}
  <AddEmployeeFinance open={open} handleClose={handleClose}/>

    </>
  )
}

export default EmployeeMonthDetails;
 