import { Snackbar, Alert } from "@mui/material";
interface CustomSnackbarProps {
  successSnackbar: boolean;
  successMessage?: string;
  errorSnackbar: boolean;
  errorMessage?: string;
  handleClose: () => void;
}

export default function CustomSnackbar({
  successSnackbar,
  successMessage,
  errorSnackbar,
  errorMessage,
  handleClose,
}: CustomSnackbarProps) {
  return (
    <>
      <Snackbar
        open={successSnackbar}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          {successMessage}
          送出成功d(`･∀･)b
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorSnackbar}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          送出部分失敗或完全失敗(´;ω;`)
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
