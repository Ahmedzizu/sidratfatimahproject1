import React ,{useEffect , useState ,useRef} from 'react';
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
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { notifyError } from '../components/Notify';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 900,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function AddChaletModal({handleClose,update,data:data2,open}) {    
 const [data,setData]=useState({
  name:'',
  file:'',
  area:"",
  address:"",
  sleeping:"",
  lounge:'',
  kitchen:'',
  bath:'',
  nightPrice:'',
  morningPrice:'',
  wholeDayPrice:'',
  details:[""],
  dayStartHour:"",
  dayEndHour:"",
  nightStartHour:"",
  nightEndHour:""
})
 const inputFile=useRef()
 const { t, i18n } = useTranslation();
 const apiUrl = process.env.REACT_APP_API_URL;
 const imagesKey = process.env.REACT_APP_UPLOAD_URL;

 const dispatch=useDispatch()
 const [loading,setLoading] =useState(false) 

useEffect(()=>{
  if(update) setData({...data2,nightPrice:data2?.price?.night,morningPrice:data2?.price?.morning,wholeDayPrice:data2?.price?.wholeDay})
  else setData({
name:'',
file:'',
rooms:'',
halls:'',
nightPrice:'',
morningPrice:'',
wholeDayPrice:'',
details:[""],
dayStartHour:"",
dayEndHour:"",
nightStartHour:"",
nightEndHour:""
})
},[update])


// function handleSubmit(e){
//   e.preventDefault();
//   setLoading(true)
//   let url = update? '/admin/chalet/update':'/admin/chalet'
//   Api.post(url, data,{
//     headers:{
//       'Content-Type': 'multipart/form-data',
//     } 
//    }).then(() => {
//       dispatch(fetchChalets())
//       setData({name:'',file:'',area:"",address:"",sleeping:"",lounge:'',kitchen:'',bath:'',nightPrice:'',morningPrice:'',wholeDayPrice:'',details:''})
//       setLoading(false)
//       handleClose()
//   })
//   .catch((err)=>{
//     console.log(err?.response);
//     setLoading(false)
// })
// }


function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const formData = new FormData();

  for (let key in data) {
    if (key === "file") {
      data.file?.forEach((img) => formData.append("file[]", img)); // ✅ اسم الحقل مثل الباك
    } else if (key === "videos") {
      data.videos?.forEach((vid) => formData.append("videos[]", vid)); // ✅ اسم الحقل مثل الباك
    } else if (key === "details") {
      data.details?.forEach((d) => formData.append("details", d)); // ✅ إرسال كل عنصر كمفتاح منفصل
    } else {
      formData.append(key, data[key]);
    }
  }

  let url = update ? '/admin/chalet/update' : '/admin/chalet';

  Api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })
    .then(() => {
      dispatch(fetchChalets());
      setData({
        name: '',
        file: '',
        videos: '',
        area: '',
        address: '',
        sleeping: '',
        lounge: '',
        kitchen: '',
        bath: '',
        nightPrice: '',
        morningPrice: '',
        wholeDayPrice: '',
        details: ['']
      });
      setLoading(false);
      handleClose();
    })
    .catch((err) => {
      console.log(err?.response);
      setLoading(false);
    });
}


function deleteImage(ind,type){
  if (type=="file"){
    let tempArr = data.file.slice()
    tempArr.splice(ind,1)
    setData({...data,file:tempArr})
  }else{
    let tempArr = data.images.slice()
    tempArr.splice(ind,1)
    setData({...data,images:tempArr})
}};
function renderImages(){
  if(data.file){
      return data?.file?.map((img,ind)=> (
        <div className='image-display'>
        <DeleteIcon style={{color:"red",cursor:"pointer"}} onClick={()=>deleteImage(ind,"file")} className='image-trash'/>
         <img src={URL.createObjectURL(img)} alt="hall" />
        </div>
        ))
  }else if (update){
    return data?.images?.map((img,ind)=> (
      <div className='image-display'>
         <DeleteIcon style={{color:"red",cursor:"pointer"}} onClick={()=>deleteImage(ind,"image")} className='image-trash'/>
         <img src={imagesKey+img} alt="hall" />
      </div>
      )) }
}

function deleteVideo(ind,type){
  if (type=="file"){
    let tempArr = data.file.slice()
    tempArr.splice(ind,1)
    setData({...data,file:tempArr})
  }else{
    let tempArr = data.videos.slice()
    tempArr.splice(ind,1)
    setData({...data,videos:tempArr,tempVideo:tempArr})
}}
function renderVideos() {
  if (data?.tempVideo?.length) {
    return data?.tempVideo?.map((video, ind) => (
      <div className='video-display' key={ind}>
        <DeleteIcon
          style={{ color: 'red', cursor: 'pointer' }}
          onClick={() => deleteVideo(ind)}
          className='video-trash'
        />
        <video  style={{height:"50px",width:"100px"}}>
          <source src={URL.createObjectURL(video)} type={video.type} />
          Your browser does not support the video tag.
        </video>
      </div>
    ));
  } else if (data?.videos?.length) {
    return data?.videos?.map((videoUrl, ind) => (
      <div className='video-display' key={ind}>
        <DeleteIcon
          style={{ color: 'red', cursor: 'pointer' }}
          onClick={() => deleteVideo(ind)}
          className='video-trash'
        />
        <video  style={{height:"50px",width:"100px"}}>
          <source src={imagesKey + videoUrl} type='video/mp4' />
          Your browser does not support the video tag.
        </video>
      </div>
    ));
  }
}
function uploadvideos(e) {
  const uploadedFiles = [];
  const files = e.target.files;
  if (files && files.length > 0) {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;
      if (!allowedTypes.includes(fileType)) {
        notifyError('Only video files (MP4, WEBM, MOV) are allowed.');
        e.target.value = '';
        return;
      }
      uploadedFiles.push(file);
    }
  }
  setData({ ...data, videos: uploadedFiles,tempVideo:uploadedFiles});
}
function uploadFiles(e) {
  const uploadedFiles = [];
  const files = e.target.files;

  if (files && files.length > 0) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;

      if (!allowedTypes.includes(fileType)) {
        notifyError('Only image files (JPEG, PNG, GIF) are allowed.');
        e.target.value = '';
        return;
      }
      uploadedFiles.push(file);
    }
  }
  setData({ ...data, file: uploadedFiles });
} 
function deleteDetails(ind){
  let temp = data.details.slice()
  temp.splice(ind,1)
  setData({...data,details:temp});
}

 return (
    <div>
      <Modal style={{direction:i18n.language=='en'?'ltr':'rtl'}} open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description" >
        <Box sx={style} className='model'>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{marginBottom:1}}>
            {update?t("entity.update") :t("entity.chalet")}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                  <InputLabel htmlFor="chaletImg">{t("entity.image")}</InputLabel>
                  <TextField ref={inputFile} fullWidth id='chaletImg' variant="outlined"  name="file" type="file"  InputProps={{inputProps: { multiple: true}}}  onChange={uploadFiles}/>
                </Grid>
                <Grid item xs={8}>
                  <div className='imgStack'>
                     {
                        renderImages()
                      }
                      </div>
                </Grid>
                <Grid item xs={4}>
                  <InputLabel htmlFor="chaletvideo">{t("entity.video")}</InputLabel>
                  <TextField ref={inputFile} fullWidth id='chaletvideo' variant="outlined" name="file" type="file"  InputProps={{inputProps: { multiple: true}}}  onChange={uploadvideos}/>
                </Grid>
                <Grid item xs={8}>
                  <div className='imgStack'>
                     {
                        renderVideos()
                      }
                      </div>
                </Grid>
                <Grid item xs={2}>
                   <InputLabel htmlFor="chaletImg">{t("entity.name")}</InputLabel>
                    <TextField variant="outlined" required type="text"  value={data.name} onChange={(e)=>setData({...data,name:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.area")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.area} onChange={(e)=>setData({...data,area:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                   <InputLabel htmlFor="chaletImg">{t("entity.bedroom")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.sleeping} onChange={(e)=>setData({...data,sleeping:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.lounge")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.lounge} onChange={(e)=>setData({...data,lounge:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.bathrooms")}</InputLabel>
                    <TextField variant="outlined" required type="number" value={data.bath} onChange={(e)=>setData({...data,bath:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                   <InputLabel htmlFor="chaletImg">{t("entity.kitchen")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.kitchen} onChange={(e)=>setData({...data,kitchen:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.morningPrice")}</InputLabel>
                    <TextField variant="outlined" required type="number" value={data.morningPrice} onChange={(e)=>setData({...data,morningPrice:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.nightPrice")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.nightPrice} onChange={(e)=>setData({...data,nightPrice:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.wholePrice")}</InputLabel>
                    <TextField variant="outlined" required type="number"  value={data.wholeDayPrice} onChange={(e)=>setData({...data,wholeDayPrice:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.dayStartHour")}</InputLabel>
                    <TextField variant="outlined" required type="text"  value={data.dayStartHour} onChange={(e)=>setData({...data,dayStartHour:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.dayEndHour")}</InputLabel>
                    <TextField variant="outlined" required type="text" value={data.dayEndHour} onChange={(e)=>setData({...data,dayEndHour:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.nightStartHour")}</InputLabel>
                    <TextField variant="outlined" required type="text"  value={data.nightStartHour} onChange={(e)=>setData({...data,nightStartHour:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                    <InputLabel htmlFor="chaletImg">{t("entity.nightEndHour")}</InputLabel>
                    <TextField variant="outlined" required type="text"  value={data.nightEndHour} onChange={(e)=>setData({...data,nightEndHour:e.target.value})}/>
                </Grid>
                <Grid item xs={2}>
                   <InputLabel htmlFor="chaletImg">{t("entity.address")}</InputLabel>
                    <TextField variant="outlined" required type="text"  value={data.address} onChange={(e)=>setData({...data,address:e.target.value})}/>
                </Grid>
                {data.details &&  data?.details?.map((ele,ind)=>(
                  <Grid item xs={2}>
                      <InputLabel style={{display:"flex",justifyContent:"space-between"}} >{(ind +1 )+ " - "+t("entity.details")} <DeleteIcon style={{color:"red",cursor:"pointer"}} onClick={()=>deleteDetails(ind)}/></InputLabel>
                      <TextField variant="outlined" fullWidth type="text"
                        value={data.details[ind]}
                        onChange={(e) => {
                          const updatedDetails = [...data.details]; 
                          updatedDetails[ind] = e.target.value; 
                          setData({ ...data, details: updatedDetails });
                        }}
                         />
                  </Grid>
                ))
                }
                <Grid item xs={1} className='plusIconContainer'>
                  <AddCircleIcon
                    id="plusIcon"
                    style={{ height: "30px", width: "30px" }}
                    onClick={() => {
                      let temp = data.details.slice();
                      temp.push("");
                      setData({ ...data, details: temp});
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                    {loading? 
                    <Button variant='contained'disabled type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>Loading ...</Button>
                    :<Button variant='contained' type='submit' fullWidth style={{backgroundColor:"#B38D46",height:"50px" ,fontSize:"1rem"}}>اضافة</Button>
                    }
                </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
export default AddChaletModal;