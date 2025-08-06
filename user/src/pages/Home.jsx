import React, { useState, useEffect } from 'react';
import "../scss/home.scss";
import { Button, TextField } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import Nav from 'react-bootstrap/Nav';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import SearchModal from '../components/SearchModal';
import { fetchHalls } from '../redux/reducers/hall';
import { fetchChalets, setSearch } from '../redux/reducers/chalet';

const Home = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const [open, setOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const searchTermQuery = useSelector((state) => state.chalet.searchTerm.query || '');

    useEffect(() => {
        dispatch(fetchHalls());
        dispatch(fetchChalets());

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch]);

    useEffect(() => {
        if (location.pathname === '/home' ||
            (location.pathname !== '/home/halls' && location.pathname !== '/home/chalets' && location.pathname !== '/home/resorts')) {
            navigate('/home/halls', { replace: true });
        }
    }, [location.pathname, navigate]);

    const allHallsFromRedux = useSelector((state) => state.hall.filteredData);
    const allChaletsFromRedux = useSelector((state) => state.chalet.filteredData);

    const handleClose = () => setOpen(false);
    const handleSearchClick = () => setOpen(true);

    const handleRegularSearchChange = (e) => {
        dispatch(setSearch({ query: e.target.value }));
    };

    const getActiveKey = () => {
        if (location.pathname.includes('/home/chalets')) return 'link-chalets';
        if (location.pathname.includes('/home/halls')) return 'link-halls';
        if (location.pathname.includes('/home/resorts')) return 'link-resorts';
        return 'link-halls';
    };

    return (
        <div className={`home-page ${isScrolled ? 'scrolled' : ''}`} dir={i18n.language === 'en' ? 'ltr' : 'rtl'}>
            {/* الخلفية المتحركة والفقاعات */}
            <div className="animated-background-container">
                <div className="animated-bubble bubble-1"></div>
                <div className="animated-bubble bubble-2"></div>
                <div className="animated-bubble bubble-3"></div>
                <div className="animated-bubble bubble-4"></div>
                <div className="animated-bubble bubble-5"></div>
            </div>

            {/* Hero Section */}
            <div className='hero-section'>
                <div className="hero-content">
                    <h1 className="hero-title">{t("main.title")}</h1>
                    <p className="hero-subtitle">{t("main.subtitle")}</p>
                    
                    <div className="search-bar-hero">
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={t("main.search")}
                            value={searchTermQuery}
                            onChange={handleRegularSearchChange}
                            className="hero-search-input"
                            InputProps={{
                                startAdornment: (
                                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                                ),
                            }}
                        />
                        <Button
                            variant='contained'
                            onClick={handleSearchClick}
                            className='detailed-search-btn'
                        >
                            {t("main.detailedSearch")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-content-container">
                <div className="main-content-area">
                    <div className="tabs-container">
                        <Nav variant="pills" activeKey={getActiveKey()} className="main-nav-tabs">
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
        </div>
    );
};

export default Home;