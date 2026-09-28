import { UploadedDocument } from "../models/UploadedDocument";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const document = await UploadedDocument.create({
      user: req.user._id,

      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      // size: req.file.size,

      file: req.file.buffer,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      documentId: document._id,
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

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.setHeader("Content-Type", document.mimeType);

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.fileName}"`
    );

    return res.send(document.file);
  } catch (error) {
    console.error(error);
  }
};
