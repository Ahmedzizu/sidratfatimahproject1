// src/components/SalarySummaryTable.jsx
import React, { forwardRef } from 'react';

const SalarySummaryTable = forwardRef(({ salaries, month, year }, ref) => {
  const total = salaries.reduce((acc, item) => acc + item.netSalary, 0);

  return (
    <div ref={ref} style={{ padding: '20px', direction: 'rtl', fontFamily: 'Arial' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <strong>مسير رواتب لشهر {month} / {year}</strong>
      </div>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>رقم</th>
            <th>اسم العامل</th>
            <th>الراتب الأساسي</th>
            <th>ساعات الإضافي</th>
            <th>الإضافي</th> {/* ✅ العمود الجديد */}
            <th>الحسميات</th>
            <th>عدد أيام غياب</th>
            <th>صافي الراتب</th>
            <th>التوقيع بالإستلام</th>
          </tr>
        </thead>
        <tbody>
          {salaries.map((emp, idx) => (
            <tr key={emp._id}>
              <td>{idx + 1}</td>
              <td>{emp.name}</td>
              <td>{emp.salary}</td>
              <td>{emp.bonusHours}</td>
              <td>{emp.bonus}</td> {/* ✅ الإضافي هو bonus = ساعات * السعر */}
              <td>{emp.deduction || 0}</td>
              <td>{emp.absenceDays}</td>
              <td>{emp.netSalary}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="7" style={{ textAlign: 'center', fontWeight: 'bold' }}>
              المجموع الكلي
            </td>
            <td colSpan="2" style={{ fontWeight: 'bold' }}>{total} ريال</td>
          </tr>
        </tfoot>
      </table>
      <div style={{ marginTop: '10px', fontSize: '12px', textAlign: 'left' }}>
        {new Date().toLocaleDateString('ar-EG')}
      </div>
    </div>
  );
});

export default SalarySummaryTable;
