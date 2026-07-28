import { toast as sonnerToast } from "sonner";

type ToastMessage = {
  title: string;
  description?: string;
};

/**
 * Typed toast helpers — keeps Sonner usage out of feature UI.
 */
export const toast = {
  success({ title, description }: ToastMessage) {
    return sonnerToast.success(title, { description });
  },
  error({ title, description }: ToastMessage) {
    return sonnerToast.error(title, { description });
  },
  info({ title, description }: ToastMessage) {
    return sonnerToast.info(title, { description });
  },
  warning({ title, description }: ToastMessage) {
    return sonnerToast.warning(title, { description });
  },
  loading({ title, description }: ToastMessage) {
    return sonnerToast.loading(title, { description });
  },
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
  promise: sonnerToast.promise,
};
