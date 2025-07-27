import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "../scss/employee.scss"
import { useTranslation } from 'react-i18next';

const EmployeeNavigation = ({id}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate()
const handleNavigation= (route)=>{
    navigate(route)
    }
  return (
<div className="employee-navigate">
    <button onClick={()=>handleNavigation("/addEmployee")}  variant='contained' className={`btn ${id==1?"active":""}`}>{t("employee.employeeData")}</button>
    <button onClick={()=>handleNavigation("/employeeAbsense")} variant='contained' className={`btn ${id==2?"active":""}`}>{t("employee.employeeAbsence")}</button>
    <button onClick={()=>handleNavigation("/employeeSalaries")} variant='contained' className={`btn ${id==3?"active":""}`}>{t("employee.employeeSalaries")}</button>
</div>
  )
}

export default EmployeeNavigation