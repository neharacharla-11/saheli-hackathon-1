export interface PlanField {
  id: string;
  label: string;
  type: "text" | "long" | "multi" | "single";
  options?: string[];
  placeholder?: string;
}

export interface PlanSection {
  id: string;
  title: string;
  fields: PlanField[];
}

export const BIRTH_PLAN: PlanSection[] = [
  {
    id: "about",
    title: "About me",
    fields: [
      { id: "name", label: "My name", type: "text" },
      { id: "hospital", label: "Where I plan to give birth", type: "text", placeholder: "Hospital or birth centre" },
      { id: "doctor", label: "My doctor or midwife", type: "text" },
      { id: "partner", label: "My birth partner", type: "text", placeholder: "Who will be with me" },
      { id: "calm", label: "What helps me feel calm", type: "long", placeholder: "Music, prayer, holding hands, being told what's happening" },
    ],
  },
  {
    id: "labour",
    title: "During labour",
    fields: [
      {
        id: "pain",
        label: "For pain, I'd like to try",
        type: "multi",
        options: ["Breathing and moving", "Warm water or a shower", "Massage", "Gas and air", "Epidural", "I'll decide on the day"],
      },
      {
        id: "movement",
        label: "Moving and positions",
        type: "multi",
        options: ["Walk and change positions", "Birthing ball", "Upright for the birth", "Whatever feels right"],
      },
      {
        id: "room",
        label: "The room",
        type: "multi",
        options: ["Dim lights", "My own music", "Quiet voices", "As few people as possible"],
      },
    ],
  },
  {
    id: "caesarean",
    title: "If I need a caesarean",
    fields: [
      {
        id: "csection",
        label: "I'd like",
        type: "multi",
        options: ["My birth partner with me", "The screen lowered to see baby born", "Skin-to-skin in theatre if possible", "Each step explained to me", "My own music"],
      },
    ],
  },
  {
    id: "after",
    title: "After birth",
    fields: [
      {
        id: "afterBirth",
        label: "Straight after",
        type: "multi",
        options: ["Skin-to-skin straight away", "Delayed cord clamping", "My partner cuts the cord", "Vitamin K for baby", "Baby stays with me"],
      },
      { id: "feeding", label: "Feeding", type: "single", options: ["Breastfeeding", "Formula", "Both", "I'll decide later"] },
    ],
  },
  {
    id: "else",
    title: "Anything else",
    fields: [{ id: "notes", label: "Anything else my care team should know", type: "long", placeholder: "Allergies, fears, religious or cultural wishes" }],
  },
];
