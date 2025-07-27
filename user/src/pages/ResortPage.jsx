import React from 'react'
import Resorts from './Resorts'
import { useTranslation } from 'react-i18next';
const ResortPage = () => {
  const { t, i18n } = useTranslation();
  return (
    <div>
        <h2 className='m-5 ' style={{textAlign:i18n.language==="en"?"left":"right"}}>{t("resortOffer")}</h2>
        <Resorts/>
    </div>
  )
}

export default ResortPage;