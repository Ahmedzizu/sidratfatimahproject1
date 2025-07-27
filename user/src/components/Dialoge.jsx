import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
// import Draggable from 'react-draggable';

function PaperComponent(props) {
  return (

      <Paper {...props} />
   
  );
}

export default function Dialoge({open , handleClose}) {
    const navigate=useNavigate()
  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move', }} id="draggable-dialog-title" >
          يجب عليك تسجيل الدخول لاستكمال الحجز
        </DialogTitle>
        <DialogActions >
          <Button autoFocus onClick={handleClose} variant='contained' id='cancel' style={{backgroundColor:'#dc3545 !important'}} >
            الغاء
          </Button>
          <Button onClick={()=>navigate('/user/signin')} variant='contained' >تسجيل الدخول</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}