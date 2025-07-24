const BASE_URL = 'https://cms-backend-ceyx.onrender.com/api';

export const API_PATHS = {
  auth: {
    login: `${BASE_URL}/auth/login`,
    resetPassword: `${BASE_URL}/auth/user/reset-password`,
    resetSubadminPassword: `${BASE_URL}/auth/subadmin/reset-password`,
    resetAdminPassword: `${BASE_URL}/auth/admin/reset-password`, // ✅ ADD IT HERE
  },
  userdashboard: {
    summary: `${BASE_URL}/complaints/dashboard/summary`,
    classifyDescription: `${BASE_URL}/complaints/classify-description`,
    getSolutions: (subRelatedIssueId: string) =>
      `${BASE_URL}/complaints/solutions?subRelatedIssueId=${subRelatedIssueId}`,
    logResolution: `${BASE_URL}/complaints/log-resolution`,
    submitComplaint: `${BASE_URL}/complaints/submit`,
    allComplaints: `${BASE_URL}/complaints/allcomplaints`,
    trackComplaints: `${BASE_URL}/complaints/track-complaints`,
    submitFeedback: `${BASE_URL}/complaints/submit-feedback`,
    getAllRelatedIssues: `${BASE_URL}/complaints/related-issues/all`,
    getSubRelatedIssues: (relatedIssueId: string) =>
      `${BASE_URL}/complaints/sub-related-issues?related_issue_id=${relatedIssueId}`,
  },
  profile: {
    getProfile: `${BASE_URL}/profile`,
    updateProfile: `${BASE_URL}/profile/update`,
  },
  subadmindashboard: {
    summary: `${BASE_URL}/subadmin/dashboard/summary`,
    complaints: {
      solved: `${BASE_URL}/subadmin/complaints/solved`,
      assigned: `${BASE_URL}/subadmin/complaints/assigned`,
      general: `${BASE_URL}/subadmin/complaints/general`,
      pending: `${BASE_URL}/subadmin/complaints/pending`,
      highPriority: `${BASE_URL}/subadmin/complaints/high-priority`,
    },
    getRelatedIssues: (mainIssueId: string) =>
      `${BASE_URL}/subadmin/related-issues?main_issue_id=${mainIssueId}`,
    getAllByRole: (role: string) => `${BASE_URL}/subadmin/all-${role}s`,
    getMainIssues: `${BASE_URL}/subadmin/main-issues`,
    takeComplaint: (complaintId: string) =>
      `${BASE_URL}/subadmin/complaints/${complaintId}/take`,
    updateGeneralSolution: (complaintId: string) =>
      `${BASE_URL}/subadmin/complaints/${complaintId}/update-general-solution`,
    getSubRelatedIssues: (relatedIssueId: string) =>
      `${BASE_URL}/subadmin/sub-related-issues?related_issue_id=${relatedIssueId}`,
    rejectComplaint: (complaintId: string) =>
      `${BASE_URL}/subadmin/complaints/${complaintId}/reject`,
    updateUncategorizedComplaint: (complaintId: string) =>
      `${BASE_URL}/subadmin/complaints/${complaintId}/update-uncategorized`,
  },
  admindashboard: {
    summary: `${BASE_URL}/admin/dashboard/summary`,
    importUsers: `${BASE_URL}/admin/import-users`,
    getSubadmins: `${BASE_URL}/admin/subadmins`,
    getAllComplaints: `${BASE_URL}/admin/dashboard/complaints`,
    topComplainers: `${BASE_URL}/admin/top-complainers`,
    getUserTimeline: (userId: string) =>
      `${BASE_URL}/admin/user-timeline/${userId}`,
    assignComplaint: (complaintId: string) =>
      `${BASE_URL}/admin/assign/${complaintId}`,
    getFilteredSummary: (month: string, year: string) =>
      `${BASE_URL}/admin/dashboard/summary?month=${month}&year=${year}`,
    createUser: `${BASE_URL}/admin/create-user`,
    getRepeatedComplaints: `${BASE_URL}/admin/dashboard/repeated-complaints`,
    getSubadminDashboardData: `${BASE_URL}/admin/dashboard/subadmins`,
    getSubadminIssueTimeline: (subadminId: string, issueId: string) =>
      `${BASE_URL}/admin/subadmin/${subadminId}/main-issue/${issueId}`,
    getUserSummary: `${BASE_URL}/admin/users/summary`,
    getHighPriorityComplaints: `${BASE_URL}/admin/dashboard/high-priority-complaints`,
    base: `${BASE_URL}/admin`,
    getMainIssues: `${BASE_URL}/admin/main-issues`,
    getRelatedIssues: (mainIssueId: string) =>
      `${BASE_URL}/admin/related-issues?main_issue_id=${mainIssueId}`,
    getSubRelatedIssues: (relatedIssueId: string) =>
      `${BASE_URL}/admin/sub-related-issues?related_issue_id=${relatedIssueId}`,
    getDescriptions: (subRelatedIssueId: string) =>
      `${BASE_URL}/admin/descriptions?sub_related_issue_id=${subRelatedIssueId}`,
    getSolutionsByDescription: (issueDescriptionId: string) =>
      `${BASE_URL}/admin/solutions?issue_description_id=${issueDescriptionId}`,
    updateMainIssue: (id: string) => `${BASE_URL}/admin/db-update/main-issue/${id}`,
    updateRelatedIssue: (id: string) => `${BASE_URL}/admin/db-update/related-issue/${id}`,
    updateSubRelatedIssue: (id: string) => `${BASE_URL}/admin/db-update/sub-related-issue/${id}`,
    updateDescription: (id: string) => `${BASE_URL}/admin/db-update/description/${id}`,
    deleteMainIssue: (id: string) => `${BASE_URL}/admin/db-update/main-issue/${id}`,
    deleteRelatedIssue: (id: string) => `${BASE_URL}/admin/db-update/related-issue/${id}`,
    deleteSubRelatedIssue: (id: string) => `${BASE_URL}/admin/db-update/sub-related-issue/${id}`,
    deleteDescription: (id: string) => `${BASE_URL}/admin/db-update/description/${id}`,
    deleteAllSolutions: (descriptionId: string) =>
      `${BASE_URL}/admin/solutions/delete-all/${descriptionId}`,
    importExcel: `${BASE_URL}/admin/db-update/import`,
    updateSolution: (solutionId: string) => `${BASE_URL}/admin/db-update/solution/${solutionId}`,
    createMainIssue: `${BASE_URL}/admin/db-update/main-issue`,
    createRelatedIssue: `${BASE_URL}/admin/db-update/related-issue`,
    createSubRelatedIssue: `${BASE_URL}/admin/db-update/sub-related-issue`,
    createDescription: `${BASE_URL}/admin/db-update/description`,
    createSolution: `${BASE_URL}/admin/db-update/solution`,
    resetSubadminPassword: `${BASE_URL}/auth/subadmin/reset-password`,
    resetAdminPassword: `${BASE_URL}/auth/admin/reset-password`, // ✅ ADD IT HERE

    getAllAdmins: `${BASE_URL}/admin/admins`,
    deleteAdmin: (staffNo: string) => `${BASE_URL}/admin/admins/${staffNo}`,
    deleteUser: (staffNo: string) => `${BASE_URL}/admin/users/${staffNo}`,
     deleteSubadmin: (staffNo: string) => `${BASE_URL}/admin/subadmins/${staffNo}`,

  },
};

export const STATIC_PATHS = {
  profilePhoto: `https://cms-backend-ceyx.onrender.com/uploads/profile_photos/`,
  defaultProfile: '/default-profile.png',
};