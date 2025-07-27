import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";

const DeleteDialoge = ({ open, handleClose, handleDelete }) => {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
          هل أنت متأكد من رغبتك في حذف هذا الموظف؟ لا يمكن التراجع عن هذه العملية.
</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">إلغاء</Button>
          <Button onClick={handleDelete} color="error" autoFocus>حذف</Button> {/* ✅ هنا */}
        </DialogActions>
      </Dialog>
    );
  };
  
  export default DeleteDialoge;
  
  
  
