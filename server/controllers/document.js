import UploadedDocument from "../models/UploadedDocument";
import fs from "fs";
import path from "path";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }
    console.log(req.file);

    const document = await UploadedDocument.create({
      user: req.user._id,

      fileName: req.file.originalname,
      storedFileName: req.file.filename,

      filePath: req.file.path,

      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",

      data: {
        id: document._id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        size: document.size,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to upload document",
    });
  }
};
export const getDocument = async (req, res) => {
  try {
    const document = await UploadedDocument.findById(req.params.id);
    console.log("req--", req);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        message: "File does not exist on server",
      });
    }

    res.setHeader("Content-Type", document.mimeType);

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.fileName}"`
    );

    return res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to get file",
    });
  }
};
