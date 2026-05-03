import jwt from "jsonwebtoken";
import * as DBService from "../../DB/db.service.js" 
import { roleEnum, UserModel } from "../../DB/models/user.model.js";
import { nanoid } from "nanoid";
import { TokenModel } from "../../DB/models/token.model.js";

export const signatureLevelEnum = { bearer :"Bearer" , system :"System"}
export const tokenTypeEnum = { access:"access",refresh:"refresh"}
export const logoutEnum = { signoutFromAll:"signoutFromAll", signout : "signout", stayLoggedIn : " stayLoggedIn"}

export const generateToken = async({
    payload={},
    secret=process.env.ACCESS_USER_TOKEN_SIGNATURE,
    options = {
   expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)}
}={})=>{
 return jwt.sign(payload,secret,options)
}


export const verifyToken = async({
    token="",
    secret=process.env.ACCESS_USER_TOKEN_SIGNATURE
}={})=>{
    return jwt.verify(token,secret)
}


export const getSignatures = async({signatureLevel=signatureLevelEnum.bearer}={})=>{
    let signatures= {accessSignature:undefined,refreshSignature:undefined}
        switch (signatureLevel) {
            case signatureLevelEnum.system:
                signatures.accessSignature=process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE
                signatures.refreshSignature=process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE
                break;
        
            default:
                signatures.accessSignature=process.env.ACCESS_USER_TOKEN_SIGNATURE
                signatures.refreshSignature=process.env.REFRESH_USER_TOKEN_SIGNATURE
                break;
        }
        return signatures
} 


export const decodedToken = async({next,authorization="",tokenType=tokenTypeEnum.access}={})=>{
  
    console.log(authorization)
    console.log(authorization?.split(' '))

    const [bearer,token] = authorization?.split(' ') || []
    console.log({bearer,token})
    if (!bearer || !token) {
        return next(new Error("missing token parts",{cause:401}))
    }

 let signatures=await getSignatures({signatureLevel :bearer})

 const decoded = await verifyToken({
    token,
    secret: tokenType === tokenTypeEnum.access? signatures.accessSignature : signatures.refreshSignature
})
    //  if(!decoded?._id){
    //      return next(new Error("In_valid Token",{cause:400}))
    // }
 console.log(decoded)
 if (decoded.jti && await DBService.findOne({model:TokenModel,filter:{jti:decoded.jti}})) {
    return next(new Error("In-valid Login Credentials",{cause:401}))
 }
  
    const user = await DBService.findById({
        model:UserModel,
        id:decoded._id
    })
    if (!user) {
        return next (new Error("Not register account",{cause:404}))
    }
   console.log({user:user.changeCredentialsTime?.getTime(),decoded:decoded.iat*1000})
    if (user.changeCredentialsTime?.getTime()>decoded.iat*1000) {
        return next (new Error("In_valid login credentials",{cause:401}))
    }
   return {user , decoded}
}


export const generateLoginCredentials=async({user}={})=>{
         let signatures= await getSignatures({
            signatureLevel:user.role != roleEnum.user ? signatureLevelEnum.system : signatureLevelEnum.bearer
        })
        console.log(signatures)
        const jwtid = nanoid()
        const access_token = await generateToken({
            payload:{_id:user._id},
            secret:signatures.accessSignature,
            options:{
                jwtid,
                expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
            }
        })
        const refresh_token=await generateToken({
            payload:{_id:user._id},
            secret:signatures.refreshSignature,
            options:{
                jwtid,
                expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
            }
        })
        return {access_token,refresh_token}
}

export const createRevokeToken = async({ req }={})=>{
                //    const revokeToken =
             await DBService.create({ 
                 model:UserModel,
                 data:[{
                 jti:req.decoded.jti,
                 expiresIn:req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                 userId:req.decoded._id
        }]
    
       })   
       return true;
}