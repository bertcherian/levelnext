/**
 * DiagnosticRadarChart — reusable radar chart for MEP and LI diagnostic dimension scores.
 * Uses Chart.js v4 + react-chartjs-2.
 */
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface DimensionScore {
  dimension: string;
  score: number;
}

interface DiagnosticRadarChartProps {
  dimensions: DimensionScore[];
  /** Primary fill colour (CSS colour string). Defaults to LevelNext navy. */
  fillColor?: string;
  /** Border colour. Defaults to LevelNext gold. */
  borderColor?: string;
  /** Chart height in px. Defaults to 280. */
  height?: number;
}

// Shorten long dimension labels to fit the radar chart
function shortenLabel(label: string, maxLen = 22): string {
  if (label.length <= maxLen) return label;
  // Try to split at a natural word boundary
  const words = label.split(" ");
  let result = "";
  for (const word of words) {
    if ((result + " " + word).trim().length > maxLen) break;
    result = (result + " " + word).trim();
  }
  return result + "…";
}

export default function DiagnosticRadarChart({
  dimensions,
  fillColor = "rgba(10, 26, 47, 0.12)",
  borderColor = "#D4AF37",
  height = 280,
}: DiagnosticRadarChartProps) {
  if (!dimensions || dimensions.length === 0) return null;

  const labels = dimensions.map((d) => shortenLabel(d.dimension));
  const scores = dimensions.map((d) => Math.round(d.score));

  const data = {
    labels,
    datasets: [
      {
        label: "Your Score",
        data: scores,
        backgroundColor: fillColor,
        borderColor,
        borderWidth: 2,
        pointBackgroundColor: borderColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: "oklch(55% 0.02 248.6)",
          font: { size: 9 },
          backdropColor: "transparent",
          callback: (value: number) => (value === 0 ? "" : `${value}`),
        },
        grid: {
          color: "oklch(88% 0.01 248.6)",
          lineWidth: 1,
        },
        angleLines: {
          color: "oklch(88% 0.01 248.6)",
          lineWidth: 1,
        },
        pointLabels: {
          color: "oklch(30% 0.02 248.6)",
          font: { size: 10, weight: "500" as const },
          padding: 8,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.raw}/100`,
          title: (items: any[]) => dimensions[items[0].dataIndex]?.dimension ?? "",
        },
        backgroundColor: "rgba(10,26,47,0.92)",
        titleColor: "#D4AF37",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <Radar data={data} options={options as any} />
    </div>
  );
}
