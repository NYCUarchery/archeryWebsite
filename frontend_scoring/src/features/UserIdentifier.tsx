import { useQuery } from "react-query";
import axios from "axios";
import { useDispatch } from "react-redux";
import { initializeUser } from "./States/userSlice";

const getUID = () => {
  return axios.get("/api/user/uid");
};
const getParticipant = (uid: number) => {
  return axios.get(`/api/participant/user/${uid}`);
};

export default function UserIdentifier() {
  const dispatch = useDispatch();
  const { data: uID } = useQuery("getUID", getUID, {
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
    select: (data: any) => {
      const id = data?.data.id;
      return id;
    },
  });
  const { data: participant } = useQuery(
    ["getParticipant", uID],
    () => getParticipant(uID),
    {
      retry: false,
      staleTime: 1000 * 60 * 60 * 24,
      enabled: !!uID,
      select: (data: any) => {
        const participant = data?.data;
        return participant;
      },
    }
  );

  if (participant) {
    dispatch(
      initializeUser({
        name: participant.name,
        id: participant.id,
        role: participant.role,
      })
    );
  } else {
    dispatch(
      initializeUser({
        name: "訪客",
        id: -1,
        role: "",
      })
    );
  }

  return <></>;
}
