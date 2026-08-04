import { toast as sonnerToast } from "sonner";

type ToastMessage = {
  title: string;
  description?: string;
};

type ActionToastMessage = ToastMessage & {
  actionLabel: string;
  onAction: () => void;
  id?: string;
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
  action({
    title,
    description,
    actionLabel,
    onAction,
    id,
  }: ActionToastMessage) {
    return sonnerToast(title, {
      id,
      description,
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
    });
  },
  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
  promise: sonnerToast.promise,
};
