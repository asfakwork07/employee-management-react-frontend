import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { attendance, employees } from "../api/services";
import { errorMessage } from "../api/client";

const months = [
  { value: 1, name: "January" },
  { value: 2, name: "February" },
  { value: 3, name: "March" },
  { value: 4, name: "April" },
  { value: 5, name: "May" },
  { value: 6, name: "June" },
  { value: 7, name: "July" },
  { value: 8, name: "August" },
  { value: 9, name: "September" },
  { value: 10, name: "October" },
  { value: 11, name: "November" },
  { value: 12, name: "December" },
];

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "--";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const formatTime = (value) => {
  if (!value) return "--";

  if (typeof value === "string") {
    return value.substring(0, 8);
  }

  return value;
};

const StatCard = ({ title, value, icon, iconClass }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <i className={`bi ${icon} text-xl`} />
        </div>
      </div>
    </div>
  );
};

export default function Attendance() {
  const role = localStorage.getItem("role") || "";

  const loggedInEmployeeId = Number(localStorage.getItem("employeeId")) || 0;

  const [emps, setEmps] = useState([]);

  const [id, setId] = useState(loggedInEmployeeId);

  const [list, setList] = useState([]);

  const [monthly, setMonthly] = useState([]);

  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [year, setYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(false);

  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const today = getLocalDate();

  const loadEmployeeAttendance = useCallback(async (employeeId) => {
    if (!employeeId) return;

    try {
      const response = await attendance.employee(employeeId);

      setList(response.data || []);
    } catch (error) {
      console.error("Unable to load employee attendance:", error);

      setList([]);
    }
  }, []);

  const loadMonthlyAttendance = useCallback(
    async (employeeId, selectedYear, selectedMonth) => {
      if (!employeeId) return;

      setLoading(true);

      try {
        const response = await attendance.monthly(
          employeeId,
          selectedYear,
          selectedMonth,
        );

        setMonthly(response.data || []);
      } catch (error) {
        console.error("Unable to load monthly attendance:", error);

        setMonthly([]);

        Swal.fire(
          "Attendance Error",
          errorMessage(error) || "Unable to load attendance records.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const initialize = async () => {
      if (role === "ADMIN") {
        setEmployeesLoading(true);

        try {
          const response = await employees.all();

          const employeeList = response.data || [];

          setEmps(employeeList);

          if (employeeList.length > 0) {
            const firstEmployeeId = employeeList[0].id;

            setId(firstEmployeeId);
          }
        } catch (error) {
          console.error("Unable to load employees:", error);

          Swal.fire(
            "Employee Error",
            errorMessage(error) || "Unable to load employees.",
            "error",
          );
        } finally {
          setEmployeesLoading(false);
        }

        return;
      }

      if (role === "EMPLOYEE") {
        if (!loggedInEmployeeId) {
          Swal.fire(
            "Employee Not Linked",
            "Your login account is not linked with an employee record.",
            "error",
          );
        }
      }
    };

    initialize();
  }, [role, loggedInEmployeeId]);

  useEffect(() => {
    if (!id) return;

    loadEmployeeAttendance(id);

    loadMonthlyAttendance(id, year, month);
  }, [id, month, year, loadEmployeeAttendance, loadMonthlyAttendance]);

  const todayRow = useMemo(() => {
    return list.find((item) => item.attendanceDate === today);
  }, [list, today]);

  const presentDays = useMemo(() => {
    return monthly.filter((item) => {
      if (!item.status) {
        return true;
      }

      return item.status.toUpperCase() === "PRESENT";
    }).length;
  }, [monthly]);

  const absentDays = useMemo(() => {
    return monthly.filter((item) => item.status?.toUpperCase() === "ABSENT")
      .length;
  }, [monthly]);

  const totalWorkingHours = useMemo(() => {
    return monthly.reduce((total, item) => {
      const value = Number(item.workingHours);

      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [monthly]);

  const handleAttendanceAction = async (type) => {
    if (role !== "EMPLOYEE") {
      return;
    }

    if (!id) {
      Swal.fire(
        "Employee Not Linked",
        "Your account is not linked with an employee.",
        "error",
      );

      return;
    }

    setActionLoading(true);

    try {
      const response =
        type === "in"
          ? await attendance.checkIn(id)
          : await attendance.checkOut(id);

      const message =
        type === "in"
          ? `Checked in successfully${
              response.data?.checkIn
                ? ` at ${formatTime(response.data.checkIn)}`
                : ""
            }.`
          : `Checked out successfully${
              response.data?.checkOut
                ? ` at ${formatTime(response.data.checkOut)}`
                : ""
            }.`;

      await Swal.fire(
        type === "in" ? "Check-In Successful" : "Check-Out Successful",
        message,
        "success",
      );

      await Promise.all([
        loadEmployeeAttendance(id),
        loadMonthlyAttendance(id, year, month),
      ]);
    } catch (error) {
      console.error("Attendance action failed:", error);

      Swal.fire(
        "Attendance Failed",
        errorMessage(error) || "Unable to update attendance.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const selectedEmployee = useMemo(() => {
    return emps.find((employee) => employee.id === id);
  }, [emps, id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>

        <p className="mt-1 text-sm text-slate-500">
          {role === "ADMIN"
            ? "Monitor employee attendance and monthly records"
            : "Track your check-in, check-out and monthly attendance"}
        </p>
      </div>

      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Employee
            </label>

            <select
              className="field w-full"
              value={id || ""}
              disabled={employeesLoading}
              onChange={(event) => setId(Number(event.target.value))}
            >
              {employeesLoading && <option>Loading employees...</option>}

              {!employeesLoading && emps.length === 0 && (
                <option value="">No employees found</option>
              )}

              {emps.map((employee) => (
                <option value={employee.id} key={employee.id}>
                  {employee.firstName} {employee.lastName}
                  {employee.department ? ` - ${employee.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {selectedEmployee.firstName?.charAt(0)}

                {selectedEmployee.lastName?.charAt(0)}
              </div>

              <div>
                <p className="font-semibold text-slate-800">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>

                <p className="text-sm text-slate-500">
                  {selectedEmployee.designation || "Employee"}

                  {selectedEmployee.department &&
                    ` • ${selectedEmployee.department}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {role === "EMPLOYEE" && (
        <div className="card p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Today's Attendance</p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    todayRow ? "bg-green-500" : "bg-slate-300"
                  }`}
                />

                <p className="font-semibold text-slate-800">
                  {todayRow
                    ? todayRow.checkOut
                      ? "Attendance Completed"
                      : "Currently Checked In"
                    : "Not Checked In"}
                </p>
              </div>

              {todayRow && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>
                    <i className="bi bi-box-arrow-in-right mr-1 text-green-600" />
                    In: {formatTime(todayRow.checkIn)}
                  </span>

                  <span>
                    <i className="bi bi-box-arrow-right mr-1 text-red-600" />
                    Out: {formatTime(todayRow.checkOut)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={actionLoading || !!todayRow}
                onClick={() => handleAttendanceAction("in")}
                className="btn btn-primary min-w-32 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-box-arrow-in-right" />

                {actionLoading ? "Please wait..." : "Check In"}
              </button>

              <button
                type="button"
                disabled={actionLoading || !todayRow || !!todayRow.checkOut}
                onClick={() => handleAttendanceAction("out")}
                className="btn min-w-32 bg-slate-800 text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-box-arrow-right" />
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Present Days"
          value={presentDays}
          icon="bi-person-check"
          iconClass="bg-green-100 text-green-600"
        />

        <StatCard
          title="Absent Days"
          value={absentDays}
          icon="bi-person-x"
          iconClass="bg-red-100 text-red-600"
        />

        <StatCard
          title="Attendance Records"
          value={monthly.length}
          icon="bi-calendar-check"
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Working Hours"
          value={totalWorkingHours ? totalWorkingHours.toFixed(2) : "0"}
          icon="bi-clock-history"
          iconClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Monthly Attendance</h2>

            <p className="mt-1 text-sm text-slate-500">
              Attendance records for the selected month
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Month
              </label>

              <select
                className="field min-w-44"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {months.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Year
              </label>

              <input
                className="field w-32"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading attendance...
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full min-w-[850px]">
              <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Check In
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Check Out
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Working Hours
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {monthly.map((record, index) => (
                  <tr
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                    key={record.id || `${record.attendanceDate}-${index}`}
                  >
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {formatDate(record.attendanceDate)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-green-700">
                        {formatTime(record.checkIn)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {record.checkOut ? (
                        <span className="text-slate-700">
                          {formatTime(record.checkOut)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          <i className="bi bi-exclamation-circle" />
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.workingHours ?? "--"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          record.status?.toUpperCase() === "ABSENT"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {record.status || "PRESENT"}
                      </span>
                    </td>
                  </tr>
                ))}

                {monthly.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <i className="bi bi-calendar-x text-4xl text-slate-300" />

                      <p className="mt-3 font-medium text-slate-600">
                        No attendance records
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        No attendance records are available for this month.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
