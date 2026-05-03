
import { providerEnum, roleEnum, UserModel } from "../../DB/models/user.model.js"
import { asyncHandler, successResponse } from "../../utils/response.js"
import *as DBServise from "../../DB/db.service.js"
import { Error, model } from "mongoose"
import { compareHash, generateHash } from "../../utils/security/hash.security.js"
import { generateEncryption } from "../../utils/security/encryption.security.js"
import { generateLoginCredentials} from "../../utils/security/token.security.js"
import {OAuth2Client}  from'google-auth-library';
import { emailEvent } from "../../utils/events/email.event.js"
import { customAlphabet } from "nanoid"
// import * as validators from "./auth.validation.js"
// import { title } from "node:process"

export const signup=asyncHandler(
    async(req,res,next)=>{
        const {fullName,email,password,phone}=req.body
        console.log({ fullName , email , password , phone })
        const checkUserExist = await DBServise.findOne({ model:UserModel , filter:{email}})
        if (checkUserExist) {
            return next(new Error("Email exist" , { cause : 409 }))  
        }
        const hashPassword = await generateHash ( { plaintext : password } )
        const encPhone = await generateEncryption({plaintext:phone})
        console.log(encPhone)
        const otp =customAlphabet("0123456789",6)()
        const confirmEmailOtp = await generateHash({plaintext:otp})
        const [user] =await DBServise.create({
            model:UserModel ,
            data:[{
                 fullName , email , password : hashPassword , phone :encPhone ,confirmEmailOtp
                }]       
        })
        emailEvent.emit("confirmEmail",{to:email,otp:otp})
        return successResponse({ res , status: 201 , data: {user} })
    }

)
export const confirmEmail=asyncHandler(
    async(req,res,next)=>{
    
    

        const {email,otp}=req.body
        const user = await DBServise.findOne({
            model:UserModel,
            filter:{
                email, 
                confirmEmail:{$exists:false},
                confirmEmailOtp:{$exists:true}
            }
        })
        if (!user) {
            return next(new Error("In-valid account or Already verified",{cause:404}))
        }
        if (!await compareHash({plaintext:otp,hashValue:user.confirmEmailOtp})) {
            return next(new Error("In-valid otp"))
        }
        const updateUser = await DBServise.updateOne({
            model:UserModel,
            filter:{email},
            data:{
                confirmEmail:Date.now(),
                $unset:{confirmEmailOtp:true},
                $inc:{__v:1}
            } 
        })
        return updateUser.matchedCount? successResponse({ res , status: 200 , data: { } })
        :next(new Error("fail to confim user email"))
    }

)
export const login=asyncHandler(
    async(req,res,next)=>{ 
        const {email ,password}=req.body
        const user = await DBServise.findOne({
            model:UserModel,
            filter:{ email , provider:providerEnum.system },
             select:"-gender"
        })
        if (!user) {
            return next(new Error("In_valid login data",{cause:404}))
        }
        if (!user.confirmEmail) {
            return next(new Error("please verify your account first",{cause:400}))
        }
         if (user.deletedAt) {
            return next(new Error("this account is deleted"))
        }
        const match = await compareHash({plaintext:password,hashValue:user.password})
        console.log({FE:password,DB:user.password,match})
        if (!match) {
            return next(new Error("In_valid Login Data",{cause:404}))
        }
        const credentials=await generateLoginCredentials({user})
        return  successResponse({res  , data: { credentials } })
}
)


export const sendForgotPassword=asyncHandler(
    async(req,res,next)=>{ 
    
        const {email}= req.body
        const otp = customAlphabet("0123456789",6)()
        const user = await DBServise.findOneAndUpdate({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deletedAt:{$exists:false},
                provider: providerEnum.system
            },
            data:{
                      forgotPasswordOtp: await generateHash({plaintext:otp})

            }
        })
        if (!user) {
            return next(new Error("In-valid account",{cause:404}))
        }
        emailEvent.emit("SendForgotPassword",{ to : email , subject : "Forgot Passwrd" , title : "Reset-Password" , otp})
        return  successResponse({res  })
}
)

export const verifyForgotPassword = asyncHandler(
    async(req,res,next)=>{ 
    
        const {email,otp}= req.body
       
        const user = await DBServise.findOne({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deletedAt:{$exists:false},
                forgotPasswordOtp:{$exists:true},
                provider: providerEnum.system
            }
        })
        if (!user) {
            return next(new Error("In-valid account",{cause:404}))
        }
        if (!await compareHash({plaintext:otp ,hashValue:user.forgotPasswordOtp})) {
            return next(new Error("In-valid otp",{cause:400}))
        }
        return  successResponse({res  })
}
)

export const resetPassword = asyncHandler(
    async(req,res,next)=>{ 
    
        const {email,otp,password}= req.body
       
        const user = await DBServise.findOne({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deletedAt:{$exists:false},
                forgotPasswordOtp:{$exists:true},
                provider: providerEnum.system
            }
        })
        if (!user) {
            return next(new Error("In-valid account",{cause:404}))
        }
        if (!await compareHash({plaintext:otp ,hashValue:user.forgotPasswordOtp})) {
            return next(new Error("In-valid otp",{cause:400}))
        }
        await DBServise.updateOne({
            model:UserModel,
            filter:{
                email
            },
            data:{
                password: await generateHash({plaintext:password}),
                changeCredentialsTime:new Date(),
                $unset :{
                    forgotPasswordOtp:1
                }
            }
        })
        return  successResponse({res  })
}
)

/*{
    "message": "Done",
    "data": {
        "payload": {
            "iss": "https://accounts.google.com",
            "azp": "1025846568694-fp82a2lkq3rdcbnir3sdg22524p3545h.apps.googleusercontent.com",
            "aud": "1025846568694-fp82a2lkq3rdcbnir3sdg22524p3545h.apps.googleusercontent.com",
            "sub": "102072405813730261553",
            "email": "ma7751347@gmail.com",
            "email_verified": true,
            "nbf": 1768611788,
            "name": "mohamed adel hamza",
            "picture": "https://lh3.googleusercontent.com/a/ACg8ocL9JkITFAXbC4Mb6RyPwz2KL9TiRD4uDNCj2T2n45RlqX32xoGI=s96-c",
            "given_name": "mohamed adel",
            "family_name": "hamza",
            "iat": 1768612088,
            "exp": 1768615688,
            "jti": "9d21c19fa2423165c2d8f8b73c315ca756d5c9a0"
        }
    }
}
 */
async function verifayGoogleAccount({idToken}={}) {
          
const client = new OAuth2Client();
 const ticket = await client.verifyIdToken({
      idToken ,
      audience: process.env.WEP_CLIENT_IDS.split(",")
  });
  const payload = ticket.getPayload();
   return payload

}
export const signupWithGmail=asyncHandler(
    async(req,res,next)=>{
     const {idToken}=req.body
     const {picture,name,email_verified,email}=await verifayGoogleAccount({idToken})
     if (!email_verified) {
        return next(new Error("not verified account",{cause:400}))
     }
     const user = await DBServise.findOne({
        model:UserModel,
        filter:{email},

     })
     if (user) {
        if (user.provider===providerEnum.google) {
            return loginWithGmail(req,res,next)
        }
        return next(new Error("Email Exist",{cause:409}))
     }
     const[newUser] =await DBServise.create({
        model:UserModel,
        data:[{
            fullName:name,
            email,
            picture,
            provider:providerEnum.google,
            confirmEmail:Date.now()
        }]
     })
         const credintials=await generateLoginCredintials({user})
         
         return successResponse({ res , status: 200 , data: {credintials} })
        
    }

)


export const loginWithGmail=asyncHandler(
    async(req,res,next)=>{
     const {idToken}=req.body
     const {email_verified,email}=await verifayGoogleAccount({idToken})
     if (!email_verified) {
        return next(new Error("not verified account",{cause:400}))
     }
     const user = await DBServise.findOne({
        model:UserModel,
        filter:{email ,provider:providerEnum.google},

     })
     if (!user) {
        return next(new Error("In_valid Login Data or In_valid Provider",{cause:409}))
     }
   
     const credentials=await generateLoginCredintials({user})

        return successResponse({ res , status: 200 , data: {credentials} })
    }

)