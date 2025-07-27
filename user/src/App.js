// F:\ractprojects\New folder (2)\ggg\user\src\App.js
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // تأكد أن هذا الملف مستورد

// Import Redux thunks for initial data fetching
import { fetchUserData } from './redux/reducers/user';

// Import components and pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TermsConditions from './pages/TermsConditions';
import Halls from './pages/Halls';
import Chalets from './pages/Chalets';
import ChaletCard from './pages/ChaletCard';
import HallCard from "./pages/HallCard";
import Reservations from "./pages/Reservations";
import UserSetting from "./pages/UserSetting";
import HallPage from "./pages/HallPage";
import ChaletPage from "./pages/ChaletPage";

// ✨ استيراد الصفحات الجديدة
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected Route Component
function PrivateRoute({ children }) {
    const isAuthenticated = useSelector(state => state.user.isAuthenticated);
    const userStatus = useSelector(state => state.user.status);

    if (userStatus === 'loading') {
        return <div>Loading...</div>; // يمكنك استبدال هذا بمكون تحميل جذاب
    }

    return isAuthenticated ? children : <Navigate to="/user/signin" />;
}

function App() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(state => state.user.isAuthenticated);
    // يمكنك جلب اللغة هنا إذا كنت تستخدم i18n في App.js أيضاً
    // const { i18n } = useTranslation();

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserData());
        }
    }, [dispatch, isAuthenticated]);

    return (
        <div className="App">
            {/* تم تحديث ToastContainer لاستخدام theme="dark" و RTL ديناميكيًا */}
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                // rtl={i18n.language === 'ar'} // لو حبيت تخلي الـ RTL ديناميكي هنا كمان
                rtl={true} // أو تركه true إذا كان تطبيقك عربي بشكل أساسي
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark" // ✨ هذا مهم لتغيير الثيم للداكن
            />

            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />}>
                    <Route path="halls" element={<Halls />} />
                    <Route path="chalets" element={<Chalets />} />
                </Route>

                {/* ✨ مسارات الصفحات الجديدة التي يتم التعامل معها في App.js */}
                <Route path="/user/verify-email" element={<EmailVerification />} />
                <Route path="/user/forgot-password" element={<ForgotPassword />} />
                <Route path="/user/reset-password/:token" element={<ResetPassword />} />


                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/chaletCard/:id" element={<ChaletCard />} />
                <Route path="/hallCard/:id" element={<HallCard />} />
                <Route path="/chalet/page" element={<ChaletPage />} />
                <Route path="/hall/page" element={<HallPage />} />
                <Route path="/termsAndCondition" element={<TermsConditions />} />

                <Route path="/reservations" element={<PrivateRoute><Reservations /></PrivateRoute>} />
                <Route path="/user/setting" element={<PrivateRoute><UserSetting /></PrivateRoute>} />

                {/* هذا المسار الشامل (catch-all) سيتم التعامل معه بواسطة App.js بعد أن يتم التعامل مع المسارات المحددة في index.js */}
                {/* <Route path="*" element={<Navigate to="/" />} /> */}
            </Routes>
        </div>
    );
}

export default App;