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
import { fetchEmploees, fetchEmployeeAbsence } from '../redux/reducers/employee';
function PaperComponent(props) {
    return (
      <Paper {...props} />
  );
}
export default function DeleteDialoge({open ,handleClose,url,id}) {
    const dispatch=useDispatch()
    function handleDelete(){
        handleClose()
        Api.delete(url+id)
        .then((res)=>{
          dispatch(fetchReservations())
          dispatch(fetchEmploees())
          dispatch(fetchEmployeeAbsence())
        })
        .catch((err)=>console.log(err.response.data))
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
                هل انت متأكد من حذف هذا ؟
        </DialogTitle>
        <DialogActions style={{justifyContent:"space-around"}}>
          <Button onClick={handleDelete} variant='contained' color='error'>حذف</Button>
          <Button autoFocus onClick={handleClose} variant='outlined'  id='cancel'  >
            الغاء
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}