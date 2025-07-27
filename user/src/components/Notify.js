import { toast } from 'react-toastify';
// No need to import ToastContainer here, it should be imported and rendered once in App.js

export const notifySuccess = (msg) => {
    toast.success(msg, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        rtl: true, // For RTL languages
    });
}

export const notifyInfo = (msg) => {
    toast.info(msg, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        rtl: true,
    });
};

export const notifyError = (msg) => {
    toast.error(msg, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        rtl: true,
    });
}