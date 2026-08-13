import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import Modal from "../components/Modal";
import { employees, leaves } from "../api/services";
import { errorMessage } from "../api/client";

const initialForm = {
  employeeId: "",
  leaveTypeId: "",
  fromDate: "",
  toDate: "",
  reason: "",
};

const getResponseMessage = (response, fallback) => {
  if (typeof response?.data === "string") {
    return response.data;
  }

  return response?.data?.message || fallback;
};

const getStatusClass = (status) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "bg-green-100 text-green-700 border-green-200";

    case "REJECTED":
      return "bg-red-100 text-red-700 border-red-200";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "bi-check-circle-fill";

    case "REJECTED":
      return "bi-x-circle-fill";

    case "PENDING":
      return "bi-clock-fill";

    default:
      return "bi-circle-fill";
  }
};

export default function Leaves() {
  const role = localStorage.getItem("role") || "";
  const ownEmployeeId = Number(localStorage.getItem("employeeId")) || 0;

  const [employeesList, setEmployeesList] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveList, setLeaveList] = useState([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [form, setForm] = useState({
    ...initialForm,
    employeeId: role === "EMPLOYEE" ? ownEmployeeId : "",
  });

  const loadLeaves = async () => {
    try {
      setLoading(true);

      const response =
        role === "ADMIN"
          ? await leaves.all()
          : await leaves.employee(ownEmployeeId);

      setLeaveList(response.data || []);
    } catch (error) {
      console.error("Unable to load leaves:", error);

      Swal.fire(
        "Unable to Load Leaves",
        errorMessage(error) || "Unable to load leave records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const response = await leaves.types();

      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error("Unable to load leave types:", error);
    }
  };

  const loadEmployees = async () => {
    if (role !== "ADMIN") {
      return;
    }

    try {
      const response = await employees.all();

      const data = response.data || [];

      setEmployeesList(data);

      if (data.length > 0) {
        setForm((previous) => ({
          ...previous,
          employeeId: data[0].id,
        }));
      }
    } catch (error) {
      console.error("Unable to load employees:", error);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
    loadLeaves();

    if (role === "ADMIN") {
      loadEmployees();
    }
  }, []);

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leaveList.filter((leave) => {
      const matchesStatus =
        statusFilter === "ALL" || leave.status === statusFilter;

      const searchableText = `
        ${leave.employeeName || ""}
        ${leave.leaveTypeName || leave.leaveType || ""}
        ${leave.reason || ""}
      `.toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [leaveList, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: leaveList.length,

      pending: leaveList.filter((leave) => leave.status === "PENDING").length,

      approved: leaveList.filter((leave) => leave.status === "APPROVED").length,

      rejected: leaveList.filter((leave) => leave.status === "REJECTED").length,
    };
  }, [leaveList]);

  const resetForm = () => {
    setForm({
      ...initialForm,

      employeeId:
        role === "EMPLOYEE" ? ownEmployeeId : employeesList[0]?.id || "",
    });
  };

  const openApplyModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeApplyModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    resetForm();
  };

  const applyLeave = async () => {
    if (role === "ADMIN" && !form.employeeId) {
      Swal.fire("Employee Required", "Please select an employee.", "warning");

      return;
    }

    if (!form.leaveTypeId) {
      Swal.fire(
        "Leave Type Required",
        "Please select a leave type.",
        "warning",
      );

      return;
    }

    if (!form.fromDate) {
      Swal.fire(
        "From Date Required",
        "Please select leave start date.",
        "warning",
      );

      return;
    }

    if (!form.toDate) {
      Swal.fire("To Date Required", "Please select leave end date.", "warning");

      return;
    }

    if (form.toDate < form.fromDate) {
      Swal.fire(
        "Invalid Date Range",
        "To date cannot be before from date.",
        "warning",
      );

      return;
    }

    if (!form.reason.trim()) {
      Swal.fire(
        "Reason Required",
        "Please enter the reason for leave.",
        "warning",
      );

      return;
    }

    const request = {
      ...form,

      employeeId: role === "EMPLOYEE" ? ownEmployeeId : Number(form.employeeId),

      leaveTypeId: Number(form.leaveTypeId),

      reason: form.reason.trim(),
    };

    try {
      setSubmitting(true);

      const response = await leaves.apply(request);

      setShowModal(false);

      resetForm();

      await loadLeaves();

      await Swal.fire({
        icon: "success",
        title: "Leave Applied",
        text: getResponseMessage(
          response,
          "Leave request submitted successfully.",
        ),
      });
    } catch (error) {
      Swal.fire(
        "Unable to Apply",
        errorMessage(error) || "Unable to submit leave request.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (leave, approve) => {
    const employeeName = leave.employeeName || "this employee";

    const confirmation = await Swal.fire({
      icon: approve ? "question" : "warning",

      title: approve ? "Approve Leave?" : "Reject Leave?",

      text: approve
        ? `Approve leave request for ${employeeName}?`
        : `Reject leave request for ${employeeName}?`,

      showCancelButton: true,

      confirmButtonText: approve ? "Yes, Approve" : "Yes, Reject",

      cancelButtonText: "Cancel",

      confirmButtonColor: approve ? "#16a34a" : "#dc2626",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setActionId(leave.id);

      const response = approve
        ? await leaves.approve(leave.id)
        : await leaves.reject(leave.id);

      await loadLeaves();

      await Swal.fire({
        icon: "success",

        title: approve ? "Leave Approved" : "Leave Rejected",

        text: getResponseMessage(
          response,
          approve
            ? "Leave approved successfully."
            : "Leave rejected successfully.",
        ),
      });
    } catch (error) {
      Swal.fire(
        "Action Failed",
        errorMessage(error) || "Unable to update leave request.",
        "error",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Leave Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {role === "ADMIN"
              ? "Review and manage employee leave requests"
              : "Apply for leave and track your requests"}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary cursor-pointer"
          onClick={openApplyModal}
        >
          <i className="bi bi-calendar-plus" />
          Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card border-l-4 border-l-blue-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Requests</p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {stats.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <i className="bi bi-calendar2-week text-xl" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-yellow-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <i className="bi bi-clock text-xl" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-green-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Approved</p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <i className="bi bi-check-circle text-xl" />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-red-500 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rejected</p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <i className="bi bi-x-circle text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative w-full md:max-w-sm">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              className="field w-full pl-11"
              placeholder="Search employee, leave type or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="field w-full md:max-w-52"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>

            <option value="PENDING">Pending</option>

            <option value="APPROVED">Approved</option>

            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Leave Requests</h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredLeaves.length} of {leaveList.length} requests
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center text-slate-500">
              <i className="bi bi-arrow-repeat inline-block animate-spin text-2xl" />

              <p className="mt-3">Loading leave requests...</p>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-390px)] min-h-[300px] overflow-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold">
                    Employee
                  </th>

                  <th className="p-4 text-left text-sm font-semibold">
                    Leave Type
                  </th>

                  <th className="p-4 text-left text-sm font-semibold">From</th>

                  <th className="p-4 text-left text-sm font-semibold">To</th>

                  <th className="p-4 text-left text-sm font-semibold">
                    Reason
                  </th>

                  <th className="p-4 text-center text-sm font-semibold">
                    Status
                  </th>

                  {role === "ADMIN" && (
                    <th className="p-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {leave.employeeName?.charAt(0) || "E"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {leave.employeeName || "--"}
                          </p>

                          <p className="text-xs text-slate-400">
                            Request #{leave.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                        {leave.leaveTypeName || leave.leaveType || "--"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600">
                      {leave.fromDate || "--"}
                    </td>

                    <td className="p-4 text-slate-600">
                      {leave.toDate || "--"}
                    </td>

                    <td
                      className="max-w-[280px] p-4 text-slate-600"
                      title={leave.reason}
                    >
                      <p className="truncate">{leave.reason || "--"}</p>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          leave.status,
                        )}`}
                      >
                        <i className={`bi ${getStatusIcon(leave.status)}`} />

                        {leave.status || "--"}
                      </span>
                    </td>

                    {role === "ADMIN" && (
                      <td className="p-4 text-center">
                        {leave.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={actionId === leave.id}
                              onClick={() => handleDecision(leave, true)}
                              title="Approve Leave"
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-green-100 text-green-700 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionId === leave.id ? (
                                <i className="bi bi-arrow-repeat animate-spin" />
                              ) : (
                                <i className="bi bi-check-lg" />
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={actionId === leave.id}
                              onClick={() => handleDecision(leave, false)}
                              title="Reject Leave"
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-100 text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Completed
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}

                {filteredLeaves.length === 0 && (
                  <tr>
                    <td
                      colSpan={role === "ADMIN" ? 7 : 6}
                      className="py-16 text-center"
                    >
                      <i className="bi bi-calendar-x text-4xl text-slate-300" />

                      <p className="mt-3 font-semibold text-slate-700">
                        No leave requests found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your filters or apply for a new leave.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeApplyModal} title="Apply Leave">
        <div className="space-y-5">
          {role === "ADMIN" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Employee
              </label>

              <select
                className="field w-full"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employeeId: e.target.value,
                  })
                }
              >
                <option value="">Select Employee</option>

                {employeesList.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.firstName} {employee.lastName}
                    {employee.department ? ` - ${employee.department}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Leave Type
            </label>

            <select
              className="field w-full"
              value={form.leaveTypeId}
              onChange={(e) =>
                setForm({
                  ...form,
                  leaveTypeId: e.target.value,
                })
              }
            >
              <option value="">Select Leave Type</option>

              {leaveTypes.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From Date
              </label>

              <input
                className="field w-full"
                type="date"
                value={form.fromDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fromDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To Date
              </label>

              <input
                className="field w-full"
                type="date"
                min={form.fromDate || undefined}
                value={form.toDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    toDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reason
            </label>

            <textarea
              className="field min-h-28 w-full resize-none"
              placeholder="Enter reason for leave..."
              maxLength={500}
              value={form.reason}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason: e.target.value,
                })
              }
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {form.reason.length}/500
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={submitting}
              onClick={closeApplyModal}
              className="btn cursor-pointer border border-slate-300 bg-white text-slate-700 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              className="btn btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              onClick={applyLeave}
            >
              {submitting ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send" />
                  Submit Leave
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
