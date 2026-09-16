const { MAX_CSV_UPLOAD_BYTES } = require("../config/uploadLimits");

const maxUploadSizeLabel = "10 MiB";

function uploadLimitErrorHandler(error, _req, res, next) {
  if (error?.type !== "entity.too.large") return next(error);

  return res.status(413).json({
    error: {
      code: "UPLOAD_TOO_LARGE",
      message: `CSV upload requests must not exceed ${maxUploadSizeLabel}.`,
    },
  });
}

module.exports = {
  MAX_CSV_UPLOAD_BYTES,
  maxUploadSizeLabel,
  uploadLimitErrorHandler,
};
