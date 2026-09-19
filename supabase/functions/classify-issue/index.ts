/// <reference path="./deno.d.ts" />
// Supabase Edge Function: classify-issue
// Deno TypeScript runtime
// Processes citizen issue reports via Anthropic Claude API (tool_use forced JSON),
// performs geospatial duplicate detection, calculates priority scores, and routes to municipal departments.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestPayload {
  photoUrl?: string;
  photoBase64?: string;
  description: string;
  title?: string;
  lat: number;
  lng: number;
  address?: string;
  ward?: string;
  reporterId?: string;
  reporterName?: string;
  reporterPhone?: string;
  saveToDatabase?: boolean; // if true, function handles DB upsert
}

interface ClaudeClassificationOutput {
  category: "pothole" | "streetlight" | "garbage" | "water" | "drain" | "road_damage" | "other" | "unclassified";
  severity: "low" | "medium" | "high" | "critical";
  ai_summary: string;
}

// 1. Category to Municipal Department Mapping
const DEPARTMENT_LOOKUP: Record<string, string> = {
  pothole: "Roads & Infrastructure Department",
  road_damage: "Roads & Infrastructure Department",
  streetlight: "Electrical & Public Lighting Department",
  garbage: "Solid Waste Management Department",
  water: "Water Supply & Sewerage Board (BWSSB)",
  drain: "Stormwater Drainage & Flood Control",
  other: "General Municipal Administration HQ",
  unclassified: "General Triage Department",
};

// 2. Priority Scoring Formula: 0 - 100
// Combines Severity Weight + Duplicate Report Count Bonus + Issue Age
function calculatePriorityScore(
  severity: string,
  reportCount: number = 1,
  createdAtMs: number = Date.now()
): number {
  const severityWeight: Record<string, number> = {
    critical: 45,
    high: 30,
    medium: 18,
    low: 10,
  };
  const base = severityWeight[severity.toLowerCase()] ?? 18;
  
  // Up to +30 points for multiple citizen reports on same problem
  const countBonus = Math.min(30, Math.max(0, (reportCount - 1) * 10));
  
  // Up to +25 points for issues that stay open over time
  const ageHours = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60));
  const ageBonus = Math.min(25, Math.floor(ageHours / 12) * 4);

  return Math.min(100, Math.max(5, base + countBonus + ageBonus));
}

// 3. Fallback Classifier when Anthropic API is unreachable or quota exhausted
function getFallbackClassification(description: string = ""): ClaudeClassificationOutput {
  const lower = description.toLowerCase();
  if (lower.includes("pothole") || lower.includes("crater") || lower.includes("road hole")) {
    return {
      category: "pothole",
      severity: lower.includes("deep") || lower.includes("accident") ? "high" : "medium",
      ai_summary: "Automated classification: Road surface pothole reported.",
    };
  }
  if (lower.includes("garbage") || lower.includes("trash") || lower.includes("dump") || lower.includes("waste")) {
    return {
      category: "garbage",
      severity: lower.includes("overflow") ? "high" : "medium",
      ai_summary: "Automated classification: Uncollected solid waste accumulation reported.",
    };
  }
  if (lower.includes("water") || lower.includes("pipe") || lower.includes("leak") || lower.includes("gushing")) {
    return {
      category: "water",
      severity: "critical",
      ai_summary: "Automated classification: Pressurized water distribution pipeline defect.",
    };
  }
  if (lower.includes("light") || lower.includes("lamp") || lower.includes("dark") || lower.includes("pole")) {
    return {
      category: "streetlight",
      severity: "medium",
      ai_summary: "Automated classification: Streetlight luminaire outage reported.",
    };
  }
  if (lower.includes("drain") || lower.includes("manhole") || lower.includes("sewer") || lower.includes("gutter")) {
    return {
      category: "drain",
      severity: "critical",
      ai_summary: "Automated classification: Open stormwater conduit or broken slab hazard.",
    };
  }

  return {
    category: "unclassified",
    severity: "medium",
    ai_summary: "Automated intake: Issue logged and queued for municipal officer review.",
  };
}

// 4. Anthropic Claude API Call with Tool Use
async function classifyWithClaude(
  description: string,
  photoUrl?: string,
  photoBase64?: string
): Promise<ClaudeClassificationOutput> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY is not set. Using graceful fallback classifier.");
    return getFallbackClassification(description);
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";

  // Build message content
  const contentItems: any[] = [];

  // Add image if available
  if (photoBase64) {
    const mediaType = photoBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    contentItems.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: cleanBase64,
      },
    });
  } else if (photoUrl && (photoUrl.startsWith("http://") || photoUrl.startsWith("https://"))) {
    // Attempt fetching image to provide base64 to Claude
    try {
      const imgRes = await fetch(photoUrl);
      if (imgRes.ok) {
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        const arrayBuf = await imgRes.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
        contentItems.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
            data: b64,
          },
        });
      }
    } catch (e) {
      console.warn("Could not fetch remote image for vision analysis:", e);
    }
  }

  contentItems.push({
    type: "text",
    text: `You are an AI civic infrastructure inspector for Bengaluru Municipal Corporation (Urban Fix platform). 
Analyze this citizen-submitted civic report.
Report description: "${description || 'No written text provided'}"
Classify the issue using the classify_civic_issue tool. Be factual, concise, and assess public safety risk.`,
  });

  const toolDefinition = {
    name: "classify_civic_issue",
    description: "Submit the structured classification of the civic problem.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["pothole", "streetlight", "garbage", "water", "drain", "road_damage", "other"],
          description: "Primary problem category",
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Severity level based on public danger and traffic impact",
        },
        ai_summary: {
          type: "string",
          description: "Concise 1-2 sentence factual summary of the issue and public hazard",
        },
      },
      required: ["category", "severity", "ai_summary"],
    },
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 512,
        messages: [{ role: "user", content: contentItems }],
        tools: [toolDefinition],
        tool_choice: { type: "tool", name: "classify_civic_issue" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Claude API returned status ${res.status}: ${errText}. Falling back to default.`);
      return getFallbackClassification(description);
    }

    const data = await res.json();
    const toolCall = data.content?.find((c: any) => c.type === "tool_use" && c.name === "classify_civic_issue");
    if (toolCall && toolCall.input) {
      const input = toolCall.input;
      return {
        category: input.category || "other",
        severity: input.severity || "medium",
        ai_summary: input.ai_summary || "Classified by Claude AI Agent.",
      };
    }

    return getFallbackClassification(description);
  } catch (err) {
    console.error("Claude API invocation error:", err);
    return getFallbackClassification(description);
  }
}

// 5. Duplicate Comparison with Claude (or text similarity if API unavailable)
async function evaluateDuplicateWithClaude(
  newDescription: string,
  existingDescription: string,
  category: string
): Promise<{ isDuplicate: boolean; confidence: number; reasoning: string }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    // Basic text keyword overlap check
    const wordsNew = new Set(newDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const wordsOld = new Set(existingDescription.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    let matchCount = 0;
    for (const w of wordsNew) {
      if (wordsOld.has(w)) matchCount++;
    }
    const overlap = wordsNew.size > 0 ? matchCount / wordsNew.size : 0;
    return {
      isDuplicate: overlap >= 0.35,
      confidence: Math.round(overlap * 100),
      reasoning: "Keyword similarity check",
    };
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-6";

  const toolDefinition = {
    name: "confirm_duplicate",
    description: "Determine if two reports located within 100m describe the exact same physical issue.",
    input_schema: {
      type: "object",
      properties: {
        is_duplicate: { type: "boolean" },
        confidence: { type: "number", description: "Confidence score between 0 and 100" },
        reasoning: { type: "string" },
      },
      required: ["is_duplicate", "confidence", "reasoning"],
    },
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Both reports are within 100 meters and classified under category: "${category}".
Report A (Existing Open Issue): "${existingDescription}"
Report B (New Citizen Submission): "${newDescription}"
Determine if Report B is a duplicate complaint of Report A. Use confirm_duplicate tool.`,
          },
        ],
        tools: [toolDefinition],
        tool_choice: { type: "tool", name: "confirm_duplicate" },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const toolCall = data.content?.find((c: any) => c.type === "tool_use");
      if (toolCall?.input) {
        return {
          isDuplicate: Boolean(toolCall.input.is_duplicate),
          confidence: Number(toolCall.input.confidence) || 85,
          reasoning: String(toolCall.input.reasoning || "Confirmed by Claude duplicate check"),
        };
      }
    }
  } catch (e) {
    console.warn("Claude duplicate check error:", e);
  }

  return { isDuplicate: true, confidence: 80, reasoning: "Proximity and category match fallback" };
}

// Main Edge Function Handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: RequestPayload = await req.json();
    const {
      description = "",
      title = "",
      photoUrl,
      photoBase64,
      lat,
      lng,
      address = "Bengaluru, Karnataka",
      ward = "Ward 4 - Indiranagar",
      reporterId = "anonymous",
      reporterName = "Citizen Hero",
      reporterPhone = "",
      saveToDatabase = false,
    } = payload;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Valid latitude and longitude coordinates are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Run Claude AI classification with tool_use
    const classification = await classifyWithClaude(
      `${title} ${description}`.trim(),
      photoUrl,
      photoBase64
    );

    const category = classification.category;
    const severity = classification.severity;
    const aiSummary = classification.ai_summary;
    const assignedDepartment = DEPARTMENT_LOOKUP[category.toLowerCase()] || DEPARTMENT_LOOKUP.other;

    // Step 2: Query for nearby duplicates within ~100m from Supabase DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    let duplicateMatch: any = null;
    let supabaseClient: any = null;

    if (supabaseUrl && supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

      try {
        // Use RPC function if exists
        const { data: nearbyIssues, error: rpcError } = await supabaseClient.rpc(
          "find_nearby_open_issues",
          {
            p_category: category,
            p_lat: lat,
            p_lng: lng,
            p_radius_meters: 100,
            p_days_limit: 14,
          }
        );

        if (!rpcError && Array.isArray(nearbyIssues) && nearbyIssues.length > 0) {
          // Compare with closest match
          const candidate = nearbyIssues[0];
          const dupEval = await evaluateDuplicateWithClaude(
            description || title,
            candidate.description || candidate.title,
            category
          );

          if (dupEval.isDuplicate) {
            duplicateMatch = {
              id: candidate.id,
              ticketNumber: candidate.ticket_number,
              title: candidate.title,
              address: candidate.address,
              distanceMeters: candidate.distance_meters,
              reportCount: (candidate.report_count || 1) + 1,
              confidence: dupEval.confidence,
              reasoning: dupEval.reasoning,
            };
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Geospatial RPC check skipped or DB table empty:", dbErr);
      }
    }

    const isDuplicate = Boolean(duplicateMatch);
    const initialReportCount = isDuplicate ? duplicateMatch.reportCount : 1;
    const priorityScore = calculatePriorityScore(severity, initialReportCount, Date.now());

    // Step 3: Optional Server-Side DB Insert/Update
    let insertedIssueId: string | null = null;
    let finalTicketNumber = `BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (saveToDatabase && supabaseClient) {
      if (isDuplicate && duplicateMatch) {
        // Increment report_count on original issue and update priority score
        const newScore = calculatePriorityScore(severity, duplicateMatch.reportCount, Date.now());
        await supabaseClient
          .from("issues")
          .update({
            report_count: duplicateMatch.reportCount,
            priority_score: newScore,
            updated_at: new Date().toISOString(),
          })
          .eq("id", duplicateMatch.id);

        insertedIssueId = duplicateMatch.id;
        finalTicketNumber = duplicateMatch.ticketNumber;
      } else {
        // Insert new issue row
        const { data: inserted, error: insErr } = await supabaseClient
          .from("issues")
          .insert({
            ticket_number: finalTicketNumber,
            title: title || `${category.toUpperCase()} problem near ${address.split(",")[0]}`,
            description: description || aiSummary,
            category: category,
            severity: severity,
            ai_summary: aiSummary,
            priority_score: priorityScore,
            assigned_department: assignedDepartment,
            is_duplicate: false,
            report_count: 1,
            photo_url: photoUrl,
            photos: photoUrl ? [photoUrl] : [],
            address: address,
            ward: ward,
            city: "Bengaluru",
            lat: lat,
            lng: lng,
            status: "Submitted",
            reporter_id: reporterId,
            reporter_name: reporterName,
            reporter_phone: reporterPhone,
          })
          .select("id, ticket_number")
          .single();

        if (!insErr && inserted) {
          insertedIssueId = inserted.id;
          finalTicketNumber = inserted.ticket_number;
        }
      }
    }

    // Response structure returned directly to frontend
    const responseData = {
      success: true,
      classification: {
        category,
        severity,
        ai_summary: aiSummary,
        priority_score: priorityScore,
        assigned_department: assignedDepartment,
      },
      duplicate: duplicateMatch
        ? {
            is_duplicate: true,
            duplicate_of: duplicateMatch.id,
            ticket_number: duplicateMatch.ticketNumber,
            title: duplicateMatch.title,
            distance_meters: duplicateMatch.distanceMeters,
            new_report_count: duplicateMatch.reportCount,
            confidence: duplicateMatch.confidence,
          }
        : {
            is_duplicate: false,
            duplicate_of: null,
            distance_meters: null,
            new_report_count: 1,
          },
      issue: {
        id: insertedIssueId,
        ticket_number: finalTicketNumber,
        category,
        severity,
        ai_summary: aiSummary,
        priority_score: priorityScore,
        assigned_department: assignedDepartment,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateMatch ? duplicateMatch.id : null,
        report_count: initialReportCount,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Unhandled error in classify-issue edge function:", error);

    // Graceful fallback response so the frontend is NEVER stuck in "processing"
    const fallback = getFallbackClassification("");
    return new Response(
      JSON.stringify({
        success: true,
        fallback: true,
        classification: {
          category: fallback.category,
          severity: fallback.severity,
          ai_summary: fallback.ai_summary,
          priority_score: 25,
          assigned_department: DEPARTMENT_LOOKUP[fallback.category],
        },
        duplicate: { is_duplicate: false, duplicate_of: null },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
