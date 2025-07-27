import React, { useState, useEffect } from 'react';
import "../scss/home.scss"; // تأكد من المسار الصحيح
import { Button, TextField } from "@mui/material"; // استيراد TextField
import SearchIcon from '@mui/icons-material/Search';
import Nav from 'react-bootstrap/Nav';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import SearchModal from '../components/SearchModal';
import { fetchHalls } from '../redux/reducers/hall';
import { fetchChalets, setSearch } from '../redux/reducers/chalet'; // تأكد من استيراد setSearch

const Home = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const [open, setOpen] = useState(false); // لحالة فتح/إغلاق SearchModal
    const [isScrolled, setIsScrolled] = useState(false); // لحالة التمرير في الصفحة

    // searchTerm.query هو حقل البحث النصي العام
    const searchTermQuery = useSelector((state) => state.chalet.searchTerm.query || '');

    useEffect(() => {
        dispatch(fetchHalls());
        dispatch(fetchChalets());

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50); // يتغير التصميم بعد 50px من التمرير
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch]);

    // إعادة التوجيه إلى /home/halls إذا كان المسار /home أو غير محدد
    useEffect(() => {
        if (location.pathname === '/home' ||
            (location.pathname !== '/home/halls' && location.pathname !== '/home/chalets' && location.pathname !== '/home/resorts')) {
            // أضفت /home/resorts إذا كان موجوداً
            navigate('/home/halls', { replace: true });
        }
    }, [location.pathname, navigate]);

    // هذه البيانات يتم فلترتها بالفعل بواسطة Redux reducer (chalet/hall slices)
    const allHallsFromRedux = useSelector((state) => state.hall.filteredData);
    const allChaletsFromRedux = useSelector((state) => state.chalet.filteredData);

    const handleClose = () => setOpen(false); // لإغلاق SearchModal
    const handleSearchClick = () => setOpen(true); // لفتح SearchModal

    // تحديث searchTerm.query في Redux store عند تغيير حقل البحث العادي
    const handleRegularSearchChange = (e) => {
        dispatch(setSearch({ query: e.target.value }));
    };

    // لتحديد التاب النشط في Nav.Link
    const getActiveKey = () => {
        if (location.pathname.includes('/home/chalets')) return 'link-chalets';
        if (location.pathname.includes('/home/halls')) return 'link-halls';
        if (location.pathname.includes('/home/resorts')) return 'link-resorts'; // إذا كان لديك منتجعات
        return 'link-halls';
    };

    return (
        <div className={`home-page ${isScrolled ? 'scrolled' : ''}`} dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
            {/* Hero Section */}
            <div className='hero-section'>
                <div className="hero-content">
                    <h1 className="hero-title">{t("main.title")}</h1>
                    <p className="hero-subtitle">{t("main.subtitle")}</p>
                    
                    {/* ✨ حقل البحث العام وزر البحث المفصل في الـ Hero Section */}
                    <div className="search-bar-hero">
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={t("main.search")} // استخدام مفتاح الترجمة للـ placeholder
                            value={searchTermQuery}
                            onChange={handleRegularSearchChange}
                            className="hero-search-input" // كلاس لتنسيق حقل البحث
                            InputProps={{
                                startAdornment: ( // أيقونة بحث داخل الحقل
                                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                ),
                            }}
                        />
                        <Button
                            variant='contained'
                            onClick={handleSearchClick}
                            className='detailed-search-btn' // كلاس لزر البحث المفصل
                        >
                            {t("main.detailedSearch")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content-container">
                <div className="main-content-area">
                    {/* ✨ الـ Tabs أصبحت داخل main-content-area */}
                    <div className="tabs-container">
                        <Nav variant="pills" activeKey={getActiveKey()} className="main-nav-tabs"> {/* كلاس جديد */}
                            <Nav.Item>
                                <Nav.Link
                                    as={Link}
                                    to="/home/halls"
                                    eventKey="link-halls"
                                    className="nav-tab"
                                >
                                    {t("cards.halls")}
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    as={Link}
                                    to="/home/chalets"
                                    eventKey="link-chalets"
                                    className="nav-tab"
                                >
                                    {t("cards.chalets")}
                                </Nav.Link>
                            </Nav.Item>
                            {/* يمكنك إضافة رابط المنتجات هنا إذا كان لديك */}
                            {/* <Nav.Item>
                                <Nav.Link
                                    as={Link}
                                    to="/home/resorts"
                                    eventKey="link-resorts"
                                    className="nav-tab"
                                >
                                    {t("cards.resorts")}
                                </Nav.Link>
                            </Nav.Item> */}
                        </Nav>
                    </div>
                </div>
            </div>

            {/* Content Wrapper */}
            <div className="content-wrapper">
                <Outlet context={{ halls: allHallsFromRedux, chalets: allChaletsFromRedux }} />
            </div>

            <Footer />
            <SearchModal open={open} handleClose={handleClose} />

            {/* Decorative Elements */}
            <div className="decorative-elements">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="golden-pattern"></div>
            </div>
        </div>
    );
};

export default Home;