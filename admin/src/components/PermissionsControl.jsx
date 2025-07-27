import React from 'react'
import { useSelector } from 'react-redux'

const PermissionsControl = ({ children, role }) => {
    const user = useSelector((state) => state.employee.value.user)
    console.log(user?.permissions);

    return (
        <>
            {/* تعليق الشرط بالكامل */}
            {/* {user.admin || (user?.permissions && user.permissions[role]) ? children : <h3 style={{ textAlign: "center" }}>Sorry, this page not available</h3>} */}

            {/* إذا كنت تريد فقط إظهار `children` بدون شرط الصلاحيات */}
            {children}
        </>
    )
}

export default PermissionsControl
