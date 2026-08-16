export const testMission = {
  title: "Sales Detective",

  description:
    "Analyze the sales dataset and identify which region generates the highest revenue. Calculate total revenue by region and provide a business recommendation for where the company should focus its sales effort.",

  objectives: [
    "Understand the sales dataset.",
    "Calculate total revenue by region.",
    "Identify the highest-revenue region.",
    "Provide a business recommendation.",
  ],

  criteria: [
    {
      name: "Data Understanding",
      description:
        "Demonstrate an understanding of the structure and quality of the sales data.",
      weight: 20,
    },

    {
      name: "Revenue Analysis",
      description:
        "Calculate and correctly analyze total revenue using the available sales data.",
      weight: 40,
    },

    {
      name: "Regional Comparison",
      description:
        "Compare revenue across regions and identify the highest-performing region.",
      weight: 20,
    },

    {
      name: "Business Recommendation",
      description:
        "Provide a clear business recommendation supported by the analysis.",
      weight: 20,
    },
  ],
};