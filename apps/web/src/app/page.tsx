import { HomeSections } from "@/features/home";
import { Hero } from "@/features/home/hero";

export default function Home() {
  return (
    <div className="space-y-12">
      <Hero />
      <HomeSections />
    </div>
  );
}
