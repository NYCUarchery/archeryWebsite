interface Props {
  confirmed: boolean;
}

export default function ConfirmationSignal(props: Props) {
  return (
    <div
      className="confirmation_signal"
      id={props.confirmed ? "true" : "false"}
    >
      {props.confirmed ? "✔" : "-"}
    </div>
  );
}
