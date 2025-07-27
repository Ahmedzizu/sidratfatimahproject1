import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import Api from '../config/config';
import { fetchReservations } from '../redux/reducers/reservation';
import { useDispatch } from 'react-redux';

// import Draggable from 'react-draggable';
function PaperComponent(props) {
    return (
      <Paper {...props} />
  );
}
export default function InsuranceDialoge({open ,handleClose,id}) {
    const dispatch=useDispatch()
    const handleSubmit=()=>{
        Api.patch('/admin/insurance',{id})
        .then(()=>{
            dispatch(fetchReservations())
            handleClose()
        })
        .catch((err)=>console.log(err.message))
      }

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move', }} id="draggable-dialog-title" >
                هل انت متأكد من ارجاع هذا المبلغ؟
        </DialogTitle>
        <DialogActions style={{justifyContent:"space-around"}}>
          <Button onClick={handleSubmit} variant='contained' color='success'>تأكيد</Button>
          <Button autoFocus onClick={handleClose} variant='outlined' color='error'  id='cancel'  > الغاء</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}