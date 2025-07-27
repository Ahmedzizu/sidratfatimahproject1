import React, { useEffect, useState } from "react";
import { TextField, Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import "../scss/addChalets.scss";
import { useDispatch, useSelector } from "react-redux";
import Api from "./../config/config";
import { fetchHall } from "./../redux/reducers/hall";
import AddHallModal from "./../modals/AddHallModal";
import { useTranslation } from "react-i18next";
import Switch from "@mui/material/Switch";


const AddHall = () => {
  const user = useSelector((state) => state.employee.value.user);
  const [model, setModel] = useState({ open: false, update: false, data: {} });
  const { t, i18n } = useTranslation();
  const handleClose = () => setModel({ open: false, update: false, data: {} });
  const dispatch = useDispatch();
  const data = useSelector((state) => state.hall.value.data);
  useEffect(() => {
    dispatch(fetchHall());
  }, []);

  const handleMaintenanceToggle = async (hallId, newStatus) => {
    try {
      await Api.put(`/admin/halls/${hallId}/maintenance`, { maintenance: newStatus }); // ✅ تغيير `PATCH` إلى `PUT`
      dispatch(fetchHall()); // ✅ تحديث البيانات بعد التعديل
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث حالة الصيانة:", error);
    }
  };

  

  function handleDelete(id) {
    Api.delete(`/admin/hall/delete/${id}`)
      .then((res) => dispatch(fetchHall()))
      .catch((err) => console.log(err.response.data));
  }
  return (
    <div
      className="cont"
      style={{ direction: i18n.language == "en" ? "ltr" : "rtl" }}
    >
      <h2>{t("entity.hall")}</h2>
      <div className="search-box">
        <TextField
          type="text"
          variant="outlined"
          placeholder="بحث"
          sx={{ marginLeft: "20px", borderRadius: "50px" }}
        />
        {
          //  (user.admin || (user.permissions&&user.permissions.addEntity))&&
          <Button
            onClick={() => {
              setModel({ open: true, update: false, data: {} });
            }}
            variant="contained"
            className="btn"
          >
            {t("entity.hall")}
          </Button>
        }
      </div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead className="tablehead">
            <TableRow>
              <TableCell align="center" className="table-row">
                {t("entity.name")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.hallsNumber")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.rooms")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.capacity")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.morningPrice")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.nightPrice")}
              </TableCell>
              <TableCell align="center" className="table-row">
                {t("entity.wholePrice")}
              </TableCell>
              {
                <TableCell align="center" className="table-row">
                  {t("entity.update")}
                </TableCell>
              }
              {
                // (user.admin || (user.permissions&&user.permissions.removeEntity))&&
                <TableCell align="center" className="table-row">
                  {t("entity.delete")}
                </TableCell>
              }
              <TableCell align="center"> {t("entity.maintenance")}</TableCell>{" "}
              {/* ✅ إضافة الكولوم الجديد */}
              
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, ind) => (
              <TableRow
                key={ind}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell align="center"> {row.name}</TableCell>
                <TableCell align="center">{row.halls}</TableCell>
                <TableCell align="center">{row.rooms}</TableCell>
                <TableCell align="center">{row.capacity}</TableCell>
                <TableCell align="center">{row?.price?.morning}</TableCell>
                <TableCell align="center">{row?.price?.night}</TableCell>
                <TableCell align="center">{row?.price?.wholeDay}</TableCell>
                {
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => {
                        setModel({ open: true, update: true, data: row });
                      }}
                    >
                      {t("entity.update")}
                    </Button>
                  </TableCell>
                }
                {
                  // (user.admin || (user.permissions&&user.permissions.removeEntity))&&
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(row._id)}
                    >
                      {t("entity.delete")}
                    </Button>
                  </TableCell>
                }
                <TableCell align="center">
                  {/* <Switch
                    checked={row.maintenance} // ✅ يعكس القيمة الحالية للصيانة
                    onChange={() =>
                      handleMaintenanceToggle(row._id, !row.maintenance)
                    }
                    color="primary"
                  /> */}


                              <Switch
                    checked={row.maintenance}
                    onChange={() => handleMaintenanceToggle(row._id, !row.maintenance)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#B38D46', // لون الدائرة لما يكون مفعّل
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#B38D46', // لون المسار لما يكون مفعّل
                        },
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#ccc', // لون المسار لما يكون غير مفعّل
                      },
                      '& .MuiSwitch-thumb': {
                        color: row.maintenance ? '#B38D46' : '', // لون السن حسب الحالة
                      },
                    }}
                  />
                  
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AddHallModal
        handleClose={handleClose}
        open={model.open}
        update={model.update}
        data={model.data}
      />
    </div>
  );
};

export default AddHall;
