import express from "express";

import { verifyToken } from "../middleware/authMiddleware.js";
import { getDocument, uploadDocument } from "../controllers/document.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(verifyToken);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/:id/file", getDocument);
export default router;
