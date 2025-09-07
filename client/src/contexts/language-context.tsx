import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Translation dictionaries
const translations = {
  en: {
    // Common
    "common.dashboard": "Dashboard",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.view": "View",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.refresh": "Refresh",
    "common.loading": "Loading",
    "common.error": "Error",
    "common.success": "Success",
    "common.total": "Total",
    "common.pending": "Pending",
    "common.completed": "Completed",
    "common.active": "Active",
    "common.inactive": "Inactive",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.submit_results": "Submit Results",
    "nav.complaints": "Complaints",
    "nav.mec_results": "MEC Results",
    "nav.internal_results": "Internal Results",
    "nav.results_comparison": "Results Comparison",
    "nav.verify_results": "Verify Results",
    "nav.review_flagged": "Review Flagged",
    "nav.reports": "Reports",
    "nav.user_management": "User Management",
    "nav.political_parties": "Political Parties",
    "nav.data_management": "Data Management",
    "nav.admin_management": "Admin Management",
    "nav.audit_trail": "Audit Trail",
    "nav.profile": "Profile",

    // Dashboard
    "dashboard.title": "Real-Time Election Center",
    "dashboard.subtitle":
      "Live monitoring and analytics for election results and complaints",
    "dashboard.results_overview": "Election Results Overview",
    "dashboard.total_centers": "Total Centers",
    "dashboard.results_received": "Results Received",
    "dashboard.verified_results": "Verified Results",
    "dashboard.flagged_results": "Flagged Results",

    // Complaints
    "complaints.title": "Election Complaints System",
    "complaints.subtitle":
      "Monitor and manage election-related complaints and irregularities",
    "complaints.submit_complaint": "Submit Complaint",
    "complaints.total_complaints": "Total Complaints",
    "complaints.pending_review": "Pending Review",
    "complaints.resolved": "Resolved",
    "complaints.urgent": "Urgent",
    "complaints.complaint_details": "Complaint Details",
    "complaints.no_complaints": "No complaints found",
    "complaints.search_placeholder": "Search complaints...",

    // MEC Results
    "mec.title": "MEC Official Results",
    "mec.subtitle":
      "Record and manage results received from Malawi Electoral Commission (MEC)",
    "mec.record_result": "Record MEC Result",
    "mec.total_results": "Total MEC Results",
    "mec.presidential": "Presidential",
    "mec.mp_results": "MP Results",
    "mec.councilor": "Councilor",
    "mec.reference_number": "MEC Reference Number",
    "mec.official_name": "MEC Official Name",
    "mec.date_received": "Date Received",

    // Results Comparison
    "comparison.title": "Results Comparison",
    "comparison.subtitle":
      "Compare internal results with official MEC results to identify discrepancies",
    "comparison.total_comparisons": "Total Comparisons",
    "comparison.perfect_matches": "Perfect Matches",
    "comparison.minor_differences": "Minor Differences",
    "comparison.major_differences": "Major Differences",
    "comparison.missing_internal": "Missing Internal",
    "comparison.missing_mec": "Missing MEC",

    // Forms
    "form.constituency": "Constituency",
    "form.polling_center": "Polling Center",
    "form.category": "Category",
    "form.candidate_name": "Candidate Name",
    "form.party_name": "Party Name",
    "form.votes": "Votes",
    "form.total_votes": "Total Votes",
    "form.invalid_votes": "Invalid Votes",
    "form.notes": "Notes",

    // Election Categories
    "category.president": "President",
    "category.mp": "MP",
    "category.councilor": "Councilor",

    // User Roles
    "role.agent": "Agent",
    "role.supervisor": "Supervisor",
    "role.admin": "Admin",
    "role.reviewer": "Reviewer",
    "role.president": "President",
    "role.mp": "MP",

    // Status
    "status.match": "Match",
    "status.minor_diff": "Minor Diff",
    "status.major_diff": "Major Diff",
    "status.under_review": "Under Review",
    "status.dismissed": "Dismissed",

    // Messages
    "message.no_data": "No data available",
    "message.loading_data": "Loading data...",
    "message.error_loading": "Error loading data",
    "message.success_submit": "Successfully submitted",
    "message.error_submit": "Error submitting data",

    // Landing Page
    "landing.title": "Parallel Tally Center",
    "landing.subtitle": "Secure Election Management System", 
    "landing.feature_security": "Secure result collection and verification",
    "landing.feature_realtime": "Real-time dashboard and analytics",
    "landing.feature_access": "Multi-role access control",
    "landing.sign_in": "Sign In to Continue",
    "landing.authorized_only": "Authorized personnel only. All activities are logged and monitored.",
    "landing.monitoring_title": "Transparent Election Monitoring",
    "landing.monitoring_description": "Collect, verify, and tally election results with confidence. Real-time data collection from field agents, comprehensive verification workflows, and secure audit trails ensure election integrity.",

    // 404 Page
    "error.page_not_found": "404 Page Not Found",
    "error.page_not_found_description": "Did you forget to add the page to the router?",

    // UI Components
    "ui.close": "Close",
    "ui.previous": "Previous", 
    "ui.next": "Next",
    "ui.more_pages": "More pages",
    "ui.more": "More",
  },
  ny: {
    // Chichewa translations
    // Common
    "common.dashboard": "Dashboodi",
    "common.submit": "Tumiza",
    "common.cancel": "Leka",
    "common.save": "Sunga",
    "common.edit": "Kusintha",
    "common.delete": "Fufutani",
    "common.view": "Onani",
    "common.search": "Funafuna",
    "common.filter": "Sankhani",
    "common.export": "Tulutsani",
    "common.refresh": "Konzanso",
    "common.loading": "Kukweza",
    "common.error": "Cholakwika",
    "common.success": "Zatheka",
    "common.total": "Zonse",
    "common.pending": "Zikuyembekezera",
    "common.completed": "Zamaliza",
    "common.active": "Zikugwira ntchito",
    "common.inactive": "Sizikugwira ntchito",

    // Navigation
    "nav.dashboard": "Dashboodi",
    "nav.submit_results": "Tumiza Zotsatira",
    "nav.complaints": "Madandaulo",
    "nav.mec_results": "Zotsatira za MEC",
    "nav.internal_results": "Zotsatira za Mkati",
    "nav.results_comparison": "Kufananiza Zotsatira",
    "nav.verify_results": "Tsimikiza Zotsatira",
    "nav.review_flagged": "Yang'ana Zolemba",
    "nav.reports": "Malipoti",
    "nav.user_management": "Ndondomeko ya Ogwiritsa",
    "nav.political_parties": "Zipani za Ndale",
    "nav.data_management": "Ndondomeko ya Zidziwa",
    "nav.admin_management": "Ndondomeko ya Admin",
    "nav.audit_trail": "Kusanthula",
    "nav.profile": "Mbiri yanu",

    // Dashboard
    "dashboard.title": "Malo Owerengera za chisankho",
    "dashboard.subtitle":
      "Kuyang'anira ndi kusanthula kwa zotsatira za chisankho ndi madandaulo",
    "dashboard.results_overview": "Chidule cha Zotsatira za Chisankho",
    "dashboard.total_centers": "Malo Onse",
    "dashboard.results_received": "Zotsatira Zolandidwa",
    "dashboard.verified_results": "Zotsatira Zotsimikizika",
    "dashboard.flagged_results": "Zotsatira Zolembedwa",

    // Complaints
    "complaints.title": "Dongosolo la Madandaulo a Chisankho",
    "complaints.subtitle":
      "Yang'anitsani ndi kasamalidwe ka madandaulo okhudzana ndi chisankho ndi zosayenera",
    "complaints.submit_complaint": "Tumiza Dandaulo",
    "complaints.total_complaints": "Madandaulo Onse",
    "complaints.pending_review": "Zikuyembekezera Kuyang'ana",
    "complaints.resolved": "Zathetsedwa",
    "complaints.urgent": "Zachangu",
    "complaints.complaint_details": "Tsatanetsatane wa Dandaulo",
    "complaints.no_complaints": "Palibe madandaulo opezeka",
    "complaints.search_placeholder": "Funafuna madandaulo...",

    // MEC Results
    "mec.title": "Zotsatira Zovomerezeka za MEC",
    "mec.subtitle":
      "Lembani ndi kasamalidwe ka zotsatira zolandira kuchokera ku Malawi Electoral Commission (MEC)",
    "mec.record_result": "Lemba Zotsatira za MEC",
    "mec.total_results": "Zotsatira Zonse za MEC",
    "mec.presidential": "Za Pulezidenti",
    "mec.mp_results": "Zotsatira za MP",
    "mec.councilor": "Wa Khansala",
    "mec.reference_number": "Nambala ya MEC",
    "mec.official_name": "Dzina la Mkulu wa MEC",
    "mec.date_received": "Tsiku Lolandira",

    // Results Comparison
    "comparison.title": "Kufananiza Zotsatira",
    "comparison.subtitle":
      "Fananizirani zotsatira zamkati ndi zotsatira zovomerezeka za MEC kuti muzindikire kusiyana",
    "comparison.total_comparisons": "Kufananiza Konse",
    "comparison.perfect_matches": "Kufanana Kwangwiro",
    "comparison.minor_differences": "Kusiyana Kochepa",
    "comparison.major_differences": "Kusiyana Kwakukulu",
    "comparison.missing_internal": "Kusowa Zamkati",
    "comparison.missing_mec": "Kusowa za MEC",

    // Forms
    "form.constituency": "Dera la Chisankho",
    "form.polling_center": "Malo a Chisankho",
    "form.category": "Mtundu",
    "form.candidate_name": "Dzina la Wopikisana",
    "form.party_name": "Dzina la Chipani",
    "form.votes": "Mavoti",
    "form.total_votes": "Mavoti Onse",
    "form.invalid_votes": "Mavoti Osavomerezeka",
    "form.notes": "Zolemba",

    // Election Categories
    "category.president": "Pulezidenti",
    "category.mp": "Mphungu",
    "category.councilor": "Wa Khansala",

    // User Roles
    "role.agent": "Wotumidwa",
    "role.supervisor": "Woyang'anira",
    "role.admin": "Wolamulira",
    "role.reviewer": "Wowunika",
    "role.president": "Pulezidenti",
    "role.mp": "Mphungu",

    // Status
    "status.match": "Zikufanana",
    "status.minor_diff": "Kusiyana Kochepa",
    "status.major_diff": "Kusiyana Kwakukulu",
    "status.under_review": "Zikuyang'anidwa",
    "status.dismissed": "Zachotsedwa",

    // Messages
    "message.no_data": "Palibe zidziwa zilipo",
    "message.loading_data": "Zikukweza zidziwa...",
    "message.error_loading": "Cholakwika pakukweza zidziwa",
    "message.success_submit": "Zatumizidwa bwino",
    "message.error_submit": "Cholakwika pakutumiza zidziwa",

    // Landing Page
    "landing.title": "Malo Owerengera Mozungulira",
    "landing.subtitle": "Dongosolo Loteteza la Kasamalidwe ka Chisankho",
    "landing.feature_security": "Kusonkhanitsa kotetezeka ndi kutsimikiza zotsatira",
    "landing.feature_realtime": "Dashboodi ya nthawi yeniyeni ndi kusanthula",
    "landing.feature_access": "Kuyang'anira maudindo osiyanasiyana",
    "landing.sign_in": "Lowani kuti Mupitirize",
    "landing.authorized_only": "Anthu ovomerezeka okha. Zochita zonse zimazolemba ndipo zimawunikidwa.",
    "landing.monitoring_title": "Kuyang'anira Chisankho Mowonekeratu",
    "landing.monitoring_description": "Sonkhanitsani, simbani, ndi werengani zotsatira za chisankho modzidalira. Kusonkhanitsa zidziwa nthawi yeniyeni kuchokera kwa otumidwa, njira zokwanira zowunika, ndi njira zoteteza zimatsimikizira chilungamo cha chisankho.",

    // 404 Page
    "error.page_not_found": "404 Tsamba Sinapezeke",
    "error.page_not_found_description": "Kodi munayiwala kuwonjezera tsambali ku router?",

    // UI Components
    "ui.close": "Tseka",
    "ui.previous": "Yakale",
    "ui.next": "Yotsatira",
    "ui.more_pages": "Masamba ochuluka",
    "ui.more": "Zambiri",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to English
    return localStorage.getItem("election_system_language") || "en";
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem("election_system_language", language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    const translation = translations[language as keyof typeof translations];
    if (!translation) return key;

    const value = translation[key as keyof typeof translation];
    return value || key; // Return key if translation not found
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
