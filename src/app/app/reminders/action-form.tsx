"use client";

import { useEffect, useState } from "react";

// Formulaire dont le bouton se bloque dès le clic et affiche « en cours ».
// Sans cela, on ne sait pas si l'envoi est parti et on reclique.
export default function ActionForm({
  action,
  label,
  pendingLabel,
  buttonClassName,
  formClassName,
  disabled = false,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  pendingLabel: string;
  buttonClassName: string;
  formClassName?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);

  // Filet de sécurité : si la page ne se recharge pas, on rend le bouton après 30 s.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(false), 30_000);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <form
      action={action}
      className={formClassName}
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        if (pending) {
          e.preventDefault();
          return;
        }
        // Après l'envoi du formulaire : les données sont déjà lues à ce stade.
        setTimeout(() => setPending(true), 0);
      }}
    >
      {children}
      <button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        className={buttonClassName + (pending ? " cursor-wait opacity-80" : "")}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            />
            {pendingLabel}
          </span>
        ) : (
          label
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? pendingLabel : ""}
      </span>
    </form>
  );
}
