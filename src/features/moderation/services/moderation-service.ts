import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCreateReport,
  demoHideComment,
  demoHideMessage,
  demoHidePost,
  demoListReportsForModerator,
  demoUpdateReportStatus,
  demoWarnUser,
} from "../../../services/demo-service";
import type { ReportStatus, ReportTargetType } from "../../../types/domain";
import type { ReportReason } from "../../../constants/moderation";
import { sanitizePlainText } from "../../../utils/sanitize";

export async function createReport({
  reporterId,
  targetType,
  targetId,
  reason,
  details,
}: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string | undefined;
}) {
  if (env.demoMode) {
    return demoCreateReport({ reporterId, targetType, targetId, reason, details });
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details ? sanitizePlainText(details) : null,
      status: "open",
      created_at: new Date().toISOString(),
      resolved_by: null,
      resolved_at: null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listReportsForModerator() {
  if (env.demoMode) {
    return demoListReportsForModerator();
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(*)")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateReportStatus({
  reportId,
  status,
  moderatorId,
}: {
  reportId: string;
  status: ReportStatus;
  moderatorId: string;
}) {
  if (env.demoMode) {
    return demoUpdateReportStatus({ reportId, status, moderatorId });
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: ["resolved", "rejected"].includes(status) ? moderatorId : null,
      resolved_at: ["resolved", "rejected"].includes(status)
        ? new Date().toISOString()
        : null,
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hidePost(postId: string) {
  if (env.demoMode) {
    return demoHidePost(postId);
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "hidden", updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    throw error;
  }
}

export async function hideComment(commentId: string) {
  if (env.demoMode) {
    return demoHideComment(commentId);
  }

  const { error } = await supabase
    .from("comments")
    .update({ status: "hidden", updated_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) {
    throw error;
  }
}

export async function hideMessage(messageId: string) {
  if (env.demoMode) {
    return demoHideMessage(messageId);
  }

  const { error } = await supabase
    .from("messages")
    .update({ status: "hidden" })
    .eq("id", messageId);

  if (error) {
    throw error;
  }
}

export async function warnUser(userId: string, moderatorId: string, reason: string) {
  if (env.demoMode) {
    return demoWarnUser(userId, moderatorId, reason);
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "moderation_warning",
    payload: {
      reason: sanitizePlainText(reason),
      moderator_id: moderatorId,
    },
    read_at: null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
