import { StaticImageData } from "next/image";

import heroImage from "@/img/hero.jpg";
import projectHorizon from "@/img/project-horizon.jpg";
import projectCascade from "@/img/project-cascade.jpg";
import projectAtrium from "@/img/project-atrium.jpg";
import projectTidal from "@/img/project-tidal.jpg";
import projectAtelier from "@/img/project-atelier.jpg";

export type ProjectGalleryImage = {
  image: StaticImageData;
  caption: string;
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  heroImage: StaticImageData;
  heroCaption: string;
  excerpt: string;
  description: string[];
  meta: { label: string; value: string }[];
  services: string[];
  collaborators: string[];
  gallery: ProjectGalleryImage[];
};

export const projects: Project[] = [
  {
    slug: "horizon-courtyard-house",
    title: "Horizon Courtyard House",
    category: "Residential",
    location: "Mallorca, Spain",
    year: "2025",
    heroImage: projectHorizon,
    heroCaption: "Pool terrace capturing afternoon light across volcanic stone.",
    excerpt:
      "A coastal residence carved into terraced limestone, framing the horizon through layered courtyards and reflection pools.",
    description: [
      "The Horizon Courtyard House is a retreat for a contemporary art collector, designed as a procession of framed views. Each courtyard layers light, water, and vegetation to create moments of calm between interior galleries.",
      "Structural concrete planes are softened by sandblasted limestone and microclimate planting. Deep overhangs temper the Mediterranean sun while clerestory cuts draw daylight deep into the main salon."
    ],
    meta: [
      { label: "Location", value: "Mallorca, Spain" },
      { label: "Year", value: "2025" },
      { label: "Scope", value: "New Build Residence" },
      { label: "Size", value: "860 m²" }
    ],
    services: [
      "Concept development",
      "Architectural design",
      "Interior detailing",
      "Landscape strategy"
    ],
    collaborators: ["Ada Viera — Landscape", "Studio Nueve — Lighting"],
    gallery: [
      { image: projectHorizon, caption: "Main salon view to reflecting pool" },
      { image: projectAtelier, caption: "Garden pavilion with diffused skylight" },
      { image: projectAtrium, caption: "Private suite overlooking the courtyard" }
    ]
  },
  {
    slug: "cascade-cultural-pavilion",
    title: "Cascade Cultural Pavilion",
    category: "Public",
    location: "Seoul, South Korea",
    year: "2024",
    heroImage: projectCascade,
    heroCaption: "Filtered daylight entering the cascading atrium gallery.",
    excerpt:
      "An urban cultural node shaped by cascading plateaus that host performance, exhibition, and civic gathering above the Cheonggyecheon stream.",
    description: [
      "Working with the rhythm of the stream below, the pavilion terraces ebb and flow, creating public plazas at multiple levels. A translucent canopy filters daylight while providing shelter from summer rains.",
      "Structural cores were minimized to open sight lines between interior halls and exterior terraces. Acoustic fins and timber grids blur the boundary between stage and audience."
    ],
    meta: [
      { label: "Location", value: "Seoul, South Korea" },
      { label: "Year", value: "2024" },
      { label: "Scope", value: "Public Pavilion" },
      { label: "Status", value: "Completed" }
    ],
    services: [
      "Urban strategy",
      "Architectural design",
      "Wayfinding system",
      "Lighting design"
    ],
    collaborators: ["Studio Mireu — Graphic Design", "Han River Engineers"],
    gallery: [
      { image: projectCascade, caption: "Upper terrace overlooking the stream" },
      { image: projectTidal, caption: "Main atrium used for evening performances" },
      { image: projectAtelier, caption: "Diffuse stair linking the plateaus" }
    ]
  },
  {
    slug: "atrium-wellness-retreat",
    title: "Atrium Wellness Retreat",
    category: "Hospitality",
    location: "Queenstown, New Zealand",
    year: "2024",
    heroImage: projectAtrium,
    heroCaption: "North-facing atrium drawing alpine light into the lounge.",
    excerpt:
      "A mountainside sanctuary that choreographs movement around a central atrium, balancing geothermal bathing with contemplative lounges.",
    description: [
      "The retreat embraces geothermal energy to supply both the bathing circuits and radiant floor systems. Timber ribs trace the atrium, guiding visitors through warm and cold experiences.",
      "Materials are restrained—oiled cedar, honed granite, and acoustic felt—allowing the surrounding landscape to set the tonal palette. Glazed corners dissolve the boundary between interior lounge and alpine slopes."
    ],
    meta: [
      { label: "Location", value: "Queenstown, New Zealand" },
      { label: "Year", value: "2024" },
      { label: "Scope", value: "Wellness Retreat" },
      { label: "Status", value: "In Construction" }
    ],
    services: [
      "Masterplanning",
      "Environmental analysis",
      "Interior design",
      "Furniture curation"
    ],
    collaborators: ["Terra Studio — Landscape", "Atlas Engineering"],
    gallery: [
      { image: projectAtrium, caption: "Atrium lounge with geothermal pools" },
      { image: projectHorizon, caption: "Guest suite framing alpine ridge" },
      { image: projectTidal, caption: "Evening view of the bathing deck" },
      { image: projectAtelier, caption: "Garden pavilion filtering northern light" },
      { image: projectCascade, caption: "Layered stair linking terraces" },
      { image: heroImage, caption: "Textured lounge corridor" },
      { image: projectAtelier, caption: "Reading loft overlooking the atrium" },
      { image: projectHorizon, caption: "Warm cedar sauna lounge" }
    ]
  },
  {
    slug: "tidal-research-center",
    title: "Tidal Research Center",
    category: "Institutional",
    location: "Reykjanes, Iceland",
    year: "2023",
    heroImage: projectTidal,
    heroCaption: "Observation deck framing tidal movements and aurora skies.",
    excerpt:
      "An interdisciplinary research facility studying tidal energy, anchored by a resilient concrete shell that stages the Atlantic horizon.",
    description: [
      "Sited on a rugged lava field, the center is lifted on deep piles to respect tidal shifts. The shell protects labs from harsh winds while clerestory slots introduce controlled daylight.",
      "A public promenade threads around the labs, offering educational exhibits and panoramic observation decks. Energy systems are exposed to make research visible."
    ],
    meta: [
      { label: "Location", value: "Reykjanes, Iceland" },
      { label: "Year", value: "2023" },
      { label: "Scope", value: "Research Campus" },
      { label: "Status", value: "Completed" }
    ],
    services: [
      "Campus planning",
      "Architectural design",
      "Sustainability consultancy",
      "Exhibition design"
    ],
    collaborators: ["North Shore Labs", "Aurora Lighting Collective"],
    gallery: [
      { image: projectTidal, caption: "Tidal observation deck at dusk" },
      { image: projectCascade, caption: "Gallery explaining energy capture" },
      { image: projectAtrium, caption: "Collaborative research lounge" }
    ]
  },
  {
    slug: "atelier-lumi-foyer",
    title: "Atelier Lumi Foyer",
    category: "Cultural",
    location: "Oslo, Norway",
    year: "2023",
    heroImage: projectAtelier,
    heroCaption: "Foyer softly illuminated for an evening installation.",
    excerpt:
      "A gallery foyer reimagined as a luminous threshold with suspended scrim layers catching Nordic light through the seasons.",
    description: [
      "The foyer employs layered scrims and mirrored bands to multiply ambient light, creating a fluid transition between city street and exhibition halls.",
      "Custom furniture pieces provide flexible seating clusters, while subtle projections animate surfaces during evening programming."
    ],
    meta: [
      { label: "Location", value: "Oslo, Norway" },
      { label: "Year", value: "2023" },
      { label: "Scope", value: "Cultural Interior" },
      { label: "Status", value: "Completed" }
    ],
    services: [
      "Interior architecture",
      "Lighting design",
      "Furniture design",
      "Art integration"
    ],
    collaborators: ["Lys Studio — Lighting", "Fjord Fabrication"],
    gallery: [
      { image: projectAtelier, caption: "Evening foyer with immersive lighting" },
      { image: heroImage, caption: "Detail of custom scrim partitions" },
      { image: projectHorizon, caption: "Workshop space connected to gallery" }
    ]
  }
];

export const getProjectBySlug = (slug: string) =>
  projects.find((project) => project.slug === slug);

