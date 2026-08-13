import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";

import Modal from "../components/Modal";
import { employees, attendance, leaves, salary } from "../api/services";
import { errorMessage } from "../api/client";

const PAGE_SIZE = 10;

const blankEmployee = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  salary: "",
  joiningDate: "",
  status: "Active",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "--";

  if (typeof value === "string") {
    return value.substring(0, 8);
  }

  return String(value);
};

const EmployeeStatCard = ({ label, value, icon, iconClass }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{label}</p>

        <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
      </div>

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        <i className={`bi ${icon} text-xl`} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const active = String(status).toLowerCase() === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-green-500" : "bg-red-500"
        }`}
      />

      {status || "--"}
    </span>
  );
};

const AttendanceStatusBadge = ({ status }) => {
  const normalized = String(status || "PRESENT").toUpperCase();

  const style =
    normalized === "ABSENT"
      ? "bg-red-100 text-red-700"
      : normalized === "PRESENT"
        ? "bg-green-100 text-green-700"
        : "bg-orange-100 text-orange-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {normalized}
    </span>
  );
};

const LeaveStatusBadge = ({ status }) => {
  const normalized = String(status || "").toUpperCase();

  const style =
    normalized === "APPROVED"
      ? "bg-green-100 text-green-700"
      : normalized === "REJECTED"
        ? "bg-red-100 text-red-700"
        : "bg-orange-100 text-orange-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {normalized || "--"}
    </span>
  );
};

export default function Employees() {
  const fileInputRef = useRef(null);

  const [list, setList] = useState([]);

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(blankEmployee);

  const [editId, setEditId] = useState(null);
  const [employeeModal, setEmployeeModal] = useState(false);

  const [view, setView] = useState(null);
  const [tab, setTab] = useState("profile");

  const [detail, setDetail] = useState([]);

  const [ai, setAi] = useState(null);

  const [aiMonth, setAiMonth] = useState(new Date().getMonth() + 1);

  const [aiYear, setAiYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [accountActionId, setAccountActionId] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);

    try {
      const response = await employees.all();

      setList(response.data || []);
    } catch (error) {
      console.error("Unable to load employees:", error);

      Swal.fire(
        "Unable to Load Employees",
        errorMessage(error) || "Unable to load employees.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = useMemo(
    () =>
      [
        ...new Set(list.map((employee) => employee.department).filter(Boolean)),
      ].sort(),
    [list],
  );

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return list.filter((employee) => {
      const matchesDepartment = dept === "ALL" || employee.department === dept;

      const matchesStatus = status === "ALL" || employee.status === status;

      const searchable = [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchValue || searchable.includes(searchValue);

      return matchesDepartment && matchesStatus && matchesSearch;
    });
  }, [list, search, dept, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / PAGE_SIZE),
  );

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const activeEmployees = useMemo(
    () => list.filter((employee) => employee.status === "Active").length,
    [list],
  );

  const inactiveEmployees = useMemo(
    () => list.filter((employee) => employee.status === "Inactive").length,
    [list],
  );

  const loginEnabledEmployees = useMemo(
    () => list.filter((employee) => employee.loginEnabled).length,
    [list],
  );

  const openAddEmployee = () => {
    setEditId(null);
    setForm({ ...blankEmployee });
    setEmployeeModal(true);
  };

  const openEditEmployee = (employee) => {
    setEditId(employee.id);

    setForm({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      salary: employee.salary ?? "",
      joiningDate: employee.joiningDate || "",
      status: employee.status || "Active",
    });

    setEmployeeModal(true);
  };

  const closeEmployeeModal = () => {
    if (saving) return;

    setEmployeeModal(false);
    setEditId(null);
    setForm({ ...blankEmployee });
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateEmployee = () => {
    if (!form.firstName.trim()) {
      return "First name is required.";
    }

    if (!form.lastName.trim()) {
      return "Last name is required.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }

    if (!form.department.trim()) {
      return "Department is required.";
    }

    if (!form.designation.trim()) {
      return "Designation is required.";
    }

    if (form.salary === "" || Number(form.salary) < 0) {
      return "Please enter a valid salary.";
    }

    if (!form.joiningDate) {
      return "Joining date is required.";
    }

    return null;
  };

  const saveEmployee = async () => {
    const validationError = validateEmployee();

    if (validationError) {
      Swal.fire("Validation Error", validationError, "warning");

      return;
    }

    const payload = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      designation: form.designation.trim(),
      salary: Number(form.salary),
    };

    setSaving(true);

    try {
      if (editId) {
        await employees.update(editId, payload);
      } else {
        await employees.create(payload);
      }

      closeEmployeeModal();

      await loadEmployees();

      Swal.fire(
        editId ? "Employee Updated" : "Employee Added",
        editId
          ? "Employee details updated successfully."
          : "Employee added successfully.",
        "success",
      );
    } catch (error) {
      console.error("Employee save error:", error);

      Swal.fire(
        "Unable to Save Employee",
        errorMessage(error) || "Something went wrong.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (employee) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Employee?",
      html: `Are you sure you want to delete <b>${employee.firstName} ${employee.lastName}</b>?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await employees.remove(employee.id);

      await loadEmployees();

      Swal.fire(
        "Employee Deleted",
        "Employee deleted successfully.",
        "success",
      );
    } catch (error) {
      Swal.fire(
        "Unable to Delete",
        errorMessage(error) || "Unable to delete employee.",
        "error",
      );
    }
  };

  //   const performAccountAction = async (employee, operation) => {
  //     const actionConfig = {
  //       createLogin: {
  //         title: "Create Login Account?",
  //         text: `Create an EMS login account for ${employee.firstName} ${employee.lastName}?`,
  //       },

  //       resetPassword: {
  //         title: "Reset Password?",
  //         text: `Reset the login password for ${employee.firstName} ${employee.lastName}?`,
  //       },

  //       disable: {
  //         title: "Disable Login?",
  //         text: `${employee.firstName} ${employee.lastName} will no longer be able to sign in.`,
  //       },

  //       enable: {
  //         title: "Enable Login?",
  //         text: `${employee.firstName} ${employee.lastName} will be able to sign in again.`,
  //       },
  //     };

  //     const config = actionConfig[operation];

  //     const confirmation = await Swal.fire({
  //       icon: operation === "disable" ? "warning" : "question",
  //       title: config.title,
  //       text: config.text,
  //       showCancelButton: true,
  //       confirmButtonText: "Continue",
  //     });

  //     if (!confirmation.isConfirmed) {
  //       return;
  //     }

  //     setAccountActionId(employee.id);

  //     try {
  //       const response = await employees[operation](employee.id);

  //       await loadEmployees();

  //       Swal.fire(
  //         "Success",
  //         typeof response.data === "string"
  //           ? response
  //           : "Account updated successfully.",
  //         "success",
  //       );
  //     } catch (error) {
  //       Swal.fire(
  //         "Account Action Failed",
  //         errorMessage(error) || "Unable to update account.",
  //         "error",
  //       );
  //     } finally {
  //       setAccountActionId(null);
  //     }
  //   };

  const performAccountAction = async (employee, operation) => {
    const actionConfig = {
      createLogin: {
        title: "Create Login Account?",
        text: `Create an EMS login account for ${employee.firstName} ${employee.lastName}?`,
      },

      resetPassword: {
        title: "Reset Password?",
        text: `Reset the login password for ${employee.firstName} ${employee.lastName}?`,
      },

      disable: {
        title: "Disable Login?",
        text: `${employee.firstName} ${employee.lastName} will no longer be able to sign in.`,
      },

      enable: {
        title: "Enable Login?",
        text: `${employee.firstName} ${employee.lastName} will be able to sign in again.`,
      },
    };

    const config = actionConfig[operation];

    const confirmation = await Swal.fire({
      icon: operation === "disable" ? "warning" : "question",
      title: config.title,
      text: config.text,
      showCancelButton: true,
      confirmButtonText: "Continue",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setAccountActionId(employee.id);

    try {
      const response = await employees[operation](employee.id);

      await loadEmployees();

      if (operation === "resetPassword") {
        await Swal.fire({
          icon: "success",
          title: "Password Reset Successfully",
          html: `
          <div style="text-align:left">
            <p style="margin-bottom:12px;">
              ${response.data?.message || "Employee password reset successfully"}
            </p>

            <p>
              <strong>Employee:</strong>
              ${response.data?.employeeName || employee.firstName + " " + employee.lastName}
            </p>

            <p>
              <strong>Email:</strong>
              ${response.data?.email || employee.email}
            </p>

            <div style="
              margin-top:16px;
              padding:14px;
              background:#f1f5f9;
              border-radius:8px;
              text-align:center;
            ">
              <div style="
                font-size:12px;
                color:#64748b;
                margin-bottom:5px;
              ">
                Temporary Password
              </div>

              <strong style="
                font-size:20px;
                letter-spacing:1px;
                color:#0f172a;
              ">
                ${response.data?.temporaryPassword || "--"}
              </strong>
            </div>

            <p style="
              margin-top:12px;
              font-size:12px;
              color:#ef4444;
            ">
              Please copy this password before closing.
            </p>
          </div>
        `,
          confirmButtonText: "Done",
        });

        return;
      }

      const message =
        typeof response.data === "string"
          ? response.data
          : response.data?.message || "Account updated successfully.";

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: message,
      });
    } catch (error) {
      Swal.fire(
        "Account Action Failed",
        errorMessage(error) || "Unable to update account.",
        "error",
      );
    } finally {
      setAccountActionId(null);
    }
  };

  const openEmployeeView = (employee) => {
    setView(employee);
    setTab("profile");
    setDetail([]);
    setAi(null);
  };

  const closeEmployeeView = () => {
    setView(null);
    setTab("profile");
    setDetail([]);
    setAi(null);
  };

  const changeTab = async (selectedTab) => {
    setTab(selectedTab);
    setAi(null);

    if (selectedTab === "profile" || selectedTab === "ai") {
      setDetail([]);
      return;
    }

    if (!view?.id) {
      return;
    }

    setDetailLoading(true);
    setDetail([]);

    try {
      let response;

      if (selectedTab === "attendance") {
        response = await attendance.employee(view.id);
      }

      if (selectedTab === "leaves") {
        response = await leaves.employee(view.id);
      }

      if (selectedTab === "salary") {
        response = await salary.employee(view.id);
      }

      setDetail(response?.data || []);
    } catch (error) {
      console.error(`${selectedTab} load error:`, error);

      Swal.fire(
        "Unable to Load",
        errorMessage(error) || `Unable to load ${selectedTab}.`,
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const generateAi = async (regenerate) => {
    if (!view?.id) return;

    setAiLoading(true);

    try {
      const response = await employees.performance(
        view.id,
        aiMonth,
        aiYear,
        regenerate,
      );

      setAi(response.data);
    } catch (error) {
      Swal.fire(
        "AI Summary Error",
        errorMessage(error) || "Unable to generate AI performance summary.",
        "error",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const importEmployeeFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validExtension = /\.(xlsx|xls)$/i.test(file.name);

    if (!validExtension) {
      Swal.fire(
        "Invalid File",
        "Please select an Excel .xlsx or .xls file.",
        "warning",
      );

      event.target.value = "";
      return;
    }

    setImporting(true);

    try {
      await employees.importExcel(file);

      await loadEmployees();

      Swal.fire(
        "Import Completed",
        "Employee file imported successfully.",
        "success",
      );
    } catch (error) {
      Swal.fire(
        "Import Failed",
        errorMessage(error) || "Unable to import employee file.",
        "error",
      );
    } finally {
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDept("ALL");
    setStatus("ALL");
    setPage(1);
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
          {view.firstName?.charAt(0)}
          {view.lastName?.charAt(0)}
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            {view.firstName} {view.lastName}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {view.designation || "--"} • {view.department || "--"}
          </p>

          <div className="mt-2">
            <StatusBadge status={view.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Email Address", view.email],
          ["Phone Number", view.phone],
          ["Department", view.department],
          ["Designation", view.designation],
          ["Salary", formatMoney(view.salary)],
          ["Joining Date", formatDate(view.joiningDate)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>

            <p className="mt-2 font-semibold text-slate-700">{value || "--"}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800">Login Account</h3>

        <div className="mt-4 flex flex-wrap gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              view.loginEnabled
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {view.loginEnabled ? "Login Created" : "No Login Account"}
          </span>

          {view.loginEnabled && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                view.accountEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {view.accountEnabled ? "Account Active" : "Account Disabled"}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>

              <th className="px-4 py-3 text-left">Check In</th>

              <th className="px-4 py-3 text-left">Check Out</th>

              <th className="px-4 py-3 text-left">Working Hours</th>

              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {detail.map((record, index) => (
              <tr
                key={record.id || `${record.attendanceDate}-${index}`}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium">
                  {formatDate(record.attendanceDate)}
                </td>

                <td className="px-4 py-3 text-green-700">
                  {formatTime(record.checkIn)}
                </td>

                <td className="px-4 py-3">{formatTime(record.checkOut)}</td>

                <td className="px-4 py-3">{record.workingHours ?? "--"}</td>

                <td className="px-4 py-3 text-center">
                  <AttendanceStatusBadge status={record.status} />
                </td>
              </tr>
            ))}

            {detail.length === 0 && (
              <tr>
                <td colSpan="5" className="py-14 text-center text-slate-500">
                  <i className="bi bi-calendar-x text-3xl text-slate-300" />

                  <p className="mt-2">No attendance records found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeaves = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[750px]">
          <thead className="sticky top-0 z-10 bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Leave Type</th>

              <th className="px-4 py-3 text-left">From</th>

              <th className="px-4 py-3 text-left">To</th>

              <th className="px-4 py-3 text-left">Reason</th>

              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {detail.map((record, index) => (
              <tr
                key={record.id || index}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium">
                  {record.leaveType || record.type || "--"}
                </td>

                <td className="px-4 py-3">
                  {formatDate(record.startDate || record.fromDate)}
                </td>

                <td className="px-4 py-3">
                  {formatDate(record.endDate || record.toDate)}
                </td>

                <td className="max-w-xs px-4 py-3 text-slate-600">
                  {record.reason || "--"}
                </td>

                <td className="px-4 py-3 text-center">
                  <LeaveStatusBadge status={record.status} />
                </td>
              </tr>
            ))}

            {detail.length === 0 && (
              <tr>
                <td colSpan="5" className="py-14 text-center text-slate-500">
                  No leave records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalary = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Period</th>

              <th className="px-4 py-3 text-right">Basic</th>

              <th className="px-4 py-3 text-right">Gross</th>

              <th className="px-4 py-3 text-right">Deductions</th>

              <th className="px-4 py-3 text-right">Net Salary</th>
            </tr>
          </thead>

          <tbody>
            {detail.map((record, index) => {
              const deductions =
                Number(record.pf || 0) +
                Number(record.professionalTax || 0) +
                Number(record.incomeTax || 0);

              return (
                <tr
                  key={record.id || index}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium">
                    {months[Number(record.salaryMonth) - 1] || "--"}{" "}
                    {record.salaryYear || ""}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {formatMoney(record.basicSalary)}
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-green-700">
                    {formatMoney(record.grossSalary)}
                  </td>

                  <td className="px-4 py-3 text-right text-red-600">
                    {formatMoney(deductions)}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {formatMoney(record.netSalary)}
                  </td>
                </tr>
              );
            })}

            {detail.length === 0 && (
              <tr>
                <td colSpan="5" className="py-14 text-center text-slate-500">
                  No salary records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee records, profiles and login accounts
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label
            className={`btn cursor-pointer border bg-white ${
              importing ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <i
              className={`bi ${
                importing
                  ? "bi-arrow-repeat animate-spin"
                  : "bi-file-earmark-arrow-up"
              }`}
            />

            {importing ? "Importing..." : "Import Excel"}

            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={importEmployeeFile}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddEmployee}
          >
            <i className="bi bi-person-plus" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EmployeeStatCard
          label="Total Employees"
          value={list.length}
          icon="bi-people"
          iconClass="bg-blue-100 text-blue-600"
        />

        <EmployeeStatCard
          label="Active"
          value={activeEmployees}
          icon="bi-person-check"
          iconClass="bg-green-100 text-green-600"
        />

        <EmployeeStatCard
          label="Inactive"
          value={inactiveEmployees}
          icon="bi-person-x"
          iconClass="bg-red-100 text-red-600"
        />

        <EmployeeStatCard
          label="Login Enabled"
          value={loginEnabledEmployees}
          icon="bi-shield-check"
          iconClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-md">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Search
            </label>

            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                className="field w-full pl-10"
                placeholder="Name, email, phone, department..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="w-full lg:max-w-56">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Department
            </label>

            <select
              className="field w-full"
              value={dept}
              onChange={(event) => {
                setDept(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Departments</option>

              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:max-w-48">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Status
            </label>

            <select
              className="field w-full"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Status</option>

              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            className="btn border bg-white"
            onClick={resetFilters}
          >
            <i className="bi bi-arrow-counterclockwise" />
            Reset
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {filteredEmployees.length}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{list.length}</span>{" "}
          employees
        </p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading employees...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-330px)] min-h-[300px] overflow-auto">
              <table className="w-full min-w-[1250px]">
                <thead className="sticky top-0 z-20 bg-slate-800 text-white">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Designation
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Phone
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold">
                      Salary
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Joining Date
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold">
                      Login
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEmployees.map((employee) => (
                    <tr
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                      key={employee.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {employee.firstName?.charAt(0)}
                            {employee.lastName?.charAt(0)}
                          </div>

                          <div>
                            <button
                              type="button"
                              className="cursor-pointer font-semibold text-slate-800 hover:text-blue-600"
                              onClick={() => openEmployeeView(employee)}
                            >
                              {employee.firstName} {employee.lastName}
                            </button>

                            <p className="mt-0.5 text-sm text-slate-500">
                              {employee.email}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              ID #{employee.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {employee.department || "--"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {employee.designation || "--"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {employee.phone || "--"}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-green-700">
                        {formatMoney(employee.salary)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(employee.joiningDate)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={employee.status} />
                      </td>

                      <td className="px-5 py-4 text-center">
                        {!employee.loginEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            <i className="bi bi-person-x" />
                            No Login
                          </span>
                        ) : employee.accountEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            <i className="bi bi-check-circle-fill" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            <i className="bi bi-slash-circle" />
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="View Employee"
                            onClick={() => openEmployeeView(employee)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition hover:bg-blue-200"
                          >
                            <i className="bi bi-eye" />
                          </button>

                          <button
                            type="button"
                            title="Edit Employee"
                            onClick={() => openEditEmployee(employee)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                          >
                            <i className="bi bi-pencil-square" />
                          </button>

                          {!employee.loginEnabled ? (
                            <button
                              type="button"
                              title="Create Login"
                              disabled={accountActionId === employee.id}
                              onClick={() =>
                                performAccountAction(employee, "createLogin")
                              }
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                            >
                              <i className="bi bi-person-lock" />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="Reset Password"
                                disabled={accountActionId === employee.id}
                                onClick={() =>
                                  performAccountAction(
                                    employee,
                                    "resetPassword",
                                  )
                                }
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                              >
                                <i className="bi bi-key-fill" />
                              </button>

                              <button
                                type="button"
                                title={
                                  employee.accountEnabled
                                    ? "Disable Login"
                                    : "Enable Login"
                                }
                                disabled={accountActionId === employee.id}
                                onClick={() =>
                                  performAccountAction(
                                    employee,
                                    employee.accountEnabled
                                      ? "disable"
                                      : "enable",
                                  )
                                }
                                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg disabled:opacity-50 ${
                                  employee.accountEnabled
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                              >
                                <i
                                  className={`bi ${
                                    employee.accountEnabled
                                      ? "bi-person-slash"
                                      : "bi-person-check"
                                  }`}
                                />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            title="Delete Employee"
                            onClick={() => deleteEmployee(employee)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-100 text-red-700 transition hover:bg-red-200"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedEmployees.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="py-16 text-center text-slate-500"
                      >
                        <i className="bi bi-people text-4xl text-slate-300" />

                        <p className="mt-3 font-medium text-slate-700">
                          No employees found
                        </p>

                        <p className="mt-1 text-sm">
                          Try changing your filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn border bg-white"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <i className="bi bi-chevron-left" />
                  Previous
                </button>

                <button
                  type="button"
                  className="btn border bg-white"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Next
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={employeeModal}
        onClose={closeEmployeeModal}
        title={editId ? "Edit Employee" : "Add Employee"}
        width="max-w-3xl"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              First Name *
            </label>

            <input
              className="field w-full"
              value={form.firstName}
              onChange={(event) => updateForm("firstName", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Last Name *
            </label>

            <input
              className="field w-full"
              value={form.lastName}
              onChange={(event) => updateForm("lastName", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Email *
            </label>

            <input
              type="email"
              className="field w-full"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Phone
            </label>

            <input
              className="field w-full"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Department *
            </label>

            <input
              className="field w-full"
              value={form.department}
              onChange={(event) => updateForm("department", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Designation *
            </label>

            <input
              className="field w-full"
              value={form.designation}
              onChange={(event) =>
                updateForm("designation", event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Salary *
            </label>

            <input
              type="number"
              min="0"
              className="field w-full"
              value={form.salary}
              onChange={(event) => updateForm("salary", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Joining Date *
            </label>

            <input
              type="date"
              className="field w-full"
              value={form.joiningDate}
              onChange={(event) =>
                updateForm("joiningDate", event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">
              Status
            </label>

            <select
              className="field w-full"
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
            >
              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            className="btn border bg-white"
            disabled={saving}
            onClick={closeEmployeeModal}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary min-w-36"
            disabled={saving}
            onClick={saveEmployee}
          >
            <i
              className={`bi ${
                saving ? "bi-arrow-repeat animate-spin" : "bi-check-lg"
              }`}
            />

            {saving ? "Saving..." : editId ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!view}
        onClose={closeEmployeeView}
        title={view ? `${view.firstName} ${view.lastName}` : "Employee Details"}
        width="max-w-6xl"
      >
        {view && (
          <>
            <div className="mb-6 overflow-x-auto border-b border-slate-200">
              <div className="flex min-w-max">
                {[
                  ["profile", "Profile", "bi-person"],
                  ["attendance", "Attendance", "bi-calendar-check"],
                  ["leaves", "Leaves", "bi-calendar2-week"],
                  ["salary", "Salary", "bi-cash-stack"],
                  ["ai", "AI Summary", "bi-stars"],
                ].map(([value, label, icon]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => changeTab(value)}
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
                      tab === value
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <i className={`bi ${icon}`} />

                    {label}
                  </button>
                ))}
              </div>
            </div>

            {detailLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading details...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {tab === "profile" && renderProfile()}

                {tab === "attendance" && renderAttendance()}

                {tab === "leaves" && renderLeaves()}

                {tab === "salary" && renderSalary()}

                {tab === "ai" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                          <i className="bi bi-stars" />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-800">
                            AI Performance Summary
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            Generate a factual attendance and work summary for
                            the selected month.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                          Month
                        </label>

                        <select
                          className="field min-w-44"
                          value={aiMonth}
                          onChange={(event) => {
                            setAiMonth(Number(event.target.value));

                            setAi(null);
                          }}
                        >
                          {months.map((monthName, index) => (
                            <option value={index + 1} key={monthName}>
                              {monthName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                          Year
                        </label>

                        <input
                          className="field w-32"
                          type="number"
                          min="2000"
                          max="2100"
                          value={aiYear}
                          onChange={(event) => {
                            setAiYear(Number(event.target.value));

                            setAi(null);
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={aiLoading}
                        onClick={() => generateAi(false)}
                      >
                        <i
                          className={`bi ${
                            aiLoading
                              ? "bi-arrow-repeat animate-spin"
                              : "bi-stars"
                          }`}
                        />

                        {aiLoading ? "Generating..." : "Generate"}
                      </button>

                      <button
                        type="button"
                        className="btn bg-purple-100 text-purple-700 hover:bg-purple-200"
                        disabled={aiLoading}
                        onClick={() => generateAi(true)}
                      >
                        <i className="bi bi-arrow-clockwise" />
                        Regenerate
                      </button>
                    </div>

                    {ai && (
                      <div className="rounded-xl border border-purple-100 bg-purple-50 p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <i className="bi bi-stars text-purple-600" />

                          <h3 className="font-bold text-slate-800">
                            AI Summary
                          </h3>
                        </div>

                        <p className="whitespace-pre-line leading-7 text-slate-700">
                          {ai.summary ||
                            ai.performanceSummary ||
                            JSON.stringify(ai, null, 2)}
                        </p>
                      </div>
                    )}

                    {!ai && (
                      <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                        <i className="bi bi-stars text-4xl text-slate-300" />

                        <p className="mt-3 font-medium text-slate-600">
                          No AI summary generated
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Select month and year, then click Generate.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
