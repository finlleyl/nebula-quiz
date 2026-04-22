import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { createGame, type CreateGameResponse } from "./api";

export const HOST_TICKET_KEY = "host_ticket";
export const HOST_ROOM_CODE_KEY = "host_room_code";

export function useHostGame() {
  const navigate = useNavigate();
  return useMutation<CreateGameResponse, Error, string>({
    mutationFn: (quizId: string) => createGame(quizId),
    onSuccess: (res) => {
      sessionStorage.setItem(HOST_TICKET_KEY, res.ws_ticket);
      sessionStorage.setItem(HOST_ROOM_CODE_KEY, res.room_code);
      navigate(`/host/${res.room_code}`);
    },
  });
}
