import mongoose from "mongoose";
export const providerEnum={system:"system",google:"google"}
export const genderEnum ={male:"male",female:"female"}
export const roleEnum = {user:"user",admin:"admin"}
const userSchema =new mongoose.Schema({
    firstName:{type :String, required:true , minLength:2,
        maxLength:[20,"firstName  maxLength 20 char and you have enterd{VALUE}"]
    }, 
      lastName:{type :String, required:true , minLength:2,
        maxLength:[20,"lastName  maxLength 20 char and you have enterd{VALUE}"]
      },
      email:{type:String ,required:true,unique:true},
      password:{type : String,
         required:function() {
          console.log({DOC:this})
        return this.provider === providerEnum.system ? true : false
      }},
      oldPassword:[String],
      forgotPasswordOtp:String,
      phone:{type:String,
        required:function () {
        return this.provider === providerEnum.system ? true : false
      }},
      gender:{
        type:String,
        enum:{values:Object.values(genderEnum),message:`gender only allow${Object.values(genderEnum)}`},
        default:genderEnum.male
      },
      role:{
        type:String,
        enum:Object.values(roleEnum),
        default:roleEnum.user
      },
      provider:{type:String,enum:Object.values(providerEnum),default:providerEnum.system},
      confirmEmail:Date,
      confirmEmailOtp:String,
      picture:{secure_url:String , public_id:String} ,
      coverImages:[{secure_url:String , public_id:String}],
      changeCredentialsTime:Date,

      deletedAt:Date,
      deletedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},

      restoredAt:Date,
      restoredBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}

},{
    timestamps:true,
    toObject:{virtuals:true},
    toJSON:{virtuals:true}

})

userSchema.virtual("fullName").set(function(value){
    const[firstName,lastName]=value?.split(" ")||[]
    this.set({firstName,lastName})

}).get (function(){
    return this.firstName+"  "+this.lastName
})

userSchema.virtual('message',{
  localField:"_id",
  foreignField:"receiverId",
  ref:"Message"
})

export const UserModel = mongoose.models.User || mongoose.model("User",userSchema)
UserModel.syncIndexes()