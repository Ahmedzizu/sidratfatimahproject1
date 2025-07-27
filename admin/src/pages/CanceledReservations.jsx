import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Api from "./../config/config";
import { fetchReservations } from "../redux/reducers/reservation";
import { useTranslation } from "react-i18next";
import "../scss/addChalets.scss";

const CanceledReservations = () => {
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const data = useSelector((state) => state.reservation.value.canceled);

  useEffect(() => {
    dispatch(fetchReservations());
  }, []);

  let filteredData = data;
  if (search)
    filteredData = filteredData.filter(
      (ele) =>
        ele.client.name.includes(search) ||
        ele.date.includes(search) ||
        ele.entity.name.includes(search) ||
        ele.date.includes(search)
    );

  return (
    <>
      <div
        className="cont"
        style={{ direction: i18n.language === "en" ? "ltr" : "rtl" }}
      >
        <h2>{t("reservation.canceled")}</h2>

        {/* ✅ تحسين صندوق البحث */}
        <div className="search-box">
          <TextField
            type="text"
            variant="outlined"
            value={search}
            placeholder={t("search")}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ marginLeft: "20px", borderRadius: "50px", width: "250px" }}
          />
        </div>

        {/* ✅ تحسين الجدول */}
        <TableContainer component={Paper} className="table-print">
          <Table aria-label="simple table">
            <TableHead className="tablehead">
              <TableRow>
                <TableCell align="center" className="table-row">
                  {t("reservation.contractNumber")}
                </TableCell>
                <TableCell align="center" className="table-row">
                  {t("reservation.client")}
                </TableCell>
                <TableCell align="center" className="table-row">
                  {t("reservation.entity")}
                </TableCell>
                <TableCell align="center" className="table-row">
                  {t("reservation.period")}
                </TableCell>
                <TableCell align="center" className="table-row">
                  {t("reservation.amount")}
                </TableCell>
                <TableCell align="center" className="table-row">
                  {t("date")}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((row, ind) => (
                <TableRow
                  key={ind}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="center">{row.contractNumber}</TableCell>
                  <TableCell align="center">{row.client.name}</TableCell>
                  <TableCell align="center">{row.entity.name}</TableCell>

                  <TableCell align="center">
                    {row.period.startDate !== row.period.endDate
                      ? `${row.period.startDate} / ${row.period.endDate}`
                      : `${row.period.startDate} / ${row.period.dayPeriod}`}
                  </TableCell>

                  <TableCell align="center">
                    {row.cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </TableCell>

                  <TableCell align="center">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
};

export default CanceledReservations;
