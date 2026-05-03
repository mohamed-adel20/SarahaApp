 
 import path from "node:path"
 import * as detenv from "dotenv"
   detenv.config({path:path.join("./src/config/.env.dev")})
 //detenv.config({ })
import connectDB from "./DB/connection.db.js"
import authController from "./modules/auth/auth.controller.js"
import messageController from"./modules/message/message.controller.js"
import blogController from "./modules/blog/blog.controller.js"
import userController from "./modules/user/user.controller.js"
import express from"express"
import { globalErrorHandling } from "./utils/response.js"
import cors from "cors"
import morgan from "morgan"
import helmet from "helmet"
import chalk from "chalk"

const bootstrap=async()=>{

const app=express()
const port=process.env.PORT||5000
//cors
app.use(cors())
app.use(morgan('dev'))
app.use(helmet())
//DB
await connectDB()
app.use("/uploads",express.static(path.resolve('./src/uploads')))
// convert Buffer data
app.use(express.json())
//app-routing
app.get('/',(req,res)=>res.send({message:"welcome to app ❤"}))
app.use("/auth",authController)
app.use("/blog",blogController)
app.use("/user",userController)
app.use("/message",messageController)
app.all('{/*dummy}',(req,res)=>res.status(404).json({message:"In_valid app router"}))
app.use(globalErrorHandling)


 
 return app.listen(port,()=>console.log(chalk.bgGreen(chalk.black`Example App listenig on port ${port}🚀`)))
}
export default bootstrap