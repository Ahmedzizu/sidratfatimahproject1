import React, { useRef, useState } from 'react'
import logo from "../assets/Logo 1.png"
import "../scss/reset.scss";
import { format } from "date-fns"

const ReportsPrint = (props) => {
    console.log(props.start);
    return (
        <div className='border'>
            <div className="resert-container">
                <div className="reset-header">
                    <img src={logo} alt="logo" />
                    <div className="header-data">
                        <h5>للحفلات و المناسبات و الايجار اليومي</h5>
                        <p>الأحساء - الجبيل - طريق القرى</p>
                        <p>الحجوزات : 0505966297 - 0579500033</p>
                        <p>الادارة : 0543993687</p>
                       {props.start && props.end && <p>{format(new Date(props.start), "yyyy-MM-dd")} / {format(new Date(props.end), "yyyy-MM-dd")}</p>}
                    </div>
                </div>
                {props.children}
            </div>
        </div>
    )
}

export default ReportsPrint