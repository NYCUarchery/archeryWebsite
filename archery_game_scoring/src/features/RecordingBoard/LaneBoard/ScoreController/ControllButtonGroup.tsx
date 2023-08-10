import { ButtonGroup, Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { deleteScore } from "./scoreControllerSlice";

export default function ControllButtonGroup() {
  const dispatch = useDispatch();
  const handledelete = () => {
    dispatch(deleteScore());
  };

  return (
    <ButtonGroup className="controll_button_group" fullWidth>
      <Button className="confirm_button">確認</Button>
      <Button className="send_button">送出</Button>
      <Button className="cancel_button" onClick={handledelete}>
        &lt;=
      </Button>
    </ButtonGroup>
  );
}
