
import { Types } from "mongoose"
import { asyncHandler } from "../utils/response.js"
import joi from "joi"
import { genderEnum } from "../DB/models/user.model.js"

export const generalFields={
       fullName:joi.string().min(2).max(20).messages({
        "string.min":"min name length is to char",
        "any.required":"fullName is mandatory",
    }),
     email:joi.string().email({minDomainSegments:2,maxDomainSegments:3,tlds:{allow:['net','com','edu']}}),
    password:joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    confirmPassword:joi.string().valid(joi.ref("password")),
    phone:joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
    otp:joi.string().pattern(new RegExp(/^\d{6}$/)),
    gender:joi.string().valid(...Object.values(genderEnum)),
     id:joi.string().custom((value,helper)=>{

            console.log({helper})
            console.log(value)
            console.log(Types.ObjectId.isValid(value));
            return Types.ObjectId.isValid(value)||helper.message("In_valid ObjectId")
        }),
        file:{      
        fieldname: joi.string().required(),
        originalname:joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().required(),
        finalPath:joi.string().required() ,   
        destination: joi.string().required(),
        filename:joi.string().required(),
        path: joi.string().required(),
        size:joi.number().positive().required(),
    },
        
    
}


export const validation = (schema)=>{
    return asyncHandler(
        async(req,res,next)=>{
            console.log(req.files)
            console.log(schema)
            console.log(Object.keys(schema))
            const validationError=[]
            for (const key of Object.keys(schema)) {
                console.log(key);
                console.log(schema[key]);
                console.log(req[key])
                const validationResult = schema[key].validate(req[key],{abortEarly:false})
                     if (validationResult.error) {
                        validationError.push({key,details:validationResult.error.details.map(ele=>{
                            return {message:ele.message,path:ele.path[0]}
                        })})
                         
                     }   
                // console.log("========================");
            }
            if (validationError.length) {
                return res.status(400).json({error_message:"validation error",validationError})
            }
          
                    return next()
        }
    )
}
