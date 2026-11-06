import { useCallback, useEffect, useState } from "react";
import { fetchExpenses } from "../lib/api";
import { Expense } from "../types";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await fetchExpenses();
      setExpenses(result.expenses);
    } catch {
      setError("経費データを読み込めませんでした。通信を確認して再試行してください。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { expenses, isLoading, error, reload };
}
