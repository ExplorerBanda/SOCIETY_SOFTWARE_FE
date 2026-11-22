import { createContext, useContext } from "react";

export interface DialogRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export interface FeedbackApi {
  notify: (message: string, tone?: "info" | "warning" | "success") => void;
  showDialog: (request: DialogRequest) => void;
  closeDialog: () => void;
}

export const FeedbackContext = createContext<FeedbackApi>({
  notify: () => undefined,
  showDialog: () => undefined,
  closeDialog: () => undefined,
});

export function useFeedback(): FeedbackApi {
  return useContext(FeedbackContext);
}
