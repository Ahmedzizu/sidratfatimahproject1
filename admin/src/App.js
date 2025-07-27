import React, { useEffect, useState, lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import "./scss/app.scss";
import { Routes, Route } from "react-router-dom";
import AddChalet from "./pages/AddChalet";
import AddRessort from "./pages/AddRessort";
import AddHalls from "./pages/AddHalls";
import Dashboard from "./pages/Dashboard";
import DashboardVV from "./pages/DashboardVV";
import ReportDetails from "./pages/ReportDetails";
import AddEmployee from "./pages/AddEmployee";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChaletReservarions from "./pages/chaletReservarions";
import HallsReservations from "./pages/HallsReservations";
import CanceledReservations from "./pages/CanceledReservations";
import NewReservations from "./pages/NewReservations";
import UnPaidClients from "./pages/UnPaidClients";
import Paypal from "./pages/Paypal";
import OnlinePayment from "./pages/OnlinePayment";
import BankTransactions from "./pages/BankTransactions";
import InsurancesChalet from "./pages/InsurancesChalet";
import InsurancesHalls from "./pages/InsurancesHalls";
import InsurancesResorts from "./pages/InsurancesResorts";
import Reports from "./pages/Reports";
import Coupon from "./pages/coupon";
import Draws from "./pages/EmployeeTreasury";
import Expenses from "./pages/Expenses";
import Customers from "./pages/Customers";
import CancelRequest from "./pages/CancelRequest";
import Arabic from "./assets/suadia.png";
import Signin from "./pages/Signin";
import English from "./assets/en.jpg";
import { useTranslation } from "react-i18next";
import Loading from "./components/Loading";
import ReservationDetails from "./pages/ReservationDetails";
import Services from "./pages/Services";
import { fetchNotification } from "./redux/reducers/reservation";
import { fetchFreeServices } from "./redux/reducers/services";
import UnConfiremdReservationDetails from "./pages/HallsReservationsDetails";
// import Search from "./pages/Search";
import Search from "./pages/Search";
import Bookings from "./pages/BookingPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EmployeeAbsense from "./pages/EmployeeAbsense";
import EmployeeSalayries from "./pages/EmployeeSalayries";
import EmployeeMonthDetails from "./pages/EmployeeMonthDetails";
import BankDetails from "./pages/BankDetails";
import CashPayments from "./pages/CashPayments";
import { fetchUserData, setLog } from "./redux/reducers/employee"; // ✅ استيراد setLog
import Treasury from './pages/Treasury';
import Api from "./config/config";
import ShiftClosures from './pages/ShiftClosures';
import DrawersAdminPage from './pages/DrawersAdminPage'; 
function App() {
  const [loading, setLoading] = useState(false);
  let share = useSelector((state) => state.reservation.value.share);
  const dispath = useDispatch();
  
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(true);
  const dispatch = useDispatch();
  
  // ✅✅ هذا هو الـ useEffect المحسّن ✅✅
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      // إذا كان هناك توكن، حاول جلب بيانات المستخدم
      dispatch(fetchUserData())
        .unwrap() // .unwrap() تسمح لنا بالتعامل مع النجاح والفشل
        .then(() => {
          // نجح الطلب، قم بتحديث حالة تسجيل الدخول
          dispatch(setLog());
        })
        .catch(() => {
          // فشل الطلب (التوكن غير صالح)، قم بحذفه
          localStorage.removeItem("adminToken");
          localStorage.removeItem('shiftStart'); // ← أضف هذا

        });
    }

    // جلب البيانات الأخرى التي لا تعتمد على تسجيل الدخول
    dispatch(fetchNotification());
    dispatch(fetchFreeServices());

  }, [dispatch]); // يعمل مرة واحدة فقط عند تحميل التطبيق


  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  let logedin = useSelector((state) => state.employee.value.logedin);
  return (
    
    <>
      <ToastContainer />
      <div
        className="App"
        style={{
          marginRight: logedin ? (open && share ? "145px" : "10px") : "0",
          transition: ".3s",
        }}
      >
        {logedin && share && i18n.language == "ar" && (
          <button
            className="translation"
            onClick={() => i18n.changeLanguage("en")}
          >
            <img src={Arabic} alt="arabic" />
          </button>
        )}
        {i18n.language == "en" && (
          <button
            className="translation"
            onClick={() => i18n.changeLanguage("ar")}
          >
            <img src={English} alt="arabic" />
          </button>
        )}
        {logedin && share && (
          <Sidebar isOpen={open} toggle={() => setOpen(!open)} />
        )}
        <Routes>
         
          <Route path="/" element={logedin ? <Dashboard /> : <Signin />} />
          <Route path="/VV" element={logedin ? <DashboardVV /> : <Signin />} />
          <Route path="/report-details" element={logedin ? <ReportDetails /> : <Signin />} />
          <Route path="/booking" element={<Bookings />} />
          <Route
            path="/addRessort"
            element={logedin ? <AddRessort /> : <Signin />}
          />
          <Route
            path="/addChalet"
            element={logedin ? <AddChalet /> : <Signin />}
          />
          <Route
            path="/addHall"
            element={logedin ? <AddHalls /> : <Signin />}
          />
          <Route path="/reports" element={logedin ? <Reports /> : <Signin />} />
          <Route path="/coupon" element={logedin ? <Coupon /> : <Signin />} />
          <Route
            path="/addEmployee"
            element={logedin ? <AddEmployee /> : <Signin />}
          />
          <Route
            path="/insurances/chalet"
            element={logedin ? <InsurancesChalet /> : <Signin />}
          />
          <Route
            path="/insurances/hall"
            element={logedin ? <InsurancesHalls /> : <Signin />}
          />
          <Route
            path="/insurances/resort"
            element={logedin ? <InsurancesResorts /> : <Signin />}
          />
          <Route
            path="/HallsReservations"
            element={logedin ? <HallsReservations /> : <Signin />}
          />
          <Route
            path="/chaletReservarions"
            element={logedin ? <ChaletReservarions /> : <Signin />}
          />
          <Route
            path="/newReservations"
            element={logedin ? <NewReservations /> : <Signin />}
          />
            <Route
            path="/unPaidClients"
            element={logedin ? <UnPaidClients /> : <Signin />}
          />
          <Route
            path="/canceledReservations"
            element={logedin ? <CanceledReservations /> : <Signin />}
          />
          <Route path="/paypal" element={logedin ? <Paypal /> : <Signin />} />
          <Route
            path="/onlinePayment"
            element={logedin ? <OnlinePayment /> : <Signin />}
          />
          <Route
            path="/bankTransactions"
            element={logedin ? <BankTransactions /> : <Signin />}
          />
          <Route
            path="/cashPayments"
            element={logedin ? <CashPayments /> : <Signin />}
          />
          <Route
            path="/expenses"
            element={logedin ? <Expenses /> : <Signin />}
          />
          <Route path="/EmployeeTreasury" element={logedin ? <Draws /> : <Signin />} />
          <Route
            path="/cutomers"
            element={logedin ? <Customers /> : <Signin />}
          />
          <Route
            path="/employeeSalaries"
            element={logedin ? <EmployeeSalayries /> : <Signin />}
          />
          <Route
            path="/employeeAbsense"
            element={logedin ? <EmployeeAbsense /> : <Signin />}
          />
          <Route
            path="/cancelRequest"
            element={logedin ? <CancelRequest /> : <Signin />}
          />
          <Route
            path="/employeeMonthDetails/:id"
            element={logedin ? <EmployeeMonthDetails /> : <Signin />}
          />
          <Route path="/signin" element={<Signin />} />
          <Route
            path="/reservationDetails/:id"
            element={logedin ? <ReservationDetails /> : <Signin />}
          />
          <Route
            path="/unConfermidReservationDetails/:id"
            element={logedin ? <UnConfiremdReservationDetails /> : <Signin />}
          />
          <Route
            path="/services"
            element={logedin ? <Services /> : <Signin />}
          />
          <Route path="/search" element={logedin ? <Search /> : <Signin />} />
          <Route
            path="/bankDetails"
            element={logedin ? <BankDetails /> : <Signin />}
          />
          <Route path="/shift-closures" element={<ShiftClosures />} />
          
<Route path="/drawers-admin" element={<DrawersAdminPage />} />
          <Route path="*" element={logedin ? <Dashboard /> : <Signin />} />
<Route path="/treasury" element={logedin ? <Treasury /> : <Signin />} />        </Routes>
        <Loading open={loading} />
        
      </div>
    </>
  );
}

export default App;
