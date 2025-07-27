import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import "../scss/chaletCard.scss";
import area from "../assets/area.png";
import address from "../assets/address.png";
import rate from "../assets/rate.png";
import bed from "../assets/bed.png";
import living from "../assets/living.png";
import bath from "../assets/bath.png";
import kitchen from "../assets/kitchen.png";
import ReservationResort from '../components/ReservationResort.jsx';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PoolIcon from '@mui/icons-material/Pool';
import GamesIcon from '@mui/icons-material/Games';
import AliceCarousel from 'react-alice-carousel';
import { useTranslation } from 'react-i18next';
import 'react-alice-carousel/lib/alice-carousel.css';
import { Grid } from '@mui/material';
import Phone from '../components/Phone.jsx';
import { fetchResort } from '../redux/reducers/resort.js';
import Loading from '../components/Loading.jsx';
import ImageCarousel from "../components/ImageCarousel.jsx";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";

const responsive = {
  0: { items: 2 },
  568: { items: 2 },
  1024: { items: 4 }
};

const ResortCard = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const allResorts = useSelector((state) => state.resort.data);

  const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads";

  useEffect(() => {
    dispatch(fetchResort());
  }, [dispatch]);

  useEffect(() => {
    if (allResorts && allResorts.length > 0) {
      const resortData = allResorts.find((ele) => String(ele._id) === String(id));
      if (resortData) {
        setData(resortData);
        setLoading(false);
        console.log("📌 المنتجع المحدد بعد تحميل البيانات:", resortData);
      } else {
        console.warn("⚠️ المنتجع غير موجود!");
        setLoading(false);
      }
    } else if (allResorts && allResorts.length === 0) {
        setLoading(false);
        console.warn("⚠️ لا توجد منتجعات متاحة في Redux.");
    }
  }, [allResorts, id]);

  function calcRate() {
    if (!Array.isArray(data?.rate) || data.rate.length === 0) return "N/A";
    let total = data.rate.reduce((prev, curr) => prev + curr, 0);
    return (total / data.rate.length).toFixed(1);
  }

  return (
    <>
      {loading ? (
        <Loading open={loading} />
      ) : (
        <>
          <Container>
            <h2 style={{ textAlign: 'right' }} className="my-5">
              {data?.name}
              <Link to="/home/resort" style={{ color: "var(--dark)" }}>
                <ArrowForwardIcon />
              </Link>
            </h2>

            <ImageCarousel images={data?.images || []} imagesKey={imagesKey} />

            <div className="rooms my-4">
              <p>{t("details.resortArea")} {data.area} <img src={area} alt="" className='logo' /></p>
              <p>{t("cards.rate")} {calcRate()} <img src={rate} alt="" className='logo' /></p>
            </div>

            {data?.videos?.length > 0 && (
              <Grid container spacing={2} height={'70vh'} className='video-section mt-4 mb-4' style={{ marginBottom: "50px !important" }}>
                <Grid item xs={12} sm={12} lg={12} style={{ height: '70vh' }}>
                  {data?.videos?.[0] ? (
                    <video controls height='100%' width='100%'>
                      <source src={imagesKey + data.videos[0]} type='video/mp4' />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div>{t("details.noVideoSelected")}</div>
                  )}
                </Grid>
              </Grid>
            )}

            <div className="discription">
              <h3 className='title' style={{ textAlign: i18n.language === 'en' ? 'left' : "right" }}>{t("details.description")}</h3>
              <p className='subtitle' style={{ textAlign: i18n.language === 'en' ? 'left' : "right" }}>{t("details.resrotSubtitle")}</p>
              <div className="box">
                <p> {t("cards.pools")} {data.pool} <PoolIcon style={{ color: "var(--primary)", margin: "0 10px" }} /></p>
                <p> {t("details.kitchen")} {data.kitchen} <img src={kitchen} width='20px' height='20px' alt="" /></p>
                <p> {t("details.games")} {data.games} <GamesIcon style={{ color: "var(--primary)", margin: "0 10px" }} /></p>
              </div>
              {data.details &&
                <>
                  <p className='subtitle' style={{ textAlign: i18n.language === 'en' ? 'left' : "right" }}>{t("details.ResortsDetails")}</p>
                  <ul className="box2" >
                    {Array.isArray(data?.details) ? data?.details?.map((ele, idx) => (
                      <li key={idx}>{ele}</li>
                    )) : <li>{data?.details}</li>}
                  </ul>
                </>
              }
            </div>
          </Container>
          <Phone />
          <ReservationResort data={data} />
        </>
      )}
    </>
  );
};

export default ResortCard;