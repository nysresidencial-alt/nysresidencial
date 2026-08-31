import { Hero } from "@/components/Hero";
import { PropertiesGrid } from "@/components/PropertiesGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <PropertiesGrid />
    </div>
  );
}
