import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaFacebook, 
  FaInstagram, 
  FaTiktok,
  FaSnapchat,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaPhone,
  FaArrowUp
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../scss/footer.scss';

const Footer = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const scrollTopBtn = document.querySelector('.scroll-top');
    
    const handleScroll = () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSocialClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <footer className="footer">
      <div className="footer-wave"></div>
      
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section animate__animated animate__fadeInUp">
          <h3>{t("footer.aboutUs", "عن النظام")}</h3>
          <p>{t("footer.aboutText", "نظام متكامل لحجز القاعات والشاليهات والمنتجعات")}</p>
        </div>

        {/* Quick Links */}
        <div className="footer-section animate__animated animate__fadeInUp animate__delay-1s">
          <h3>{t("footer.quickLinks", "روابط سريعة")}</h3>
          <ul>
            {[
              { path: "/", text: t("footer.home", "الرئيسية") },
              { path: "/reservations", text: t("footer.reservations", "الحجوزات") },
              { path: "/chalet/page", text: t("footer.chalets", "الشاليهات") },
              { path: "/hall/page", text: t("footer.halls", "القاعات") },
              { path: "/termsAndCondition", text: t("footer.terms", "الشروط والأحكام") }
            ].map((link, index) => (
              <li key={index}>
                <Link 
                  to={link.path} 
                  className="footer-link"
                >
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section animate__animated animate__fadeInUp animate__delay-2s">
          <h3>{t("footer.contact", "تواصل معنا")}</h3>
          <div className="contact-methods">
            <div 
              className="contact-item"
              onClick={() => handleSocialClick('http://wa.me/966505966297')}
            >
              <FaWhatsapp className="contact-icon" />
              <span>+966 50 596 6297</span>
            </div>
            <div 
              className="contact-item"
              onClick={() => handleSocialClick('http://wa.me/966543993687')}
            >
              <FaPhone className="contact-icon" />
              <span>+966 54 399 3687</span>
            </div>
            <div 
              className="contact-item"
              onClick={() => handleSocialClick('https://maps.app.goo.gl/CrrB8LNXLBJofRbz8?g_st=ic')}
            >
              <FaMapMarkerAlt className="contact-icon" />
              <span>{t("footer.location", "موقعنا")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="social-icons">
          {[
            { icon: <FaFacebook />, url: 'https://www.facebook.com/Nizamko.Sy', label: 'Facebook' },
            { icon: <FaInstagram />, url: 'https://www.instagram.com/sidrat_fatimah?igsh=MW15ZnJsanZkazA2dw==', label: 'Instagram' },
            { icon: <FaTiktok />, url: 'https://www.tiktok.com/@sidrat_fatimah?_t=ZS-8xL586Z505I&_r=1', label: 'TikTok' },
            { icon: <FaSnapchat />, url: 'https://snapchat.com/t/DvLtr2pC', label: 'Snapchat' }
          ].map((social, index) => (
            <div 
              key={index}
              className="social-icon-container"
              onClick={() => handleSocialClick(social.url)}
              title={social.label}
            >
              <div className="social-icon-circle">
                {social.icon}
              </div>
            </div>
          ))}
        </div>

        <p 
          className="copyright"
          onClick={() => handleSocialClick('https://www.facebook.com/Nizamko.Sy')}
          title="Facebook Page"
        >
          © 2025 @ نظامكو | Nizamko
        </p>
      </div>

      {/* Scroll to Top Button */}
      <div 
        className="scroll-top"
        onClick={scrollToTop}
        title={t("footer.scrollToTop", "انتقل إلى الأعلى")}
      >
        <FaArrowUp className="scroll-icon" />
      </div>
    </footer>
  );
};

export default Footer;