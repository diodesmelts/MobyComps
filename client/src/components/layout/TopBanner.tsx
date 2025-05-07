import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TopBanner() {
  const { data: siteConfig } = useQuery({
    queryKey: ["/api/admin/config"],
    queryFn: adminApi.getSiteConfig,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (!siteConfig?.marketingBanner?.text) {
    return null;
  }

  return (
    <Alert className="rounded-none bg-secondary text-secondary-foreground py-2 border-0">
      <AlertDescription className="text-center text-sm flex items-center justify-center gap-2 font-medium">
        <Clock className="h-4 w-4" />
        {siteConfig.marketingBanner.text}
      </AlertDescription>
    </Alert>
  );
}
