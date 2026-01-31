import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { API } from "@web/api";

export const invitationKeys = {
  all: ["invitations"] as const,
  workspace: (workspaceId: number) =>
    [...invitationKeys.all, "workspace", workspaceId] as const,
  my: () => [...invitationKeys.all, "my"] as const,
};

/**
 * 워크스페이스의 pending 초대 목록 조회
 */
export function useWorkspaceInvitations(workspaceId: number) {
  return useQuery({
    queryKey: invitationKeys.workspace(workspaceId),
    queryFn: () => API.invitation.listWorkspaceInvitations(workspaceId),
    enabled: workspaceId > 0,
  });
}

/**
 * 초대 생성
 */
export function useCreateInvitation(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) =>
      API.invitation.create(workspaceId, { inviteeEmail: email }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: invitationKeys.workspace(workspaceId),
      });
    },
  });
}

/**
 * 초대 취소
 */
export function useCancelInvitation(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: number) =>
      API.invitation.cancel(workspaceId, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: invitationKeys.workspace(workspaceId),
      });
    },
  });
}
