const PENDING_STATUSES = new Set([
    "pending",
    "pendingrecruiter",
    "verificationpending",
    "underreview",
]);

function normalizeStatus(status) {
    return String(status || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function isRecruiterPending(user) {
    if (!user || user.role !== "recruiter") return false;
    return PENDING_STATUSES.has(normalizeStatus(user.status));
}

export function canRecruiterPostJobs(user) {
    return !!user && user.role === "recruiter" && !isRecruiterPending(user);
}

export function getRecruiterJobCtaState(user) {
    const isPending = isRecruiterPending(user);
    return {
        isPending,
        isAvailable: canRecruiterPostJobs(user),
        label: "Post a Job",
        helperText: isPending ? "Pending Approval" : "Create Job Post",
    };
}

export const recruiterAccess = {
    isRecruiterPending,
    canRecruiterPostJobs,
    getRecruiterJobCtaState,
};


