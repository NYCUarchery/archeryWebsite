import { DatabaseCompetition } from "@/types/Api";
import Typography from "@mui/material/Typography";
import { Button } from "@mui/material";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  competitions: DatabaseCompetition[];
  uid?: number;
  onPlayerApply?: (competitionId: number) => void;
  onAdminApply?: (competitionId: number) => void;
}
interface CompetitionItemProps {
  competition: DatabaseCompetition;
  uid?: number;
  onPlayerApply?: (competitionId: number) => void;
  onAdminApply?: (competitionId: number) => void;
}

export const CompetitionList = ({
  competitions,
  uid,
  onPlayerApply,
  onAdminApply,
}: Props) => {
  return (
    <>
      {competitions?.map((competition: DatabaseCompetition) => (
        <CompetitionItem
          competition={competition}
          uid={uid}
          onAdminApply={onAdminApply}
          onPlayerApply={onPlayerApply}
          key={competition.id}
        />
      ))}
    </>
  );
};

export const CompetitionItem = ({
  competition,
  uid,
  onPlayerApply,
  onAdminApply,
}: CompetitionItemProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleJoin = () => {
    setOpen(true);
  };

  const handlePlayeApplication = () => {
    onPlayerApply?.(competition.id!);

    setOpen(false);
  };

  const handleAdminApplication = () => {
    onAdminApply?.(competition.id!);
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
        disabled={uid === undefined}
      >
        {uid === undefined ? "登入以加入比賽" : "申請加入"}
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
