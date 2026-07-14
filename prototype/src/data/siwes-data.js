/* SIWES / Industrial Training (IT): data model. Level-gated (400L). */
(function () {
  const SIWES_STATES = {
    none: { label: "Not started", tone: "neutral" },
    proposed: { label: "Awaiting department approval", tone: "warning" },
    rejected: { label: "Proposal rejected", tone: "danger" },
    approved: { label: "Approved: placement confirmed", tone: "success" },
    ongoing: { label: "Ongoing", tone: "accent" },
    completed: { label: "Completed", tone: "success" },
  };

  const SAMPLE_COMPANIES = [
    { name: "Zenith Systems Ltd.", address: "12 Adeola Odeku St, Victoria Island, Lagos", industry: "Software Engineering" },
    { name: "NNPC ICT Directorate", address: "NNPC Towers, Herbert Macaulay Way, Abuja", industry: "Information Technology" },
    { name: "Interswitch Group", address: "Plot 1648, Oko-Awo Close, Victoria Island, Lagos", industry: "Fintech" },
    { name: "Dangote Industries: IT Dept.", address: "Union Marble House, Falomo, Lagos", industry: "Enterprise IT" },
  ];

  // demo placement site coordinate + a "you are here" simulated coordinate
  const PLACEMENT_COORD = { lat: 6.4281, lng: 3.4219 }; // Victoria Island, Lagos

  window.SIWES_DATA = { SIWES_STATES, SAMPLE_COMPANIES, PLACEMENT_COORD };
})();
