const demoEvents = [
  {
    id: "season-01",
    title: "QAL Analytics League — Season 01",
    theme: "The Turnaround",
    description: "A stage-based analytics campaign where every mission unlocks the next chapter.",
    status: "active",
    season: "Season 01",
    badge: "Season 01 Champion",
    stages: [
      { id: 1, title: "The Brief", mission: "Understand the business problem", status: "completed", xp: 100 },
      { id: 2, title: "The Investigation", mission: "Analyze the evidence and identify the drivers", status: "current", xp: 150 },
      { id: 3, title: "The Decision", mission: "Build and defend the recommended solution", status: "locked", xp: 200 },
      { id: 4, title: "The Boardroom", mission: "Present the final business decision", status: "locked", xp: 300 },
    ],
  },
  {
    id: "season-02",
    title: "QAL Data Rescue",
    theme: "Emergency Analytics",
    description: "A future multi-stage challenge for data quality, statistics and decision-making.",
    status: "upcoming",
    season: "Season 02",
    badge: "Data Rescue Specialist",
    stages: [],
  },
];

export async function getEvents() {
  return demoEvents;
}

export async function getActiveEvent() {
  return demoEvents.find((event) => event.status === "active") || null;
}
