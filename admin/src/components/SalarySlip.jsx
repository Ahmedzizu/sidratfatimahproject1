import React from 'react';
import logo from '../assets/Logo 1.png';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const SalarySlip = React.forwardRef(({ employee, salaryDetails, selectedMonth, selectedYear, absences, finance, paymentInfo }, ref) => {
  const { name, salary, nationalId = '---', position = '---' } = employee;
  const { bonusHours, bonus, deduction, absenceDays, netSalary } = salaryDetails;

  const monthIndex = new Date(`${selectedMonth} 1, ${selectedYear}`).getMonth();
  const year = parseInt(selectedYear);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const allAffectedDays = new Set();
  absences.filter(a => a.employee?._id === employee._id).forEach(a => { allAffectedDays.add(new Date(a.date).getDate()); });
  const bonusMap = {};
  const discountMap = {};
  const overtimeMap = {};
  finance.filter(f => f.employee?._id === employee._id).forEach(f => {
    const day = new Date(f.date).getDate();
    allAffectedDays.add(day);
    if (f.type === 'bonus') {
      bonusMap[day] = (bonusMap[day] || 0) + f.amount;
      overtimeMap[day] = (overtimeMap[day] || 0) + (f.bonusHours || 0);
    }
    if (f.type === 'discount') {
      discountMap[day] = (discountMap[day] || 0) + f.amount;
    }
  });
  const sortedAffectedDays = Array.from(allAffectedDays).sort((a, b) => a - b);

  // ✅ جديد: تاريخ الصرف الفعلي
  const actualPaidDate = paymentInfo?.salaryPaidAt ? format(new Date(paymentInfo.salaryPaidAt), 'yyyy/MM/dd', { locale: arSA }) : 'لم يتم الصرف';


  return (
    <div ref={ref} style={{ fontFamily: 'Arial', direction: 'rtl', padding: '20px', border: '1px solid #ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <img src={logo} alt="logo" style={{ height: 50 }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h4 style={{ margin: 0 }}>رواتب الموظفين</h4>
          <p style={{ fontSize: '12px', margin: '0' }}>
            كشف راتب عن شهر **{selectedMonth}** سنة **{selectedYear}**
          </p>
          <p style={{ fontSize: '12px' }}>التاريخ الحالي: {format(new Date(), 'yyyy/MM/dd')}</p>
        </div>
      </div>

      <table border="1" cellPadding="4" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px' }}>
        <thead>
          <tr>
            <th>الرقم الوظيفي</th>
            <th>اسم الموظف</th>
            <th>الوظيفة</th>
            <th>مكان العمل</th>
            <th>الجنسية</th>
            <th>رقم الهوية</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{employee.employeeId || '---'}</td>
            <td>{name}</td>
            <td>{position}</td>
            <td>المكتب</td>
            <td>{employee.nationality || '---'}</td>
            <td>{nationalId}</td>
          </tr>
        </tbody>
      </table>

      <table border="1" cellPadding="2" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>اليوم</th>
            <th>نوع الحركة</th>
            <th>القيمة/عدد الأيام/الساعات</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {sortedAffectedDays.length > 0 ? (
            sortedAffectedDays.map((day) => {
              const currentDate = new Date(year, monthIndex, day);
              const weekday = format(currentDate, 'EEEE', { locale: arSA });

              const isAbsent = absences.some(a => a.employee?._id === employee._id && new Date(a.date).getDate() === day);
              const hasBonus = bonusMap[day] || 0;
              const hasOvertime = overtimeMap[day] || 0;
              const hasDiscount = discountMap[day] || 0;

              const dailyEntries = [];

              if (isAbsent) {
                dailyEntries.push({ type: 'غياب', value: 1 });
              }
              if (hasBonus > 0) {
                dailyEntries.push({ type: 'مكافأة', value: hasBonus });
              }
              if (hasOvertime > 0) {
                dailyEntries.push({ type: 'وقت إضافي', value: hasOvertime });
              }
              if (hasDiscount > 0) {
                dailyEntries.push({ type: 'خصم', value: hasDiscount });
              }

              return dailyEntries.map((entry, index) => (
                <tr key={`${day}-${entry.type}-${index}`}>
                  {index === 0 && (
                    <>
                      <td rowSpan={dailyEntries.length}>{day}</td>
                      <td rowSpan={dailyEntries.length}>{weekday}</td>
                    </>
                  )}
                  <td>{entry.type}</td>
                  <td>{entry.value}</td>
                  <td></td>
                </tr>
              ));
            })
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>
                لا توجد حركات (غياب، مكافآت، خصومات) لهذا الموظف في هذا الشهر.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <div>
          <p>الراتب الأساسي: {salary} ريال</p>
          <p>ساعات الإضافي: {bonusHours}</p>
          <p>المكافآت: {bonus} ريال</p>
          <p>الخصومات: {deduction} ريال</p>
          <p><strong>صافي الراتب: {netSalary} ريال</strong></p>

          {/* ✅ تعديل وإضافة: عرض حالة الصرف، تاريخ الصرف، طريقة الصرف، واسم البنك */}
          {paymentInfo ? (
            <>
              <p>حالة الراتب: **تم الصرف**</p>
              <p>تاريخ الصرف: **{actualPaidDate}**</p> {/* جديد: تاريخ الصرف */}
              <p>طريقة الصرف: **{paymentInfo.billType}**</p>
              {paymentInfo.billType === 'تحويل بنكي' && paymentInfo.bankName && ( // ✅ الشرط ده المفروض يكون شغال دلوقتي
        <p>اسم البنك: **{paymentInfo.bankName}**</p>
              )}
            </>
          ) : (
            <p>حالة الراتب: **لم يتم الصرف بعد**</p>
          )}

        </div>
        <div style={{ textAlign: 'center' }}>
          <p>الموظف: {name}</p>
          <p>التاريخ: {format(new Date(), "yyyy/MM/dd")}</p>
          <p>التوقيع: ________________</p>
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span>المحاسب</span>
        <span>محرر الراتب</span>
        <span>الموظف</span>
      </div>
    </div>
  );
});

export default SalarySlip;