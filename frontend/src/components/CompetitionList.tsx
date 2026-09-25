"use client";
import { DatabaseCompetition } from "@/types/Api";
import { Button } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  competitions: DatabaseCompetition[];
  uid?: number;
  onPlayerApply?: (competitionId: number) => void;
  onJudgeApply?: (competitionId: number) => void;
  onAdminApply?: (competitionId: number) => void;
  variant?: "card" | "row";
}

interface CompetitionItemProps extends Omit<Props, "competitions"> {
  competition: DatabaseCompetition;
}

export const CompetitionList = ({
  competitions,
  uid,
  onPlayerApply,
  onJudgeApply,
  onAdminApply,
  variant = "row",
}: Props) => (
  <>
    {competitions.map((competition) => (
      <CompetitionItem
        key={competition.id}
        competition={competition}
        uid={uid}
        onAdminApply={onAdminApply}
        onJudgeApply={onJudgeApply}
        onPlayerApply={onPlayerApply}
        variant={variant}
      />
    ))}
  </>
);

export const CompetitionItem = ({
  competition,
  uid,
  onPlayerApply,
  onJudgeApply,
  onAdminApply,
  variant = "row",
}: CompetitionItemProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const competitionId = competition.id!;

  const apply = (callback?: (id: number) => void) => {
    callback?.(competitionId);
    setOpen(false);
  };

  return (
    <article className={`home-competition-${variant}`}>
      <div className="home-competition-copy">
        <Typography component="h2">{competition.title}</Typography>
        {competition.sub_title && <Typography component="p">{competition.sub_title}</Typography>}
      </div>
      <div className="home-competition-actions">
        <Button
          className="home-button-primary"
          variant="contained"
          onClick={() => router.push(`/competition/${competitionId}`)}
        >
          查看記分板 <span aria-hidden="true">→</span>
        </Button>
        <Button
          className="home-button-secondary"
          variant="outlined"
          onClick={() => (uid === undefined ? router.push("/login") : setOpen(true))}
        >
          {uid === undefined ? "登入以加入比賽" : "申請加入"}
        </Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby={`competition-${competitionId}-apply`}>
        <DialogTitle id={`competition-${competitionId}-apply`}>選擇申請角色</DialogTitle>
        <DialogContent>
          <DialogContentText>請選擇您想申請加入比賽的角色。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => apply(onAdminApply)}>申請為管理員</Button>
          <Button onClick={() => apply(onJudgeApply)}>申請為裁判</Button>
          <Button onClick={() => apply(onPlayerApply)} autoFocus>申請為選手</Button>
        </DialogActions>
      </Dialog>
    </article>
  );
};
