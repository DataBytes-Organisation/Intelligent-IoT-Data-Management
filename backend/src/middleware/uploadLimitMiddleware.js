const { MAX_REQUEST_BODY_BYTES } = require("../config/uploadLimits");

const maxUploadSizeLabel = "10 MiB";

function requestBodyLimitErrorHandler(error, _req, res, next) {
  if (error?.type !== "entity.too.large") return next(error);

  return res.status(413).json({
    error: {
      code: "REQUEST_BODY_TOO_LARGE",
      message: `Request body must not exceed ${maxUploadSizeLabel}.`,
    },
  });
}

module.exports = {
  MAX_REQUEST_BODY_BYTES,
  maxUploadSizeLabel,
  requestBodyLimitErrorHandler,
};
