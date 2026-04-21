import { useToast } from "../components/ToastProvider";

export function useAppToast() {
  const { addToast } = useToast();
  return {
    showSuccess: (msg: string) => addToast("success", msg),
    showError: (msg: string) => addToast("error", msg),
    showInfo: (msg: string) => addToast("info", msg),
    showWarning: (msg: string) => addToast("warning", msg),
  };
}