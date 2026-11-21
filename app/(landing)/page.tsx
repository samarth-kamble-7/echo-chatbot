import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { SocialProof } from "@/components/landing/social-proof";
import { Features } from "@/components/landing/features";
import { Integrations } from "@/components/landing/integrations";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

const LandingPage = () => {
  return (
    <main className="w-full min-h-screen flex flex-col relative z-10 overflow-x-hidden bg-[#050509]">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Integrations />
      <Pricing />
      <Footer />
    </main>
  );
};

export default LandingPage;
