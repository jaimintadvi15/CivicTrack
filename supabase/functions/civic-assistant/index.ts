/// <reference path="./deno.d.ts" />
// Supabase Edge Function: civic-assistant
// Conversational AI agent for CivicTrack ("Your smart civic assistance agent")
// Strictly adheres to role authorization, zero-hallucinations, and FACT vs RECOMMENDATION labeling.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  message: string;
  history?: { sender: "user" | "assistant"; text: string }[];
  userRole: "citizen" | "municipal" | "worker";
  userName?: string;
  userId?: string;
  authorizedIssues?: any[];
  summaryStats?: any;
  activeTicketNumber?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();
    const {
      message,
      history = [],
      userRole = "citizen",
      userName = "Citizen",
      authorizedIssues = [],
      summaryStats,
      activeTicketNumber,
    } = payload;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required message field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("AI_API_KEY");
    const model = Deno.env.get("AI_MODEL") || Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";

    // If no API key configured in Supabase secrets, return gracefully indicating fallback
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          fallback: true,
          message: "API key not configured in Supabase secrets, client fallback used.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build strict system prompt with authorized context
    const issuesContextStr = JSON.stringify(authorizedIssues.slice(0, 20), null, 2);
    const summaryStatsStr = summaryStats ? JSON.stringify(summaryStats, null, 2) : "N/A";

    const systemPrompt = `You are "CivicTrack AI" — Your smart civic assistance agent for the CivicTrack municipal governance platform.
You assist citizens, workers, and municipal authorities with verified complaint status, SLA tracking, municipal performance, and reporting guidance.

CORE RULES:
1. STRICT READ-ONLY: You provide information and recommendations only. You cannot modify records or change complaint statuses.
2. ZERO HALLUCINATION: You must NEVER invent or guess complaint statuses, ticket numbers, authorities, deadlines, or locations.
   If the requested information is not in the authorized complaints or context provided, say:
   "I don't have enough information to verify that."
3. PRIVACY & AUTHORIZATION:
   - For citizen users: You may ONLY refer to the authorized complaints provided in their context.
   - If a citizen asks about another citizen's complaints, answer:
     "I can only provide complaint information that you are authorized to access."
4. FACT VS RECOMMENDATION:
   - Clearly label facts from database records as facts.
   - Clearly label any advice, priority suggestions, or recommended next actions as "AI Recommendation".
5. MUNICIPAL SUMMARIES:
   - For municipal/admin users, calculate numbers strictly from the summaryStats or authorized complaint records.
6. SLA RULES:
   - Open Manhole/Drain: 6 hours
   - Water Leak: 12 hours
   - Garbage Accumulation: 24 hours
   - Streetlight Outage: 48 hours
   - Road Damage: 72 hours
   - Road Pothole: 7 days (168 hours)

CURRENT SESSION:
- User Role: ${userRole}
- User Name: ${userName}
- Active Ticket Referenced: ${activeTicketNumber || "None"}
- Authorized Complaints Count: ${authorizedIssues.length}
- Authorized Complaints Data:
${issuesContextStr}
- Municipal Summary Stats:
${summaryStatsStr}`;

    // Convert conversation history to Anthropic format
    const messages: any[] = [];
    for (const h of history.slice(-6)) {
      messages.push({
        role: h.sender === "user" ? "user" : "assistant",
        content: h.text,
      });
    }
    messages.push({ role: "user", content: message });

    // Call Anthropic API
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API call failed:", res.status, errText);
      return new Response(
        JSON.stringify({ fallback: true, error: `Anthropic API error: ${res.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await res.json();
    const answer = aiData.content?.[0]?.text || "I don't have enough information to verify that.";

    // Extract ticket numbers if mentioned
    const ticketMatches = answer.match(/(?:#)?(BLR-\d{4}-\d{4}|CT\d+|civic-\d+)/gi) || [];
    const referencedTickets = Array.from(new Set(ticketMatches.map((t: string) => t.replace(/^#/, ""))));

    return new Response(
      JSON.stringify({
        answer,
        referencedTickets,
        suggestions: [
          "What is the status of my complaint?",
          "How does SLA work?",
          "Which complaints are overdue?",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ fallback: true, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
