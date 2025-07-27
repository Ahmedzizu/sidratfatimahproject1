import React, { useEffect, useState } from 'react';
import { Grid, Pagination, Card, CardContent, CardMedia, Typography, CardActionArea } from '@mui/material';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResort, getResortCard } from '../redux/reducers/resort';
import { useTranslation } from 'react-i18next';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import "../scss/halls.scss";

const Resorts = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const allResorts = useSelector((state) => state.resort.data);

  const [resorts, setResorts] = useState([]);
  const [page, setPage] = useState(1);
  const resortsPerPage = 9;
  const totalResorts = resorts.length;
  const totalPages = Math.ceil(totalResorts / resortsPerPage);
  const startIndex = (page - 1) * resortsPerPage;
  const displayedResorts = resorts.slice(startIndex, startIndex + resortsPerPage);
  
  const imagesKey = process.env.REACT_APP_UPLOAD_URL || "http://localhost:5000/uploads";

  useEffect(() => {
    dispatch(fetchResort());
  }, [dispatch]);

  useEffect(() => {
    if (allResorts && Array.isArray(allResorts)) {
      setResorts(allResorts);
    }
  }, [allResorts]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  function calcRate(arr) {
    if (arr && arr.length > 0) {
      let sum = arr.reduce((prev, curr) => prev + curr, 0);
      return parseFloat(sum / arr.length).toFixed(1);
    } else return 0;
  }

  let filteredResorts = displayedResorts;

  return (
    <>
      <Grid container spacing={2} className="hall">
        {
          filteredResorts.length > 0 ? (
            filteredResorts.map((ele, ind) => (
              <Grid key={ind} item xs={12} md={6} lg={4}>
                <Link to={`/resortCard/${ele._id}`} style={{ textDecoration: "none", color: "inherit" }} onClick={() => dispatch(getResortCard(ele._id))}>
                  <Card sx={{ maxWidth: 400, position: "relative" }}>
                    <CardActionArea component="div">
                      {ele.maintenance && (
                        <div className="maintenance-badge">
                          <BuildCircleIcon />
                          <span>{t("cards.maintenance")}</span>
                        </div>
                      )}
                      <CardMedia component="img" height="180" image={`${imagesKey}${ele.images?.[0] || "/placeholder.jpg"}`} alt={ele.name || t("cards.resort")} />
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="div" style={{ display: "flex", justifyContent: "space-between", flexDirection: "row-reverse" }}>
                          {ele.name}
                          <div className="rate">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} style={{ color: ele.rate && ele.rate.length > i ? "#FAD721" : "gray" }} />
                            ))}
                            <span style={{ fontSize: ".8rem", textAlign: "center", marginTop: "5px" }}>
                              {t("cards.rate")} {ele.rate?.length || 0}
                            </span>
                          </div>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" style={{ display: "flex", justifyContent: "space-between" }}>
                          <div className="price-box">
                            <p style={{ fontSize: i18n.language === 'en' ? "1.1rem" : "1.3rem" }}>
                              <span className='price'>{t("cards.sar")} {ele?.price?.wholeDay || "N/A"}</span> / {t("cards.day")}</p>
                          </div>
                          <div className="data">
                            <p>{t("cards.pools")} {ele.pool || "N/A"}<LocationOnIcon className='icon' /></p>
                            <p>{t("cards.area")} {ele.area || "N/A"}{i18n.language === 'en' ? 'M' : "م"}<DashboardIcon className='icon' /></p>
                          </div>
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <Typography variant="h6" style={{ textAlign: "center", width: "100%", marginTop: "20px" }}>
              {t("cards.noResortsAvailable")}
            </Typography>
          )}
        </Grid>
      <Pagination count={totalPages} page={page} onChange={handlePageChange} className='pagination' />
    </>
  );
};

export default Resorts;