/**
 * Demo data for demo mode (when SARVAM_API_KEY is missing or ?demo=1)
 */

export const DEMO_TRANSCRIPT =
  "Kal hamari meeting mein decide hua ki project ka launch date 15 December hogi. Rahul sales deck prepare karega aur uska deadline 10 December hai. Priya ko client ko email bhejni hai ek hafte mein. Ek open question tha ki budget approval kab hogi - finance team se poochna hai.";

export const DEMO_NOTES = {
  title: "Project Launch Planning Meeting",
  summary:
    "The meeting resolved key decisions for the upcoming product launch set for December 15. Task ownership and deadlines were assigned to Rahul and Priya, with one open budgetary question remaining.",
  keyPoints: [
    "Project launch date confirmed as December 15",
    "Sales deck preparation assigned to Rahul with a December 10 deadline",
    "Client email communication assigned to Priya within one week",
    "Budget approval timeline remains unclear",
  ],
  decisions: [
    "Launch date fixed: December 15",
    "Rahul to own the sales deck",
    "Priya to handle client communication",
  ],
  actionItems: [
    { task: "Prepare sales deck", owner: "Rahul", due: "December 10" },
    { task: "Send email to client", owner: "Priya", due: "Within one week" },
    {
      task: "Follow up on budget approval with finance team",
      owner: null,
      due: null,
    },
  ],
  openQuestions: ["When will the budget approval come from the finance team?"],
};

export const DEMO_LETTER = {
  subject: "Request for Leave of Absence",
  salutation: "Dear [Manager's Name],",
  body: "I am writing to formally request a leave of absence from [Start Date] to [End Date] due to personal reasons.\n\nI have ensured that all pending tasks will be completed before my departure, and I am happy to brief a colleague to handle any urgent matters during my absence.\n\nI would be grateful if you could approve this leave at your earliest convenience.\n\nThank you for your understanding and support.",
  closing: "Yours sincerely,\n[Your Name]\n[Your Designation]\n[Your Contact Number]",
  placeholders: [
    "[Manager's Name]",
    "[Start Date]",
    "[End Date]",
    "[Your Name]",
    "[Your Designation]",
    "[Your Contact Number]",
  ],
};

export const DEMO_TRANSLATED = "यह एक परीक्षण अनुवाद है। वास्तविक अनुवाद के लिए अपनी Sarvam API key जोड़ें।";

export const DEMO_LANGUAGE_CODE = "hi-IN";
