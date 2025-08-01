"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm"
        >
          <div className="grid gap-1">
            {title && <ToastTitle className="text-xs font-medium">{title}</ToastTitle>}
            {description && (
              <ToastDescription className="text-xs text-stone-600 dark:text-stone-400">{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[320px]" />
    </ToastProvider>
  )
}
