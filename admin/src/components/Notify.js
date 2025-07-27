import { ToastContainer, toast } from 'react-toastify';

export const notifySuccess=(msg)=>{
    toast.success(msg, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        // Add additional style customization here
        className: 'toast-success',
      });
}
export const notifyInfo = (msg) => {
  toast.info(msg, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
      className: 'toast-info',
  });
};
export const notifyError=(msg)=>{
    toast.error(msg, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        // Add additional style customization here
        className: 'toast-error',
      });
}