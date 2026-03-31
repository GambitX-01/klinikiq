import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ClinicState {
  clinic_id: string;
  patient_count: number;
  inventory: Array<{
    id: string;
    name: string;
    level: number;
    status: string;
  }>;
  logs: string[];
}

export const useClinicData = () => {
  const queryClient = useQueryClient();

  const statusQuery = useQuery<ClinicState>({
    queryKey: ["clinic-status"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error("Failed to fetch clinic status");
      return res.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const waitTimeQuery = useQuery<{ wait_minutes: number }>({
    queryKey: ["wait-time"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/predict/wait-time`);
      if (!res.ok) throw new Error("Failed to fetch wait time");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const triggerRestock = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${API_BASE}/trigger-restock/${itemId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to trigger restock");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Agent Deployed: ${data.item} restock initiated`);
      queryClient.invalidateQueries({ queryKey: ["clinic-status"] });
    },
    onError: (err) => {
      toast.error("Failed to deploy restock agent");
      console.error(err);
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    waitTime: waitTimeQuery.data?.wait_minutes,
    triggerRestock,
  };
};
