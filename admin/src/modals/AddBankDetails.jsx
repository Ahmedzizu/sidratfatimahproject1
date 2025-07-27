import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import "../scss/addChalets.scss"
import { Grid, InputLabel } from '@mui/material';
import { TextField } from '@mui/material';
import Api from './../config/config';
import { useTranslation } from 'react-i18next';
import { fetchChalets } from './../redux/reducers/chalet';
import { useDispatch } from 'react-redux';
import { notifyError } from '../components/Notify';
import { fetchBankDetails } from '../redux/reducers/bank';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function AddBankDetails({ handleClose, update, data: data2, open }) {

    const [data, setData] = useState({
        name: '',
        id: "",
        account: ""
    })
    const [loading, setLoading] = useState(false)
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch()

    useEffect(() => {
        if (update) setData(data2)
        else setData({
            name: '',
            id: "",
            account: ""
        })
    }, [update])


    function handleSubmit(e) {
        e.preventDefault();
        setLoading(true)
        let url = update ? '/bank-details/update' : '/bank-details'
        Api.post(url, data).then(() => {
            dispatch(fetchBankDetails())
            setData({
                name: '',
                id: "",
                account: ""
            })
            handleClose()
        })
            .catch((err) => {
                console.log(err?.response);
                setLoading(false)
            })
    }

    return (
        <div>
            <Modal style={{ direction: i18n.language == 'en' ? 'ltr' : 'rtl' }} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
                <Box sx={style} className='model'>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ marginBottom: 1 }}>
                        {update ? t("Bank.edit") : t("Bank.add")}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <InputLabel htmlFor="chaletImg">{t("Bank.name")}</InputLabel>
                                <TextField fullWidth variant="outlined" required type="text" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <InputLabel htmlFor="chaletImg">{t("Bank.id")}</InputLabel>
                                <TextField fullWidth variant="outlined" required type="number" value={data.id} onChange={(e) => setData({ ...data, id: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <InputLabel htmlFor="chaletImg">{t("Bank.accountNo")}</InputLabel>
                                <TextField fullWidth variant="outlined" required type="text" value={data.account} onChange={(e) => setData({ ...data, account: e.target.value })} />
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant='contained' type='submit' fullWidth style={{ backgroundColor: "#B38D46", height: "50px", fontSize: "1rem" }}>{t("client.add")}</Button>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
export default AddBankDetails; 
