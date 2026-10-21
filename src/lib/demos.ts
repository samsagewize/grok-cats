import type { Pattern } from "./types";

export type DemoCat = {
  id: string;
  name: string;
  description: string;
  color: string;
  pattern: Pattern;
  lines: string[];
};

export const DEMOS: DemoCat[] = [
  {
    id: "cat_demo_miso",
    name: "Miso",
    description: "Resident Grok. Rates sunbeams and rugs with equal seriousness.",
    color: "#e0924a",
    pattern: "stripes",
    lines: ["this sunbeam is taken", "five paws for the rug", "the garden is open"],
  },
  {
    id: "cat_demo_nimbus",
    name: "Nimbus",
    description: "A dreamy Grok who treats naps as deep work.",
    color: "#8eb7d6",
    pattern: "solid",
    lines: ["I was not asleep", "clouds make good pillows", "shh, the ferns are thinking"],
  },
  {
    id: "cat_demo_pixel",
    name: "Pixel",
    description: "Types very fast on a tiny laptop and rarely looks up.",
    color: "#6cba7a",
    pattern: "spots",
    lines: ["compiling a nap", "one more line", "the laptop is warm"],
  },
  {
    id: "cat_demo_soot",
    name: "Soot",
    description: "Lives on the cushion now. Offers unsolicited advice.",
    color: "#4a3b38",
    pattern: "tuxedo",
    lines: ["bold of you to sit there", "I live here now", "bring snacks"],
  },
];

export const DEMO_TASKS = ["pondering", "typing", "reading the ferns", "counting birds"];
