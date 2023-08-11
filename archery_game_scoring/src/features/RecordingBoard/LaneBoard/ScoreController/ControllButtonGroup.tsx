import { ButtonGroup, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { deleteScore } from "./scoreControllerSlice";
import { toggleConfirmation } from "./scoreControllerSlice";

export default function ControllButtonGroup() {
  const dispatch = useDispatch();
  const confirmations = useSelector(
    (state: any) => state.scoreController.confirmations
  );
  const userTarget = useSelector((state: any) => state.user.userTarget);
  const handleConfirmation = () => {
    console.log(userTarget);
    dispatch(toggleConfirmation(userTarget));
  };
  const handledelete = () => {
    dispatch(deleteScore());
  };

  return (
    <ButtonGroup className="controll_button_group" fullWidth variant="text">
      <Button
        className="confirm_button"
        id={confirmations[userTarget] ? "confirmed" : "unconfirmed"}
        onClick={handleConfirmation}
      >
        {confirmations[userTarget] ? "取消確認" : "確認"}
      </Button>
      <Button className="send_button">送出</Button>
      <Button className="cancel_button" onClick={handledelete}>
        &lt;=
      </Button>
    </ButtonGroup>
  );
}
