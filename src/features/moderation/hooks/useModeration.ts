import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import type { ReportStatus } from "../../../types/domain";
import {
  createReport,
  hideComment,
  hideMessage,
  hidePost,
  listReportsForModerator,
  updateReportStatus,
  warnUser,
} from "../services/moderation-service";

export function useCreateReportMutation(reporterId?: string) {
  return useMutation({
    mutationFn: (
      input: Omit<Parameters<typeof createReport>[0], "reporterId">,
    ) => createReport({ ...input, reporterId: reporterId ?? "" }),
  });
}

export function useModerationQueue() {
  return useQuery({
    queryKey: ["moderation-reports"],
    queryFn: listReportsForModerator,
  });
}

export function useResolveReportMutation(moderatorId?: string) {
  return useMutation({
    mutationFn: ({
      reportId,
      status,
    }: {
      reportId: string;
      status: ReportStatus;
    }) =>
      updateReportStatus({
        reportId,
        status,
        moderatorId: moderatorId ?? "",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    },
  });
}

export function useHideContentMutation() {
  return useMutation({
    mutationFn: ({ type, id }: { type: "post" | "comment" | "message"; id: string }) => {
      if (type === "post") {
        return hidePost(id);
      }
      if (type === "comment") {
        return hideComment(id);
      }
      return hideMessage(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}

export function useWarnUserMutation(moderatorId?: string) {
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      warnUser(userId, moderatorId ?? "", reason),
  });
}
