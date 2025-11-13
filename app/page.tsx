import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import ProjectsSection from "@/components/sections/ProjectsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import type { Project } from "@/components/ProjectCard";
import projectHorizon from "@/img/project-horizon.jpg";
import projectCascade from "@/img/project-cascade.jpg";
import projectAtrium from "@/img/project-atrium.jpg";
import projectTidal from "@/img/project-tidal.jpg";
import projectAtelier from "@/img/project-atelier.jpg";

const projects: Project[] = [
  {
    title: "Horizon Courtyard House",
    category: "Residential",
    location: "Mallorca, Spain — 2025",
    image: projectHorizon
  },
  {
    title: "Cascade Cultural Pavilion",
    category: "Public",
    location: "Seoul, South Korea — 2024",
    image: projectCascade
  },
  {
    title: "Atrium Wellness Retreat",
    category: "Hospitality",
    location: "Queenstown, New Zealand — 2024",
    image: projectAtrium
  },
  {
    title: "Tidal Research Center",
    category: "Institutional",
    location: "Reykjanes, Iceland — 2023",
    image: projectTidal
  },
  {
    title: "Atelier Lumi Foyer",
    category: "Cultural",
    location: "Oslo, Norway — 2023",
    image: projectAtelier
  }
];

const HomePage = () => (
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

export default HomePage;

