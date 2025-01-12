import { Snackbar, Alert } from "@mui/material";

interface Props {
  isSuccess?: boolean;
  successMessage?: string;
  isInfo?: boolean;
  infoMessage?: string;
  isError?: boolean;
  errorMessage?: string;
  onClose?: () => void;
}

export default function NoticeSnackbars({
  isSuccess = false,
  successMessage = "操作成功！",
  isInfo = false,
  infoMessage = "",
  isError = false,
  errorMessage = "操作失敗。",
  onClose,
}: Props) {
  return (
    <>
      <Snackbar
        open={isInfo}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={onClose}
      >
        <Alert onClose={onClose} severity="success" sx={{ width: "100%" }}>
          {infoMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={isSuccess}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={onClose}
      >
        <Alert onClose={onClose} severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={isError}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={onClose}
      >
        <Alert onClose={onClose} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
