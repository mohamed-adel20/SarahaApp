import mongoose from "mongoose";

const connectDB=async()=>{
    try {
        const uri=process.env.DB_URI
        const result = await mongoose.connect(uri,{
            serverSelectionTimeoutMS:30000
        })
        console.log(result.models)
        console.log(`DB connected successfully 👌`)

    } catch (error) {
        console.log(`fail to connnect on DB❌`,error)
    }
}
export default connectDB



