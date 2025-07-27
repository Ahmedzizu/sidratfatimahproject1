// F:\ractprojects\New folder (2)\ggg\user\src\components\Navbar.jsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserData } from "../redux/reducers/user";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import "../scss/navbar.scss"; // تأكد من استيراد ملف SCSS الجديد
import userPlaceholder from "../assets/user.png";
import logo from "../assets/Logo 1.png";
import UserProfile from './UserProfile';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Arabic from "../assets/suadia.png";
import English from "../assets/en.jpg";
import { useTranslation } from 'react-i18next';

function NavbarComp() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [expanded, setExpanded] = useState(false); // حالة قائمة النافبار الموسعة

    const imagesKey = process.env.REACT_APP_UPLOAD_URL;
    const { t, i18n } = useTranslation();
    const userData = useSelector((state) => state.user.data);
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated && !userData) {
            dispatch(fetchUserData());
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [dispatch, isAuthenticated, userData]);

    const handleProfileClick = () => {
        if (isAuthenticated) {
            setOpen(prev => !prev);
        } else {
            navigate('/user/signin');
        }
    };

    const handleNavLinkClick = () => {
        setExpanded(false); // إغلاق القائمة
    };

    const isActive = (path) => {
        return location.pathname === path ||
               (path === '/home' && (location.pathname === '/home/halls' || location.pathname === '/home/chalets'));
    };

    // مكون مساعد لأيقونات المستخدم واللغة (لإعادة الاستخدام في وضعي سطح المكتب والجوال)
    const UserAndLanguageIcons = ({ mobile = false }) => (
        <div className={mobile ? "mobile-user-section" : "desktop-user-section"}>
            <div className="language-switcher">
                {i18n.language === 'ar' ? (
                    <button className='language-btn' onClick={() => i18n.changeLanguage('en')} aria-label={t("navbar.changeLanguageToEnglish")}>
                        <div className="language-img-container"><img src={Arabic} alt={t("navbar.arabic")} /></div>
                        {!mobile && <span className="language-label">{t("navbar.arabic")}</span>}
                    </button>
                ) : (
                    <button className='language-btn' onClick={() => i18n.changeLanguage('ar')} aria-label={t("navbar.changeLanguageToArabic")}>
                        <div className="language-img-container"><img src={English} alt={t("navbar.english")} /></div>
                        {!mobile && <span className="language-label">{t("navbar.english")}</span>}
                    </button>
                )}
            </div>
            <div className="user-profile-icon-wrapper" onClick={handleProfileClick} aria-label={t("profile.profile")}>
                {isAuthenticated && userData && userData.image ? (
                    <img src={imagesKey + userData.image} alt="Profile" className="profile-img" />
                ) : (
                    <img src={userPlaceholder} alt="User Placeholder" className="profile-img" />
                )}
                <div className="user-info">
                    <p className="username">{isAuthenticated && userData ? userData.name : t("navbar.visitor")}</p>
                    {!mobile && <p className="user-status">{t("navbar.subtitle")}</p>}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Navbar expand="lg" expanded={expanded} onToggle={setExpanded} className={`navBar ${scrolled ? 'scrolled' : ''}`}>
                <Container className='navbar-container'>
                    <Link to="/" className="logo-container" onClick={() => setExpanded(false)}>
                        <div className="logo-img-wrapper">
                            <img src={logo} alt="logo" className="logo-img" />
                        </div>
                        <p className="logo-text">{t("navbar.badge")}</p>
                    </Link>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggle">
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </Navbar.Toggle>

                    <Navbar.Collapse id="basic-navbar-nav" className='navbar-collapse'>
                        {/* قسم المستخدم واللغة في وضع الجوال يظهر دائمًا في القائمة */}
                        <UserAndLanguageIcons mobile />
                        
                        <Nav className="nav-links">
                            <Nav.Link 
                                as={Link} 
                                to="/home" 
                                className={`nav-item ${isActive('/home') ? 'active' : ''}`} 
                                onClick={handleNavLinkClick}
                            >
                                {t("navbar.main")}
                            </Nav.Link>
                            
                            <Nav.Link 
                                as={Link} 
                                to='/reservations' 
                                className={`nav-item ${isActive('/reservations') ? 'active' : ''}`} 
                                onClick={handleNavLinkClick}
                            >
                                {t("navbar.reservation")}
                            </Nav.Link>
                            
                            <NavDropdown 
                                className={`nav-item nav-dropdown ${location.pathname.includes('/chalet/page') || 
                                    location.pathname.includes('/hall/page') ? 'active' : ''}`} 
                                title={t("navbar.offers")} 
                                id="offers-dropdown"
                            >
                                <NavDropdown.Item 
                                    as={Link} 
                                    to="/chalet/page" 
                                    className={location.pathname.includes('/chalet/page') ? 'active-dropdown-item' : ''}
                                    onClick={handleNavLinkClick}
                                >
                                    {t("navbar.chalet")}
                                </NavDropdown.Item>
                                <NavDropdown.Item 
                                    as={Link} 
                                    to="/hall/page" 
                                    className={location.pathname.includes('/hall/page') ? 'active-dropdown-item' : ''}
                                    onClick={handleNavLinkClick}
                                >
                                    {t("navbar.hall")}
                                </NavDropdown.Item>
                            </NavDropdown>
                            
                            <Nav.Link 
                                as={Link} 
                                to='/termsAndCondition' 
                                className={`nav-item ${isActive('/termsAndCondition') ? 'active' : ''}`} 
                                onClick={handleNavLinkClick}
                            >
                                {t("navbar.terms")}
                            </Nav.Link>
                        </Nav>
                    </Navbar.Collapse>

                    {/* قسم المستخدم واللغة في وضع سطح المكتب (مخفي في وضع الجوال) */}
                    <UserAndLanguageIcons />
                </Container>
            </Navbar>
            
            <UserProfile open={open} close={() => setOpen(false)} />
        </>
    );
}

export default NavbarComp;