import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { etfProvider, macroProvider, marketProvider } from "@/lib/providers";
import { predict } from "@/lib/predict";

export default async function Home() {
  const [macros, etfs, rank] = await Promise.all([
    macroProvider.list(),
    etfProvider.list(),
    marketProvider.rank(),
  ]);
  const freshEvents = macros.filter((event) => event.fresh).map((event) => event.id);
  const initialPrediction = await predict({
    date: "2026-09-16",
    selectedEvents: freshEvents,
    forecastHorizon: 5,
  });

  return (
    <DashboardClient
      initialPrediction={initialPrediction}
      macros={macros}
      etfs={etfs}
      rank={rank}
    />
  );
}
