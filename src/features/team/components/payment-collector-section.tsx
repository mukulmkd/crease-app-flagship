"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BodySm, StatusChip } from "@/components/common";
import { FormField } from "@/components/forms/form-field";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useAssignPaymentCollector,
  useTeamMembers,
} from "@/features/team/hooks";
import type { Team } from "@/types/models";

const collectorSchema = z.object({
  userId: z.string().uuid("Pick an Admin"),
  upiVpa: z.string().trim().min(3, "UPI VPA is required").max(120),
});

type CollectorValues = z.infer<typeof collectorSchema>;

type PaymentCollectorSectionProps = {
  team: Team;
};

/**
 * Exactly one Admin collects weekend fees. Assigning sets team.upi_vpa to
 * their VPA and auto-settles that Admin's own dues.
 */
function PaymentCollectorSection({ team }: PaymentCollectorSectionProps) {
  const adminsQuery = useTeamMembers({ role: "admin", status: "active" });
  const assign = useAssignPaymentCollector();
  const admins = adminsQuery.data?.items ?? [];
  const collector = admins.find(
    (m) => String(m.userId) === String(team.collectorUserId),
  );

  const form = useForm<CollectorValues>({
    resolver: zodResolver(collectorSchema),
    defaultValues: {
      userId: team.collectorUserId ? String(team.collectorUserId) : "",
      upiVpa: team.upiVpa ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      userId: team.collectorUserId ? String(team.collectorUserId) : "",
      upiVpa: team.upiVpa ?? "",
    });
  }, [team.collectorUserId, team.upiVpa, form]);

  const selectedUserId = useWatch({ control: form.control, name: "userId" });

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Payment collector
          </p>
          <BodySm className="mt-1">
            Exactly one Admin collects weekend UPI. Players pay their VPA. The
            collector&apos;s own dues auto-settle — they cannot pay themselves.
          </BodySm>
        </div>
        {collector ? (
          <StatusChip status="success">Assigned</StatusChip>
        ) : (
          <StatusChip status="warning">Required</StatusChip>
        )}
      </div>

      {collector ? (
        <p className="rounded-lg bg-surface-container-lowest px-3 py-2 text-sm">
          <span className="font-medium">
            {collector.profile.fullName?.trim() || "Admin"}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {team.upiVpa?.trim() || "No UPI set"}
          </span>
        </p>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await assign.mutateAsync(values);
            toast.success({ title: "Payment collector updated" });
          } catch (error) {
            toast.error({ title: getMutationErrorMessage(error) });
          }
        })}
      >
        <FormField
          label="Collector Admin"
          error={form.formState.errors.userId?.message}
        >
          <Select
            value={selectedUserId || undefined}
            onValueChange={(value) =>
              form.setValue("userId", value, { shouldValidate: true })
            }
          >
            <SelectTrigger aria-label="Collector Admin" className="w-full">
              <SelectValue placeholder="Select Admin" />
            </SelectTrigger>
            <SelectContent>
              {admins.map((member) => (
                <SelectItem
                  key={String(member.userId)}
                  value={String(member.userId)}
                >
                  {member.profile.fullName?.trim() || "Admin"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          label="UPI VPA"
          description="Mandatory — players pay weekend fees here"
          error={form.formState.errors.upiVpa?.message}
        >
          <Input
            {...form.register("upiVpa")}
            placeholder="collector@upi"
            autoComplete="off"
          />
        </FormField>
        <Button type="submit" className="w-full" loading={assign.isPending}>
          {team.collectorUserId ? "Update collector" : "Assign collector"}
        </Button>
      </form>
    </section>
  );
}

export { PaymentCollectorSection };
