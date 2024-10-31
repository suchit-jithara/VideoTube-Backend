import fs from "fs";

const RemoveFileFromLocalStorage = (req, res, FileName) => {
  
  if (req.files && Array.isArray(req.files[FileName]) && req.files[FileName].length > 0) {
    fs.unlinkSync(req.files[FileName][0].path);
  }

  if (req.file && req.file[FileName] && req.file[FileName].path) {
    fs.unlinkSync(req.files[FileName].path);
  }
}

export { RemoveFileFromLocalStorage };