import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import ProjectsSection from "@/components/sections/ProjectsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import { fetchPublishedProjects } from "@/lib/projects";

const HomePage = async () => {
  const projects = await fetchPublishedProjects();
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
        <Hero />
        <ProjectsSection projects={projects} />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;

