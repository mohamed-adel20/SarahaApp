
import { auth, authentication, authorization } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
// import { cloudFileUpload } from "../../utils/multer/cloud.multer.js";
import { fileValidation,  cloudFileUpload } from "../../utils/multer/cloud.multer.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { endpoint } from "./user.authorization.js";
import * as userService from "./user.service.js"
import *as validators from "./user.validation.js"
import { Router } from "express";
const router = Router()
router.post("/logout",authentication(),validation(validators.logout),userService.logout)

router.get("/",auth({accessRoles:endpoint.profile}),userService.profile)

router.get("/refresh-token",authentication({tokenType:tokenTypeEnum.refresh}),userService.getNewLoginCredentials)

router.get("/:userId",validation(validators.shareprofile),userService.shareprofile)

router.patch("/",auth({accessRoles:endpoint.restoreAccount}),
validation(validators.updateBasicInfo),userService.updateBasicInfo)

router.patch("/password",
        authentication(),validation(validators.updatePassword),userService.updatePassword)

router.patch("/profile-image",
        authentication(),
       cloudFileUpload({validation:fileValidation.image}).single("image"),
       validation(validators.profileImage),
        userService.profileImage)

router.patch("/profile-cover-images",
        authentication(),
         cloudFileUpload({
                validation:fileValidation.image}).array("images",2),
                validation(validators.coverImage),
        userService.profileCoverImage)

router.patch("/:userId/restore-account",
        authentication(),validation(validators.restoreAccount),userService.restoreAccount)

router.delete("/:userId/delete-account",
        authentication(),validation(validators.deleteAccount),userService.deleteAccount)
        
router.delete("{/:userId}/freeze-account",
    authentication(),validation(validators.freezeAccount),userService.freezeAccount)
 

export default router