"use client";

import { useAuth } from "@/hooks/use-auth";
import type { ProfileId } from "@/types/common";

export type ActorContext = {
  actorId: ProfileId;
};

/** Actor id for service calls — null when signed out. */
export function useActorId(): ProfileId | null {
  const { user } = useAuth();
  return (user?.id as ProfileId | undefined) ?? null;
}

export function useActor(): ActorContext | null {
  const actorId = useActorId();
  if (!actorId) return null;
  return { actorId };
}

export function requireActor(
  actor: ActorContext | null,
): asserts actor is ActorContext {
  if (!actor) {
    throw new Error("Authentication required");
  }
}
