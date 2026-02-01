"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "./record-payment";
import type { MockLoan } from "@/lib/mock-data/loans";

interface PaymentButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  loan: MockLoan;
  onPaymentRecorded?: () => void;
}

export function PaymentButton({
  loan,
  onPaymentRecorded,
  children,
  ...props
}: PaymentButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show button for completed loans
  if (loan.status === "completed") {
    return null;
  }

  function handleSuccess() {
    onPaymentRecorded?.();
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} {...props}>
        {children || (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            返済を記録
          </>
        )}
      </Button>

      <RecordPaymentDialog
        loan={loan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
