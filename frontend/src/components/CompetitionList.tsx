import { DatabaseCompetition } from "@/types/Api";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import { useState } from "react";
import { useMutation } from "react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/ApiClient";

interface Props {
  competitions: DatabaseCompetition[];
  uid: number;
}
interface CompetitionItemProps {
  competition: DatabaseCompetition;
  uid: number;
}

export const CompetitionList = ({ competitions, uid }: Props) => {
  return (
    <>
      {competitions?.map((competition: DatabaseCompetition) => (
        <CompetitionItem
          competition={competition}
          uid={uid}
          key={competition.id}
        />
      ))}
    </>
  );
};

export const CompetitionItem = ({ competition, uid }: CompetitionItemProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { mutate: apply } = useMutation(
    apiClient.participant.participantCreate
  );

  const handleJoin = () => {
    setOpen(true);
  };

  const handlePlayeApplication = () => {
    apply({
      competition_id: competition.id,
      user_id: uid,
      role: "player",
    });
    setOpen(false);
  };

  const handleAdminApplication = () => {
    apply({
      competition_id: competition.id,
      user_id: uid,
      role: "admin",
    });
    setOpen(false);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <Typography variant="h6" component="div" sx={{ p: 2 }}>
        {competition.title}
      </Typography>
      <Typography variant="body1" component="div" sx={{ p: 2 }}>
        {competition.sub_title}
      </Typography>

      <Button
        onClick={() => router.push(`/competition/${competition.id}`)}
        sx={{ ml: 2, mb: 2 }}
        variant="contained"
      >
        查看記分板
      </Button>
      <Button
        onClick={handleJoin}
        color="secondary"
        variant="contained"
        sx={{ ml: 2, mb: 2 }}
      >
        申請加入
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogActions>
          <Button onClick={handleAdminApplication}>申請為管理員</Button>
          <Button onClick={handlePlayeApplication}>申請為選手</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
