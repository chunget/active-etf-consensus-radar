import { DashboardClient } from "@/components/dashboard/DashboardClient";
import dataStatus from "@/data/status.json";
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
    date: dataStatus.marketDate.replaceAll("/", "-"),
    selectedEvents: freshEvents,
    forecastHorizon: 5,
  });

  return (
    <DashboardClient
      initialPrediction={initialPrediction}
      macros={macros}
      etfs={etfs}
      rank={rank}
      dataUpdatedAt={dataStatus.updatedAt}
      dataSources={dataStatus.sources}
    />
  );
}
