/**
 * Standard Omnichannel KPIs for Pharmaceutical / Life Sciences Commercial Operations
 * Focus: HCP (Healthcare Professional) Engagement Tracking
 *
 * Sources:
 * - Veeva Pulse Field Trends Reports
 * - ON24 Life Sciences Digital Engagement Benchmarks 2024/2025
 * - Salesforce Marketing Cloud Email Benchmarks
 * - Cvent Life Sciences Event Management
 * - IQVIA Congress Impact Measurement
 * - IntuitionLabs HCP Engagement Tracking Guide
 * - Phamax Digital Benchmarks for Pharma 2024
 */

export const CHANNEL_KPIS = {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EMAIL / RTE  (Remote Trigger Events / Approved Email / Marketing Email)
  // ─────────────────────────────────────────────────────────────────────────────
  "Email": [
    {
      "name": "Delivery Rate",
      "calculation": "(Emails Delivered / Emails Sent) × 100",
      "sources": ["Veeva CRM", "Salesforce Marketing Cloud", "Marketo"],
      "type": "reach",
      "field": "Email.DeliveryRate"
    },
    {
      "name": "Open Rate",
      "calculation": "(Unique Opens / Emails Delivered) × 100",
      "sources": ["Salesforce Marketing Cloud", "Marketo", "Veeva CRM"],
      "type": "reach",
      "field": "Email.OpenRate"
    },
    {
      "name": "Click-Through Rate (CTR)",
      "calculation": "(Total Unique Clicks / Emails Delivered) × 100",
      "sources": ["Salesforce Marketing Cloud", "Marketo", "Veeva CRM"],
      "type": "engagement",
      "field": "Email.CTR"
    },
    {
      "name": "Click-to-Open Rate (CTOR)",
      "calculation": "(Unique Clicks / Unique Opens) × 100",
      "sources": ["Salesforce Marketing Cloud", "Marketo"],
      "type": "engagement",
      "field": "Email.CTOR"
    },
    {
      "name": "Bounce Rate",
      "calculation": "(Bounced Emails / Emails Sent) × 100",
      "sources": ["Salesforce Marketing Cloud", "Veeva CRM", "Marketo"],
      "type": "reach",
      "field": "Email.BounceRate"
    },
    {
      "name": "Unsubscribe Rate",
      "calculation": "(Unsubscribes / Emails Delivered) × 100",
      "sources": ["Salesforce Marketing Cloud", "Veeva CRM", "Marketo"],
      "type": "engagement",
      "field": "Email.UnsubscribeRate"
    },
    {
      "name": "Conversion Rate (Content Action)",
      "calculation": "(HCPs Who Completed Target Action / Emails Delivered) × 100",
      "sources": ["Salesforce Marketing Cloud", "Google Analytics", "Veeva CRM"],
      "type": "engagement",
      "field": "Email.ConversionRate"
    },
    {
      "name": "HCP Reach (Unique Recipients)",
      "calculation": "COUNT(DISTINCT HCP_ID) WHERE Email Delivered = TRUE",
      "sources": ["Veeva CRM", "Salesforce Marketing Cloud"],
      "type": "reach",
      "field": "Email.UniqueHCPReach"
    },
    {
      "name": "Approved Email Send Rate (VAE)",
      "calculation": "(Veeva Approved Emails Sent by Rep / Total Email Touchpoints) × 100",
      "sources": ["Veeva CRM"],
      "type": "reach",
      "field": "Email.ApprovedEmailSendRate"
    },
    {
      "name": "Email Opt-In Rate",
      "calculation": "(HCPs with Active Email Consent / Total HCPs in Universe) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "Email.OptInRate"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CALL  (Field Force Calls / Rep Visits — remote phone/video calls)
  // ─────────────────────────────────────────────────────────────────────────────
  "Call": [
    {
      "name": "Call Reach",
      "calculation": "COUNT(DISTINCT HCP_ID) with ≥1 Call Recorded in Period",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "Call.Reach"
    },
    {
      "name": "Call Frequency",
      "calculation": "Total Calls Completed / COUNT(DISTINCT HCP_ID) in Period",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "Call.Frequency"
    },
    {
      "name": "Call Completion Rate",
      "calculation": "(Calls Completed / Calls Attempted) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "Call.CompletionRate"
    },
    {
      "name": "Average Call Duration",
      "calculation": "SUM(Call Duration in Minutes) / COUNT(Completed Calls)",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "Call.AvgDuration"
    },
    {
      "name": "Share of Voice (SOV)",
      "calculation": "(Brand Calls to HCP / Total Pharma Calls to HCP) × 100",
      "sources": ["Veeva CRM", "IQVIA", "APLD Data"],
      "type": "reach",
      "field": "Call.ShareOfVoice"
    },
    {
      "name": "CLM Content Engagement Rate",
      "calculation": "(Calls with ≥1 CLM Slide Presented / Total Completed Calls) × 100",
      "sources": ["Veeva CRM", "Veeva CLM"],
      "type": "engagement",
      "field": "Call.CLMEngagementRate"
    },
    {
      "name": "Average Slides Presented per Call",
      "calculation": "SUM(CLM Slides Shown) / COUNT(Calls with CLM)",
      "sources": ["Veeva CRM", "Veeva CLM"],
      "type": "engagement",
      "field": "Call.AvgSlidesPerCall"
    },
    {
      "name": "Next Best Action (NBA) Compliance Rate",
      "calculation": "(Calls Where NBA was Followed / Total Calls with NBA Suggestion) × 100",
      "sources": ["Veeva CRM", "Salesforce Einstein"],
      "type": "engagement",
      "field": "Call.NBAComplianceRate"
    },
    {
      "name": "Target HCP Coverage Rate",
      "calculation": "(Distinct Target HCPs Called / Total Target HCPs in Territory) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "Call.TargetCoverageRate"
    },
    {
      "name": "Sample / Leave-Behind Rate",
      "calculation": "(Calls with Sample or Collateral Delivered / Total Completed Calls) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "Call.SampleLeaveRate"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. WEBINAR  (Virtual medical education / promotional webinars for HCPs)
  // ─────────────────────────────────────────────────────────────────────────────
  "Webinar": [
    {
      "name": "Registration Rate",
      "calculation": "(HCPs Registered / HCPs Invited) × 100",
      "sources": ["ON24", "Zoom Webinars", "Marketo", "Salesforce Marketing Cloud"],
      "type": "reach",
      "field": "Webinar.RegistrationRate"
    },
    {
      "name": "Attendance Rate (Show Rate)",
      "calculation": "(HCPs Attended Live / HCPs Registered) × 100",
      "sources": ["ON24", "Zoom Webinars", "Veeva CRM"],
      "type": "reach",
      "field": "Webinar.AttendanceRate"
    },
    {
      "name": "Average Attendance Duration",
      "calculation": "SUM(Minutes Attended per HCP) / COUNT(Attendees)",
      "sources": ["ON24", "Zoom Webinars"],
      "type": "engagement",
      "field": "Webinar.AvgAttendanceDuration"
    },
    {
      "name": "Engagement Score",
      "calculation": "Weighted SUM(Poll Responses + Q&A Submissions + Resource Downloads + Chat Activity) / Attendees",
      "sources": ["ON24", "Zoom Webinars"],
      "type": "engagement",
      "field": "Webinar.EngagementScore"
    },
    {
      "name": "Poll Participation Rate",
      "calculation": "(Attendees Who Responded to ≥1 Poll / Total Attendees) × 100",
      "sources": ["ON24", "Zoom Webinars"],
      "type": "engagement",
      "field": "Webinar.PollParticipationRate"
    },
    {
      "name": "Q&A Participation Rate",
      "calculation": "(Attendees Who Submitted ≥1 Question / Total Attendees) × 100",
      "sources": ["ON24", "Zoom Webinars"],
      "type": "engagement",
      "field": "Webinar.QAParticipationRate"
    },
    {
      "name": "On-Demand View Rate",
      "calculation": "(HCPs Who Accessed On-Demand Recording / Total Registrants) × 100",
      "sources": ["ON24", "Veeva Vault", "Zoom Webinars"],
      "type": "engagement",
      "field": "Webinar.OnDemandViewRate"
    },
    {
      "name": "Resource Download Rate",
      "calculation": "(Attendees Who Downloaded ≥1 Resource / Total Attendees) × 100",
      "sources": ["ON24", "Veeva Vault"],
      "type": "engagement",
      "field": "Webinar.ResourceDownloadRate"
    },
    {
      "name": "Post-Webinar Survey Completion Rate",
      "calculation": "(Survey Responses Received / Total Attendees) × 100",
      "sources": ["ON24", "Zoom Webinars", "Salesforce"],
      "type": "engagement",
      "field": "Webinar.SurveyCompletionRate"
    },
    {
      "name": "Net Promoter Score (NPS)",
      "calculation": "% Promoters (score 9–10) − % Detractors (score 0–6) from post-webinar survey",
      "sources": ["ON24", "Salesforce", "Qualtrics"],
      "type": "engagement",
      "field": "Webinar.NPS"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. EVENTS  (Standalone pharma-organised congresses, symposia, dinner meetings)
  // ─────────────────────────────────────────────────────────────────────────────
  "Events": [
    {
      "name": "Invitation-to-Registration Rate",
      "calculation": "(HCPs Registered / HCPs Invited) × 100",
      "sources": ["Cvent", "Salesforce", "Veeva CRM"],
      "type": "reach",
      "field": "Events.InviteToRegRate"
    },
    {
      "name": "Registration-to-Attendance Rate (Activation Rate)",
      "calculation": "(HCPs Attended / HCPs Registered) × 100",
      "sources": ["Cvent", "Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "Events.ActivationRate"
    },
    {
      "name": "HCP Unique Attendance",
      "calculation": "COUNT(DISTINCT HCP_ID) with Check-In Confirmed",
      "sources": ["Cvent", "Veeva CRM", "SAP Concur"],
      "type": "reach",
      "field": "Events.UniqueAttendance"
    },
    {
      "name": "Session Engagement Rate",
      "calculation": "(Attendees Who Participated in ≥1 Interactive Session / Total Attendees) × 100",
      "sources": ["Cvent", "Slido", "ON24"],
      "type": "engagement",
      "field": "Events.SessionEngagementRate"
    },
    {
      "name": "Average Session Attendance Rate",
      "calculation": "SUM(Attendees per Session) / COUNT(Sessions) / Total Registered × 100",
      "sources": ["Cvent", "Veeva CRM"],
      "type": "engagement",
      "field": "Events.AvgSessionAttendanceRate"
    },
    {
      "name": "Content Download / Material Request Rate",
      "calculation": "(Attendees Requesting or Scanning QR for Content / Total Attendees) × 100",
      "sources": ["Cvent", "Veeva Vault", "Salesforce"],
      "type": "engagement",
      "field": "Events.ContentRequestRate"
    },
    {
      "name": "1:1 Meeting Booking Rate",
      "calculation": "(HCPs Who Booked a 1:1 Rep or MSL Meeting / Total Attendees) × 100",
      "sources": ["Cvent", "Veeva CRM", "Calendly"],
      "type": "engagement",
      "field": "Events.OneToOneMeetingRate"
    },
    {
      "name": "Post-Event Survey Completion Rate",
      "calculation": "(Surveys Completed / Total Attendees) × 100",
      "sources": ["Cvent", "Qualtrics", "Salesforce"],
      "type": "engagement",
      "field": "Events.SurveyCompletionRate"
    },
    {
      "name": "Net Promoter Score (NPS)",
      "calculation": "% Promoters (score 9–10) − % Detractors (score 0–6) from post-event survey",
      "sources": ["Cvent", "Qualtrics", "Salesforce"],
      "type": "engagement",
      "field": "Events.NPS"
    },
    {
      "name": "Consent Capture Rate",
      "calculation": "(HCPs Providing Marketing Consent at Registration / Total Registrants) × 100",
      "sources": ["Cvent", "Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "Events.ConsentCaptureRate"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. WEB  (HCP-gated portals, brand websites, medical education digital hubs)
  // ─────────────────────────────────────────────────────────────────────────────
  "Web": [
    {
      "name": "Unique HCP Visitors",
      "calculation": "COUNT(DISTINCT Authenticated HCP Sessions) in Period",
      "sources": ["Google Analytics", "Salesforce", "Veeva CRM"],
      "type": "reach",
      "field": "Web.UniqueHCPVisitors"
    },
    {
      "name": "HCP Portal Login Rate",
      "calculation": "(HCPs Who Logged In / Total HCPs with Portal Access) × 100",
      "sources": ["Google Analytics", "Salesforce", "Okta"],
      "type": "reach",
      "field": "Web.PortalLoginRate"
    },
    {
      "name": "Average Session Duration",
      "calculation": "SUM(Session Duration in Seconds) / COUNT(Sessions)",
      "sources": ["Google Analytics"],
      "type": "engagement",
      "field": "Web.AvgSessionDuration"
    },
    {
      "name": "Pages per Session",
      "calculation": "Total Page Views / Total Sessions",
      "sources": ["Google Analytics"],
      "type": "engagement",
      "field": "Web.PagesPerSession"
    },
    {
      "name": "Bounce Rate",
      "calculation": "(Single-Page Sessions / Total Sessions) × 100",
      "sources": ["Google Analytics"],
      "type": "engagement",
      "field": "Web.BounceRate"
    },
    {
      "name": "Content Engagement Rate",
      "calculation": "(Sessions with ≥1 Content Interaction (Download, Video Play, or Tool Use) / Total Sessions) × 100",
      "sources": ["Google Analytics", "Veeva Vault"],
      "type": "engagement",
      "field": "Web.ContentEngagementRate"
    },
    {
      "name": "Product Page View Rate",
      "calculation": "(Sessions Including ≥1 Product Page View / Total Sessions) × 100",
      "sources": ["Google Analytics", "Salesforce"],
      "type": "engagement",
      "field": "Web.ProductPageViewRate"
    },
    {
      "name": "Resource / PDF Download Rate",
      "calculation": "(Unique Sessions with ≥1 File Download / Total Sessions) × 100",
      "sources": ["Google Analytics", "Veeva Vault"],
      "type": "engagement",
      "field": "Web.ResourceDownloadRate"
    },
    {
      "name": "Return Visitor Rate",
      "calculation": "(Returning HCP Visitors / Total Unique HCP Visitors) × 100",
      "sources": ["Google Analytics", "Salesforce"],
      "type": "engagement",
      "field": "Web.ReturnVisitorRate"
    },
    {
      "name": "Rep Connect / Contact Request Rate",
      "calculation": "(HCPs Who Submitted a Rep or MSL Contact Form / Total Sessions) × 100",
      "sources": ["Google Analytics", "Salesforce", "Veeva CRM"],
      "type": "engagement",
      "field": "Web.RepContactRequestRate"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CONGRESS  (Major external medical congresses: ASCO, ESC, ADA, EHA, ESMO…)
  // ─────────────────────────────────────────────────────────────────────────────
  "Congress": [
    {
      "name": "Booth Visitor Count",
      "calculation": "COUNT(Badge Scans / Check-Ins at Brand Booth)",
      "sources": ["Cvent", "Veeva CRM", "Congress Badge Scan System"],
      "type": "reach",
      "field": "Congress.BoothVisitorCount"
    },
    {
      "name": "Booth Dwell Time (Avg)",
      "calculation": "SUM(Time Spent at Booth per HCP) / COUNT(Booth Visitors)",
      "sources": ["Cvent", "Bluetooth Beacon Analytics"],
      "type": "engagement",
      "field": "Congress.AvgBoothDwellTime"
    },
    {
      "name": "Symposium Attendance Rate",
      "calculation": "(HCPs Attending Company Symposium / HCPs Registered for Congress) × 100",
      "sources": ["Cvent", "Congress Registration System", "Veeva CRM"],
      "type": "reach",
      "field": "Congress.SymposiumAttendanceRate"
    },
    {
      "name": "1:1 Scheduled Meeting Rate",
      "calculation": "(Scheduled 1:1 HCP Meetings / Total HCP Interactions at Congress) × 100",
      "sources": ["Veeva CRM", "Cvent", "Calendly"],
      "type": "engagement",
      "field": "Congress.OneToOneMeetingRate"
    },
    {
      "name": "Digital Content Interaction Rate",
      "calculation": "(HCPs Scanning QR / Accessing Digital Materials / Total Booth Visitors) × 100",
      "sources": ["Veeva CRM", "Cvent", "Veeva Vault"],
      "type": "engagement",
      "field": "Congress.DigitalContentInteractionRate"
    },
    {
      "name": "New HCP Contacts Captured",
      "calculation": "COUNT(New HCP Records Created in CRM during Congress Period)",
      "sources": ["Veeva CRM", "Salesforce", "Cvent"],
      "type": "reach",
      "field": "Congress.NewHCPContactsCaptured"
    },
    {
      "name": "KOL / Speaker Engagement Count",
      "calculation": "COUNT(Distinct KOL Interactions Logged — briefings, advisory boards, media appearances)",
      "sources": ["Veeva CRM", "Salesforce", "Veeva Medical CRM"],
      "type": "engagement",
      "field": "Congress.KOLEngagementCount"
    },
    {
      "name": "Post-Congress Follow-Up Rate",
      "calculation": "(HCPs Receiving a Follow-Up Touch within 7 Days Post-Congress / Total HCP Congress Contacts) × 100",
      "sources": ["Veeva CRM", "Salesforce Marketing Cloud"],
      "type": "engagement",
      "field": "Congress.PostCongressFollowUpRate"
    },
    {
      "name": "Scientific Presentation Attendance",
      "calculation": "COUNT(HCPs Attending Company-Sponsored Scientific Session or Poster Presentation)",
      "sources": ["Cvent", "Congress Organiser Data", "Veeva CRM"],
      "type": "reach",
      "field": "Congress.ScientificPresentationAttendance"
    },
    {
      "name": "Net Promoter Score (NPS) — Booth / Symposium",
      "calculation": "% Promoters (score 9–10) − % Detractors (score 0–6) from post-congress HCP survey",
      "sources": ["Qualtrics", "Salesforce", "Cvent"],
      "type": "engagement",
      "field": "Congress.NPS"
    }
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. F2F  (Face-to-Face — in-person rep or MSL visits to HCP offices / clinics)
  // ─────────────────────────────────────────────────────────────────────────────
  "F2F": [
    {
      "name": "HCP Reach (In-Person)",
      "calculation": "COUNT(DISTINCT HCP_ID) with ≥1 Completed F2F Call Logged in Period",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "F2F.HCPReach"
    },
    {
      "name": "Call Frequency (F2F)",
      "calculation": "Total Completed F2F Calls / COUNT(DISTINCT HCP_ID) in Period",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "F2F.CallFrequency"
    },
    {
      "name": "Target HCP Coverage Rate",
      "calculation": "(Distinct Target HCPs with ≥1 F2F Call / Total Target HCPs in Territory) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "F2F.TargetCoverageRate"
    },
    {
      "name": "Average F2F Visit Duration",
      "calculation": "SUM(Visit Duration in Minutes) / COUNT(Completed F2F Calls)",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "F2F.AvgVisitDuration"
    },
    {
      "name": "CLM Presentation Rate",
      "calculation": "(F2F Calls with ≥1 CLM Slide Presented / Total Completed F2F Calls) × 100",
      "sources": ["Veeva CRM", "Veeva CLM"],
      "type": "engagement",
      "field": "F2F.CLMPresentationRate"
    },
    {
      "name": "Key Message Delivery Rate",
      "calculation": "(F2F Calls Documenting Delivery of Priority Key Message / Total Completed F2F Calls) × 100",
      "sources": ["Veeva CRM"],
      "type": "engagement",
      "field": "F2F.KeyMessageDeliveryRate"
    },
    {
      "name": "Sample Delivery Rate",
      "calculation": "(F2F Calls with ≥1 Sample Delivered / Total Completed F2F Calls) × 100",
      "sources": ["Veeva CRM", "Salesforce", "SAP"],
      "type": "engagement",
      "field": "F2F.SampleDeliveryRate"
    },
    {
      "name": "Rep Activity vs Target (Calls-to-Plan)",
      "calculation": "(Actual Completed F2F Calls / Planned F2F Calls in Period) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "reach",
      "field": "F2F.CallsToPlanRate"
    },
    {
      "name": "HCP Feedback Capture Rate",
      "calculation": "(F2F Calls with Objection / Sentiment / Feedback Logged / Total Completed F2F Calls) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "F2F.FeedbackCaptureRate"
    },
    {
      "name": "Follow-Up Action Rate",
      "calculation": "(F2F Calls Resulting in a Documented Next Step or Task Created / Total Completed F2F Calls) × 100",
      "sources": ["Veeva CRM", "Salesforce"],
      "type": "engagement",
      "field": "F2F.FollowUpActionRate"
    }
  ]
};

/**
 * Flat list of all channel names for iteration/dropdown use
 */
export const CHANNEL_NAMES = Object.keys(CHANNEL_KPIS);

/**
 * Helper: get KPIs for a specific channel
 * @param {string} channel - Channel name (e.g. "Email", "F2F")
 * @returns {Array} Array of KPI objects
 */
export function getKPIsForChannel(channel) {
  return CHANNEL_KPIS[channel] ?? [];
}

/**
 * Helper: get all KPIs of a specific type across all channels
 * @param {"engagement"|"reach"} type
 * @returns {Array} Array of { channel, ...kpi } objects
 */
export function getKPIsByType(type) {
  return CHANNEL_NAMES.flatMap((channel) =>
    CHANNEL_KPIS[channel]
      .filter((kpi) => kpi.type === type)
      .map((kpi) => ({ channel, ...kpi }))
  );
}
