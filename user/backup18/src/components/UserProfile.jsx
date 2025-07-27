import React, { useEffect } from 'react';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useSelector, useDispatch } from 'react-redux';
import userPlaceholder from "../assets/user.png";
import SettingsIcon from '@mui/icons-material/Settings';
import "../scss/Userprofile.scss";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { fetchUserData, logout } from '../redux/reducers/user';

const UserProfile = ({ open, close }) => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const imagesKey = process.env.REACT_APP_UPLOAD_URL;

    const userData = useSelector((state) => state.user.data);
    const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserData());
        }
    }, [dispatch, isAuthenticated]);

    const handleLogout = () => {
        dispatch(logout());
        close();
        navigate('/user/signin');
    };

    function handleSetting() {
        close();
        navigate('/user/setting');
    }

    return (
        <div className={`user-profile-modal ${open ? 'show' : ''} ${i18n.language === 'en' ? 'ltr' : 'rtl'}`}>
            <div className="profile-content">
                <div className="profile-header">
                    <h2 className="profile-title">{t("profile.profile")}</h2>
                    <button type='button' onClick={close} className='close-profile-btn' aria-label="Close profile">
                        <HighlightOffIcon />
                    </button>
                </div>

                {isAuthenticated && userData && Object.keys(userData).length > 0 ? (
                    <>
                        <div className="profile-info-section">
                            {userData.image ? (
                                <img 
                                    src={imagesKey + userData.image} 
                                    alt="Profile" 
                                    className="profile-image" 
                                    loading="lazy"
                                />
                            ) : (
                                <img 
                                    src={userPlaceholder} 
                                    alt="User Placeholder" 
                                    className="profile-image" 
                                    loading="lazy"
                                />
                            )}
                            <div className="user-details-text">
                                <p className='username'>{userData.name}</p>
                                <p className='user-contact-phone'>{userData.phone}</p>
                            </div>
                        </div>
                        <button className="profile-setting-button" onClick={handleSetting} aria-label="Settings">
                            <div className="setting-text-container">
                                <h5 className="setting-main-text">{t("profile.myProfile")}</h5>
                                <p className="setting-sub-text">{t("profile.setting")}</p>
                            </div>
                            <SettingsIcon className="setting-icon" />
                        </button>
                    </>
                ) : (
                    <div className="profile-info-message">
                        <p>{t("profile.notLoggedIn")}</p>
                    </div>
                )}

                <div className="profile-actions-section">
                    {isAuthenticated ? (
                        <button 
                            onClick={handleLogout} 
                            className="profile-action-button logout-button"
                            aria-label="Logout"
                        >
                            {t("profile.logout")}
                        </button>
                    ) : (
                        <button 
                            onClick={() => { close(); navigate('/user/signin'); }} 
                            className="profile-action-button login-button"
                            aria-label="Login"
                        >
                            {t("profile.login")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;