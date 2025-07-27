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
export default function ConfirmDialoge({open ,handleClose,handleAccept,url,id}) {
    const dispatch=useDispatch()

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move', }} id="draggable-dialog-title" >
                هل انت متأكد من تأكيد هذا الحجز ؟
        </DialogTitle>
        <DialogActions style={{justifyContent:"space-around"}}>
          <Button onClick={handleAccept} variant='contained' color='success'>تأكيد</Button>
          <Button autoFocus onClick={handleClose} variant='outlined'  id='cancel'  > الغاء</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}