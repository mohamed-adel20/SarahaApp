import * as blogService from "./blog.service.js"
import { Router }   from "express";

const router = Router()
router.get("/",blogService.list)
export default router