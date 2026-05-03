
import multer from "multer";

export const  fileValidation ={
    image:["image/jpeg","image/png","image/gif"],
    document:["application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
}
export const cloudFileUpload = ({validation =[]}={})=>{
    // let basePath = `uploads/${customPath}`
     const storage = multer.diskStorage({})
    function fileFilter (req , file ,callback) {
       
        if(validation.includes(file.mimetype )){
            return callback(null ,true)
        }
        return callback("In-valid file format",false)
    }
    return multer({fileFilter, storage})
}