import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Grid, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import { styled } from "@mui/material/styles"; // 🔥 استبدال makeStyles
import Api from "../config/config";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmploees } from "../redux/reducers/employee";
import { fetchHall } from "../redux/reducers/hall";
import { fetchResort } from "../redux/reducers/resort";
import { fetchChalets } from "../redux/reducers/chalet";
import { fetchReservations } from "../redux/reducers/reservation";
import format from "date-fns/format";
import { useTranslation } from "react-i18next";
import { fetchCustomer } from "../redux/reducers/customer";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const StyledSelect = styled(Select)({
  borderColor: "#000000",
  minWidth: "100px",
  borderWidth: "2px",
  borderRadius: "8px",
  "&:focus": {
    borderColor: "red",
  },
});

const HallsReservationsModal = ({ handleClose, open, data: temp, update }) => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({
    clientName: "",
    startDate: "2023-04-17",
    endDate: format(new Date(), "yyyy/MM/dd"),
    cost: "",
    entityId: "",
    entityName: "",
    id: "",
  });

  const dispatch = useDispatch();
  const [type, setType] = useState("hall");
  const [timeError, setTimeError] = useState("");
  const [nameError, setNameError] = useState("");

  const halls = useSelector((state) => state.hall.value.data);
  const resorts = useSelector((state) => state.resort.value.data);
  let users = useSelector((state) => state.customer.value.data);
  const chalets = useSelector((state) => state.chalet.value.data);
  let entitys = [...halls, ...resorts, ...chalets];

  useEffect(() => {
    dispatch(fetchChalets());
    dispatch(fetchHall());
    dispatch(fetchResort());
    dispatch(fetchCustomer());
  }, []);

  useEffect(() => {
    if (temp) {
      setData(temp);
      if (halls.some((ele) => ele._id === data.entityId)) setType("hall");
      else if (resorts.some((ele) => ele._id === data.entityId)) setType("resort");
      else if (chalets.some((ele) => ele._id === data.entityId)) setType("chalet");
      else setType("all");
    }
  }, [temp]);

  function handleSubmit(e) {
    e.preventDefault();
    if (new Date(data.startDate).getTime() > new Date(data.endDate).getTime())
      return setTimeError("يجب أن يكون تاريخ الوصول قبل تاريخ الانتهاء");

    let url = update ? "/admin/reservation/update" : "/admin/reservation";
    Api.post(url, data)
      .then(() => {
        dispatch(fetchReservations());
        setTimeError("");
        setData({
          name: "",
          startDate: new Date(),
          endDate: new Date(),
          cost: "",
          entityId: "",
          id: "",
        });
        handleClose();
        setNameError("");
      })
      .catch((err) => {
        if (err.response.status === 403) setNameError("هذا العميل لديه حجز بالفعل");
      });
  }

  const handleUserSelect = (id) => {
    let user = users.find((ele) => ele._id === id);
    setData({ ...data, clientId: id, clientName: user.name, phone: user.phone });
  };

  const handleEntitySelect = (id) => {
    let entity = entitys.find((ele) => ele._id === id);
    setData({ ...data, entityId: entity._id, entityName: entity.name });
  };

  return (
    <div>
      <Modal
        style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
      >
        <Box sx={style} className="model">
          <Typography id="modal-modal-title" variant="h6" sx={{ marginBottom: 5 }}>
            تعديل الحجز
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InputLabel>{t("reservation.client")}</InputLabel>
                <StyledSelect fullWidth value={data.clientId} required onChange={(e) => handleUserSelect(e.target.value)}>
                  {users.map((ele) => (
                    <MenuItem key={ele._id} value={ele._id}>
                      {ele.name}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </Grid>

              <Grid item xs={6}>
                <InputLabel>{t("reservation.period")}</InputLabel>
                <StyledSelect value={data.dayPeriod} defaultValue={data.period?.dayPeriod} required={type === "hall"} onChange={(e) => setData({ ...data, dayPeriod: e.target.value })} fullWidth>
                  <MenuItem value={"صباحية"}>{t("reservation.morning")}</MenuItem>
                  <MenuItem value={"مسائية"}>{t("reservation.night")}</MenuItem>
                  <MenuItem value={"كامل اليوم"}>{t("reservation.day")}</MenuItem>
                </StyledSelect>
              </Grid>

              <Grid item xs={6}>
                <InputLabel>{t("reservation.entity")}</InputLabel>
                <StyledSelect value={data.entityId} onChange={(e) => handleEntitySelect(e.target.value)} fullWidth>
                  {entitys.map((ele) => (
                    <MenuItem key={ele._id} value={ele._id}>
                      {ele.name}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </Grid>

              <Grid item xs={6}>
                <InputLabel>{t("reservation.amount")}</InputLabel>
                <TextField variant="outlined" fullWidth required type="number" value={data.cost} onChange={(e) => setData({ ...data, cost: e.target.value })} />
              </Grid>

              <Grid item xs={6}>
                <InputLabel>{t("reservation.arrive")}</InputLabel>
                <TextField variant="outlined" error={!!timeError} helperText={timeError} fullWidth required type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} />
              </Grid>

              <Grid item xs={6}>
                <InputLabel>{t("reservation.leave")}</InputLabel>
                <TextField variant="outlined" fullWidth required type="date" value={data.endDate} onChange={(e) => setData({ ...data, endDate: e.target.value })} />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" type="submit" fullWidth sx={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>
                  {t("reservation.add")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
            
      </Modal>
    
    </div>
  );
};

export default HallsReservationsModal;
