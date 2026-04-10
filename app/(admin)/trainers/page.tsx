"use client";

import { CheckCircle2, ExternalLink, Eye, FileText, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Pagination from "@/components/admin/Pagination";
import PageHero from "@/components/admin/PageHero";
import PageToolbar from "@/components/admin/PageToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminSearch } from "@/components/admin/AdminSearchContext";
import { matchesSearch } from "@/lib/admin-ui";
import { clientApi, type ApiResult } from "@/lib/client-api";

type TrainerReviewRow = {
  ptId?: string;
  accountId?: string | null;
  displayName?: string | null;
  verificationStatus?: string | null;
  submittedAt?: string | null;
};

type TrainerReviewDetail = {
  ptId?: string;
  accountId?: string | null;
  displayName?: string | null;
  bio?: string | null;
  experienceYears?: number | string | null;
  hourlyPointRate?: number | string | null;
  location?: string | null;
  certifications?: string[] | null;
  specialties?: string[] | null;
  languages?: string[] | null;
  verificationStatus?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectedReason?: string | null;
  certificationFiles?: CertificationFile[] | null;
};

type CertificationFile = {
  fileName?: string | null;
  fileUrl?: string | null;
  contentType?: string | null;
  fileSize?: number | string | null;
};

type TrainerReviewListPayload = {
  items?: TrainerReviewRow[];
  pageIndex?: number;
  pageSize?: number;
  totalItems?: number;
};

type AccountRecord = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  username?: string;
};

type TrainerCard = {
  id: string;
  accountName: string;
  displayName: string;
  verificationStatus: string;
  submittedAt: string | null;
};

type DetailState = {
  open: boolean;
  loading: boolean;
  row: TrainerReviewDetail | null;
  error: string | null;
};

type RejectState = {
  open: boolean;
  ptId: string | null;
  displayName: string;
  reason: string;
  error: string | null;
};

type ApproveState = {
  open: boolean;
  ptId: string | null;
  displayName: string;
  error: string | null;
};

const PAGE_SIZE = 10;

function findArray<T>(value: unknown, depth = 0): T[] | null {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== "object" || depth > 4) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const entry of Object.values(record)) {
    const found = findArray<T>(entry, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function unwrapNestedData(value: unknown, depth = 0): unknown {
  if (!value || typeof value !== "object" || depth > 6) {
    return value;
  }

  const record = value as Record<string, unknown>;
  if ("data" in record) {
    return unwrapNestedData(record.data, depth + 1);
  }

  return value;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatDate(value: string | null | undefined) {
  if (!value || value.startsWith("0001-01-01")) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatPoints(value: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(value)} P`;
}

function formatFileSize(value: number | string | null | undefined) {
  const bytes = toNumber(value);
  if (bytes <= 0) {
    return "-";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function normalizeStatus(status: string | null | undefined) {
  if (!status) {
    return "Pending";
  }

  const lowered = status.toLowerCase();
  if (lowered === "verified") {
    return "Verified";
  }
  if (lowered === "rejected") {
    return "Rejected";
  }
  return "Pending";
}

function getStatusTone(status: string) {
  const lowered = status.toLowerCase();
  if (lowered === "verified") {
    return "success";
  }
  if (lowered === "pending") {
    return "warning";
  }
  if (lowered === "rejected") {
    return "danger";
  }
  return "neutral";
}

function getAccountId(account: AccountRecord) {
  if (typeof account.id === "string") {
    return account.id;
  }
  if (typeof account._id === "string") {
    return account._id;
  }
  return "";
}

function getAccountName(account: AccountRecord) {
  if (account.name) {
    return account.name;
  }
  if (account.fullName) {
    return account.fullName;
  }
  if (account.username) {
    return account.username;
  }
  if (account.email) {
    return account.email.includes("@") ? account.email.split("@")[0] : account.email;
  }
  return "Unknown";
}

function extractAccounts(payload: unknown) {
  return findArray<AccountRecord>(payload) ?? [];
}

function extractTrainerListPayload(payload: unknown): TrainerReviewListPayload {
  const unwrapped = unwrapNestedData(payload);
  if (!unwrapped || typeof unwrapped !== "object") {
    return {};
  }

  const record = unwrapped as Record<string, unknown>;
  return {
    items: Array.isArray(record.items) ? (record.items as TrainerReviewRow[]) : [],
    pageIndex: typeof record.pageIndex === "number" ? record.pageIndex : 1,
    pageSize: typeof record.pageSize === "number" ? record.pageSize : PAGE_SIZE,
    totalItems: typeof record.totalItems === "number" ? record.totalItems : 0,
  };
}

function extractTrainerDetail(payload: unknown): TrainerReviewDetail | null {
  const unwrapped = unwrapNestedData(payload);
  if (!unwrapped || typeof unwrapped !== "object") {
    return null;
  }

  const record = unwrapped as Record<string, unknown>;
  if (typeof record.ptId !== "string") {
    return null;
  }

  return record as TrainerReviewDetail;
}

function normalizeRows(payload: unknown, accountMap: Record<string, string>) {
  const listPayload = extractTrainerListPayload(payload);
  const items = listPayload.items ?? [];

  return items
    .map((item) => {
      const id = typeof item.ptId === "string" ? item.ptId : "";
      const accountId = typeof item.accountId === "string" ? item.accountId : "";
      const displayName = item.displayName?.trim() || "Unnamed PT";

      return {
        id,
        displayName,
        accountName: accountMap[accountId] ?? displayName,
        verificationStatus: normalizeStatus(item.verificationStatus),
        submittedAt: item.submittedAt ?? null,
      } satisfies TrainerCard;
    })
    .filter((item) => item.id);
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="admin-panel rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm font-semibold text-white">-</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${title}-${item}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [listResult, setListResult] = useState<ApiResult<unknown>>({ data: null, error: null });
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [detailState, setDetailState] = useState<DetailState>({
    open: false,
    loading: false,
    row: null,
    error: null,
  });
  const [rejectState, setRejectState] = useState<RejectState>({
    open: false,
    ptId: null,
    displayName: "",
    reason: "",
    error: null,
  });
  const [approveState, setApproveState] = useState<ApproveState>({
    open: false,
    ptId: null,
    displayName: "",
    error: null,
  });
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const { debouncedQuery: globalQuery } = useAdminSearch();

  const combinedQuery = useMemo(
    () => [query, globalQuery].filter(Boolean).join(" ").trim().toLowerCase(),
    [globalQuery, query]
  );

  const loadAccounts = useCallback(() => {
    clientApi.get<unknown>("/api/admin/accounts?Page=1&PageSize=200").then((result) => {
      if (result.error) {
        return;
      }

      const accounts = extractAccounts(result.data);
      const nextMap: Record<string, string> = {};
      for (const account of accounts) {
        const id = getAccountId(account);
        if (id) {
          nextMap[id] = getAccountName(account);
        }
      }
      setAccountMap(nextMap);
    });
  }, []);

  const loadTrainers = useCallback(() => {
    const params = new URLSearchParams({
      pageIndex: String(page),
      pageSize: String(PAGE_SIZE),
    });

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    clientApi.get<unknown>(`/api/admin/pts?${params.toString()}`).then((result) => {
      setListResult(result);
    });
  }, [page, statusFilter]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  const listPayload = useMemo(() => extractTrainerListPayload(listResult.data), [listResult.data]);
  const rows = useMemo(() => normalizeRows(listResult.data, accountMap), [accountMap, listResult.data]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      matchesSearch(
        {
          id: row.id,
          displayName: row.displayName,
          accountName: row.accountName,
          verificationStatus: row.verificationStatus,
          submittedAt: formatDate(row.submittedAt),
        },
        combinedQuery
      )
    );
  }, [combinedQuery, rows]);

  const totalCount = listPayload.totalItems ?? rows.length;
  const currentPage = listPayload.pageIndex ?? page;
  const totalPages = Math.max(1, Math.ceil(totalCount / (listPayload.pageSize ?? PAGE_SIZE)));

  const pendingCount = useMemo(
    () => rows.filter((item) => item.verificationStatus === "Pending").length,
    [rows]
  );
  const verifiedCount = useMemo(
    () => rows.filter((item) => item.verificationStatus === "Verified").length,
    [rows]
  );
  const rejectedCount = useMemo(
    () => rows.filter((item) => item.verificationStatus === "Rejected").length,
    [rows]
  );

  const openDetail = async (ptId: string) => {
    setDetailState({
      open: true,
      loading: true,
      row: null,
      error: null,
    });

    const result = await clientApi.get<unknown>(`/api/admin/pts/${ptId}`);
    if (result.error) {
      setDetailState({
        open: true,
        loading: false,
        row: null,
        error: result.error,
      });
      return;
    }

    setDetailState({
      open: true,
      loading: false,
      row: extractTrainerDetail(result.data),
      error: null,
    });
  };

  const closeDetail = () => {
    setDetailState({
      open: false,
      loading: false,
      row: null,
      error: null,
    });
  };

  const openApproveModal = (ptId: string, displayName: string) => {
    setApproveState({
      open: true,
      ptId,
      displayName,
      error: null,
    });
  };

  const closeApproveModal = () => {
    setApproveState({
      open: false,
      ptId: null,
      displayName: "",
      error: null,
    });
  };

  const submitApprove = async () => {
    if (!approveState.ptId) {
      return;
    }

    setPendingActionId(approveState.ptId);
    const result = await clientApi.post(`/api/admin/pts/${approveState.ptId}/approve`);
    setPendingActionId(null);

    if (result.error) {
      setApproveState((prev) => ({
        ...prev,
        error: result.error,
      }));
      return;
    }

    const currentPtId = approveState.ptId;
    closeApproveModal();
    loadTrainers();
    if (detailState.row?.ptId === currentPtId) {
      void openDetail(currentPtId);
    }
  };

  const openRejectModal = (ptId: string, displayName: string) => {
    setRejectState({
      open: true,
      ptId,
      displayName,
      reason: "",
      error: null,
    });
  };

  const closeRejectModal = () => {
    setRejectState({
      open: false,
      ptId: null,
      displayName: "",
      reason: "",
      error: null,
    });
  };

  const submitReject = async () => {
    if (!rejectState.ptId) {
      return;
    }

    const reason = rejectState.reason.trim();
    if (!reason) {
      setRejectState((prev) => ({
        ...prev,
        error: "Vui lòng nhập lý do từ chối PT.",
      }));
      return;
    }

    setPendingActionId(rejectState.ptId);
    const result = await clientApi.post(`/api/admin/pts/${rejectState.ptId}/reject`, {
      reason,
    });
    setPendingActionId(null);

    if (result.error) {
      setRejectState((prev) => ({
        ...prev,
        error: result.error,
      }));
      return;
    }

    const currentPtId = rejectState.ptId;
    closeRejectModal();
    loadTrainers();
    if (detailState.row?.ptId === currentPtId) {
      void openDetail(currentPtId);
    }
  };

  const detailRow = detailState.row;
  const detailStatus = normalizeStatus(detailRow?.verificationStatus);
  const detailAccountName =
    detailRow?.accountId && accountMap[detailRow.accountId]
      ? accountMap[detailRow.accountId]
      : detailRow?.displayName ?? "Unknown";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="PT Verification"
        title="Trainer Review"
        description="Review trainer submissions, inspect their professional profile, and approve or reject each PT application."
        stats={[
          { label: "Submissions", value: String(totalCount), tone: "info" },
          { label: "Pending", value: String(pendingCount), tone: "warning" },
          { label: "Verified", value: String(verifiedCount), tone: "success" },
          { label: "Rejected", value: String(rejectedCount), tone: "accent" },
        ]}
      />

      <section className="admin-surface rounded-3xl p-6 md:p-7">
        <PageToolbar
          className="mb-5"
          searchValue={query}
          onSearchChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search PT name, account, status, or ID"
          resultLabel={`Showing ${filteredRows.length} of ${rows.length} PT submissions on this page`}
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setPage(1);
              },
              options: [
                { label: "All status", value: "all" },
                { label: "Pending", value: "Pending" },
                { label: "Verified", value: "Verified" },
                { label: "Rejected", value: "Rejected" },
              ],
            },
          ]}
        />

        {listResult.error ? <p className="mb-4 text-sm text-rose-300">{listResult.error}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                <th className="pb-3 pr-4 font-semibold">PT</th>
                <th className="pb-3 pr-4 font-semibold">Account</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Submitted</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((trainer) => {
                const isBusy = pendingActionId === trainer.id;
                const canReview = trainer.verificationStatus === "Pending";

                return (
                  <tr key={trainer.id} className="border-b border-white/8 text-[var(--admin-soft)]">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{trainer.displayName}</p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">ID: {trainer.id}</p>
                    </td>
                    <td className="py-4 pr-4">{trainer.accountName}</td>
                    <td className="py-4 pr-4">
                      <StatusBadge
                        label={trainer.verificationStatus}
                        tone={getStatusTone(trainer.verificationStatus)}
                      />
                    </td>
                    <td className="py-4 pr-4 text-xs text-[var(--admin-muted)]">
                      {formatDate(trainer.submittedAt)}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openDetail(trainer.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:border-[#f0b35b]/50 hover:text-[#ffe2a3]"
                          aria-label={`View PT ${trainer.displayName}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {canReview ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openApproveModal(trainer.id, trainer.displayName)}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/14 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:border-emerald-300/50 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isBusy ? "Working..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openRejectModal(trainer.id, trainer.displayName)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-400/35 bg-rose-400/12 px-4 py-2 text-xs font-semibold text-rose-100 transition-colors hover:border-rose-300/50 hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy ? "Working..." : "Reject"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Page ${currentPage} of ${totalPages}`}
        />
      </section>

      {detailState.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="admin-surface max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-extrabold text-white">PT Review Detail</h4>
                {detailRow ? (
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">ID: {detailRow.ptId ?? "-"}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailState.loading ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-sm text-[var(--admin-muted)]">
                Loading PT detail...
              </div>
            ) : detailState.error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-200">
                {detailState.error}
              </div>
            ) : detailRow ? (
              <>
                <div className="grid gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.15),rgba(255,255,255,0.04))] p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#ffd99b]">PT Name</p>
                    <p className="mt-3 text-xl font-black text-white">{detailRow.displayName || "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.15),rgba(255,255,255,0.04))] p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#ffd99b]">Status</p>
                    <div className="mt-3">
                      <StatusBadge label={detailStatus} tone={getStatusTone(detailStatus)} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.15),rgba(255,255,255,0.04))] p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#ffd99b]">Hourly Rate</p>
                    <p className="mt-3 text-xl font-black text-white">
                      {formatPoints(toNumber(detailRow.hourlyPointRate))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#f0b35b]/20 bg-[linear-gradient(135deg,rgba(240,179,91,0.15),rgba(255,255,255,0.04))] p-5">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#ffd99b]">Submitted</p>
                    <p className="mt-3 text-base font-bold text-white">{formatDate(detailRow.submittedAt)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="admin-panel rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Profile Summary</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">ID</p>
                          <p className="mt-2 break-all text-sm font-semibold text-white">{detailRow.ptId ?? "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Account</p>
                          <p className="mt-2 text-sm font-semibold text-white">{detailAccountName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Experience</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {toNumber(detailRow.experienceYears)} years
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Location</p>
                          <p className="mt-2 text-sm font-semibold text-white">{detailRow.location || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Reviewed At</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDate(detailRow.reviewedAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Reviewed By</p>
                          <p className="mt-2 text-sm font-semibold text-white">{detailRow.reviewedBy || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="admin-panel rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Bio</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--admin-soft)]">{detailRow.bio || "-"}</p>
                    </div>

                    <DetailList title="Certifications" items={detailRow.certifications ?? []} />
                    <DetailList title="Specialties" items={detailRow.specialties ?? []} />
                    <DetailList title="Languages" items={detailRow.languages ?? []} />
                  </div>

                  <div className="space-y-4">
                    <div className="admin-panel rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">Certification Files</p>
                      <div className="mt-4 space-y-3">
                        {(detailRow.certificationFiles ?? []).length === 0 ? (
                          <p className="text-sm font-semibold text-white">-</p>
                        ) : (
                          (detailRow.certificationFiles ?? []).map((file, index) => (
                            <a
                              key={`${file.fileUrl ?? file.fileName ?? "file"}-${index}`}
                              href={file.fileUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#f0b35b]/35"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-[#ffe2a3]">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white">{file.fileName || "File"}</p>
                                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                                    {file.contentType || "-"} • {formatFileSize(file.fileSize)}
                                  </p>
                                </div>
                                <ExternalLink className="mt-0.5 h-4 w-4 text-[var(--admin-muted)]" />
                              </div>
                            </a>
                          ))
                        )}
                      </div>
                    </div>

                    {detailRow.rejectedReason ? (
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5">
                        <p className="text-xs uppercase tracking-[0.12em] text-rose-200">Rejected Reason</p>
                        <p className="mt-3 text-sm leading-7 text-rose-50">{detailRow.rejectedReason}</p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {detailStatus === "Pending" ? (
                        <>
                          <button
                            type="button"
                            disabled={pendingActionId === detailRow.ptId}
                            onClick={() =>
                              openApproveModal(detailRow.ptId ?? "", detailRow.displayName || "PT")
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/14 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:border-emerald-300/50 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {pendingActionId === detailRow.ptId ? "Working..." : "Approve PT"}
                          </button>
                          <button
                            type="button"
                            disabled={pendingActionId === detailRow.ptId}
                            onClick={() =>
                              openRejectModal(detailRow.ptId ?? "", detailRow.displayName || "PT")
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-rose-400/35 bg-rose-400/12 px-4 py-2 text-xs font-semibold text-rose-100 transition-colors hover:border-rose-300/50 hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pendingActionId === detailRow.ptId ? "Working..." : "Reject PT"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-sm text-[var(--admin-muted)]">
                No detail found.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {rejectState.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-rose-400/20 bg-[linear-gradient(180deg,#101720,#0a1018)] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.16),transparent_42%)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-rose-200/80">Reject PT</p>
                  <h4 className="mt-2 text-2xl font-black text-white">{rejectState.displayName}</h4>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--admin-soft)]">
                    Nhập lý do từ chối rõ ràng để PT biết cần bổ sung hay chỉnh sửa hồ sơ ở đâu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                  Rejected Reason
                </span>
                <textarea
                  value={rejectState.reason}
                  onChange={(event) =>
                    setRejectState((prev) => ({
                      ...prev,
                      reason: event.target.value,
                      error: null,
                    }))
                  }
                  rows={6}
                  placeholder="Ví dụ: Hồ sơ chưa đủ chứng chỉ hợp lệ hoặc phần kinh nghiệm chuyên môn còn thiếu chi tiết."
                  className="w-full rounded-3xl border border-white/12 bg-[#0d1724]/90 px-4 py-4 text-sm leading-6 text-white outline-none transition-colors placeholder:text-[color:rgba(142,163,184,0.72)] focus:border-rose-300/60"
                />
              </label>

              {rejectState.error ? <p className="text-sm text-rose-300">{rejectState.error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pendingActionId === rejectState.ptId}
                  onClick={() => void submitReject()}
                  className="rounded-full border border-rose-300/35 bg-rose-400/14 px-5 py-2.5 text-sm font-semibold text-rose-100 transition-colors hover:border-rose-200/50 hover:bg-rose-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingActionId === rejectState.ptId ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {approveState.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-emerald-400/20 bg-[linear-gradient(180deg,#101720,#0a1018)] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.16),transparent_42%)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">Approve PT</p>
                  <h4 className="mt-2 text-2xl font-black text-white">{approveState.displayName}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--admin-soft)]">
                    Xác nhận duyệt hồ sơ PT này để chuyển sang trạng thái đã xác minh.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeApproveModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-[var(--admin-soft)] transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              {approveState.error ? <p className="text-sm text-rose-300">{approveState.error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeApproveModal}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pendingActionId === approveState.ptId}
                  onClick={() => void submitApprove()}
                  className="rounded-full border border-emerald-300/35 bg-emerald-400/14 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-200/50 hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingActionId === approveState.ptId ? "Approving..." : "Confirm Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
