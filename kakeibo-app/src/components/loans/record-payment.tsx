"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  recordLoanPayment,
  getAccounts,
  type RecordPaymentInput,
} from "@/lib/actions/loans";
import type { MockLoan } from "@/lib/mock-data/loans";

interface RecordPaymentDialogProps {
  loan: MockLoan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Account {
  id: string;
  name: string;
}

export function RecordPaymentDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [totalAmount, setTotalAmount] = useState<string>(
    loan.monthly_payment.toString()
  );
  const [principalAmount, setPrincipalAmount] = useState<string>("");
  const [interestAmount, setInterestAmount] = useState<string>("");
  const [accountId, setAccountId] = useState<string>(loan.account_id || "");
  const [memo, setMemo] = useState<string>("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Load accounts
  useEffect(() => {
    async function loadAccounts() {
      setIsLoading(true);
      try {
        const data = await getAccounts();
        setAccounts(data);
      } finally {
        setIsLoading(false);
      }
    }
    if (open) {
      loadAccounts();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPaymentDate(new Date());
      setTotalAmount(loan.monthly_payment.toString());
      setPrincipalAmount("");
      setInterestAmount("");
      setAccountId(loan.account_id || "");
      setMemo("");
      setShowBreakdown(false);
      setError(null);
    }
  }, [open, loan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const input: RecordPaymentInput = {
      loan_id: loan.id,
      payment_date: format(paymentDate, "yyyy-MM-dd"),
      total_amount: parseInt(totalAmount, 10) || 0,
      account_id: accountId,
      memo: memo || undefined,
    };

    // Add breakdown if provided
    if (showBreakdown && principalAmount) {
      input.principal_amount = parseInt(principalAmount, 10) || 0;
      input.interest_amount = parseInt(interestAmount, 10) || 0;
    }

    try {
      const result = await recordLoanPayment(input);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      setError("予期せぬエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("ja-JP").format(amount);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>返済を記録</DialogTitle>
          <DialogDescription>
            {loan.loan_name}の返済を記録します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loan Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">現在の残高</span>
              <span className="font-medium">
                ¥{formatCurrency(loan.current_balance)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">月々の返済額</span>
              <span>¥{formatCurrency(loan.monthly_payment)}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>返済日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "yyyy年MM月dd日", { locale: ja })
                  ) : (
                    <span>日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="total_amount">返済金額</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="total_amount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="pl-8"
                placeholder="0"
                min="1"
                required
              />
            </div>
          </div>

          {/* Breakdown Toggle */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-xs text-muted-foreground"
            >
              {showBreakdown ? "▼ 内訳を閉じる" : "▶ 元本・利息の内訳を入力"}
            </Button>
          </div>

          {/* Breakdown Fields */}
          {showBreakdown && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principal_amount">元本</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="principal_amount"
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest_amount">利息</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="interest_amount"
                    type="number"
                    value={interestAmount}
                    onChange={(e) => setInterestAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="space-y-2">
            <Label>引き落とし口座</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                読み込み中...
              </div>
            ) : (
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="口座を選択" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="備考があれば入力"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || !accountId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  記録中...
                </>
              ) : (
                "返済を記録"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
