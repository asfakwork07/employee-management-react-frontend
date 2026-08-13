import api from "./client";
export const auth = {
  login: (d) => api.post("/auth/login", d),
  changePassword: (d) =>
    api.post("/auth/change-password", d, { responseType: "text" }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resetPassword: (email, otp, newPassword) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),
};
export const employees = {
  all: () => api.get("/employees"),
  one: (id) => api.get(`/employees/${id}`),
  me: () => api.get("/employees/me"),
  create: (d) => api.post("/employees", d, { responseType: "text" }),
  update: (id, d) => api.put(`/employees/${id}`, d),
  remove: (id) => api.delete(`/employees/${id}`, { responseType: "text" }),
  importExcel: (file) => {
    const f = new FormData();
    f.append("file", file);
    return api.post("/employees/import", f, { responseType: "text" });
  },
  createLogin: (id) => api.post(`/users/employee/${id}/account`, {}),
  resetPassword: (id) => api.put(`/users/employee/${id}/reset-password`, {}),
  disable: (id) => api.put(`/users/employee/${id}/disable`, {}),
  enable: (id) => api.put(`/users/employee/${id}/enable`, {}),
  performance: (id, m, y, r = false) =>
    api.get(`/ai/performance/${id}`, {
      params: { month: m, year: y, regenerate: r },
    }),
  myPerformance: (m, y, r = false) =>
    api.get("/ai/performance/me", {
      params: { month: m, year: y, regenerate: r },
    }),
};
export const attendance = {
  checkIn: (id) => api.post("/attendance/check-in", { employeeId: id }),
  checkOut: (id) => api.put("/attendance/check-out", { employeeId: id }),
  all: () => api.get("/attendance"),
  employee: (id) => api.get(`/attendance/employee/${id}`),
  monthly: (id, y, m) =>
    api.get(`/attendance/monthly/${id}`, { params: { year: y, month: m } }),
};
export const leaves = {
  types: () => api.get("/leave-types"),
  all: () => api.get("/leaves"),
  employee: (id) => api.get(`/leaves/employee/${id}`),
  apply: (d) => api.post("/leaves", d),
  approve: (id) => api.put(`/leaves/${id}/approve`, {}),
  reject: (id) => api.put(`/leaves/${id}/reject`, {}),
};
export const salary = {
  all: () => api.get("/salary"),
  employee: (id) => api.get(`/salary/employee/${id}`),
  generate: (d) => api.post("/salary/generate", d),
  payslip: (id) => api.get(`/salary/payslip/${id}`),
  pdf: (id) => api.get(`/salary/payslip/${id}/pdf`, { responseType: "blob" }),
  explain: (id) => api.get(`/ai/payroll/explain/${id}`, { skipGlobalLoader: true }),
};
export const holidays = {
  all: () => api.get("/holidays"),
  upcoming: () => api.get("/holidays/upcoming"),
  create: (d) => api.post("/holidays", d),
  update: (id, d) => api.put(`/holidays/${id}`, d),
  remove: (id) => api.delete(`/holidays/${id}`),
};
export const settings = {
  get: () => api.get("/settings"),
  update: (d) => api.put("/settings", d),
};
export const dashboard = {
  get: () => api.get("/dashboard"),
  brief: () => api.get("/ai/admin/daily-brief"),
};
export const notifications = {
  all: () => api.get("/notifications"),
  count: () => api.get("/notifications/unread-count"),
  read: (id) => api.put(`/notifications/${id}/read`, {}),
  readAll: () => api.put("/notifications/read-all", {}),
  remove: (id) => api.delete(`/notifications/${id}`),
  clear: () => api.delete("/notifications/clear-all"),
};

export const ai = {
  chat: (message) =>
    api.post(
      "/ai/chat",
      { message },
      {
        skipGlobalLoader: true,
      },
    ),
};
