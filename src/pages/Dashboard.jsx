import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

import Swal from "sweetalert2";

import { dashboard, holidays, employees } from "../api/services";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// const Card = ({
//   label,
//   value,
//   icon,
//   iconClass = "bg-blue-100 text-blue-600",
//   helper,
// }) => {
//   return (
//     <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
//       <div className="flex items-center justify-between gap-4">
//         <div className="min-w-0">
//           <p className="text-sm text-slate-500">{label}</p>

//           <p className="mt-2 truncate text-2xl font-bold text-slate-800">
//             {value ?? 0}
//           </p>

//           {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
//         </div>

//         <div
//           className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
//         >
//           <i className={`bi ${icon} text-xl`} />
//         </div>
//       </div>
//     </div>
//   );
// };
const Card = ({
  label,
  value,
  icon,
  iconClass = "bg-blue-100 text-blue-600",
  helper,
  valueClass = "text-slate-800",
}) => {
  return (
    <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>

          <p className={`mt-2 truncate font-bold ${valueClass}`}>
            {value ?? 0}
          </p>

          {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
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
const formatMoney = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) {
    return "--";
  }

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
  if (!value) {
    return "--";
  }

  if (typeof value === "string") {
    return value.substring(0, 8);
  }

  return String(value);
};

// const getAttendanceStatusStyle = (status) => {
//   switch (String(status || "").toUpperCase()) {
//     case "PRESENT":
//       return {
//         icon: "bi-person-check",
//         iconClass: "bg-green-100 text-green-600",
//         badgeClass: "bg-green-100 text-green-700",
//         dotClass: "bg-green-500",
//       };

//     case "LATE":
//       return {
//         icon: "bi-clock-history",
//         iconClass: "bg-orange-100 text-orange-600",
//         badgeClass: "bg-orange-100 text-orange-700",
//         dotClass: "bg-orange-500",
//       };

//     case "ABSENT":
//       return {
//         icon: "bi-person-x",
//         iconClass: "bg-red-100 text-red-600",
//         badgeClass: "bg-red-100 text-red-700",
//         dotClass: "bg-red-500",
//       };

//     case "HALF_DAY":
//       return {
//         icon: "bi-hourglass-split",
//         iconClass: "bg-yellow-100 text-yellow-600",
//         badgeClass: "bg-yellow-100 text-yellow-700",
//         dotClass: "bg-yellow-500",
//       };

//     case "SHORT_HOURS":
//       return {
//         icon: "bi-hourglass-split",
//         iconClass: "bg-red-100 text-red-600",
//         badgeClass: "bg-red-100 text-red-700",
//         dotClass: "bg-red-500",
//       };

//     default:
//       return {
//         icon: "bi-person-dash",
//         iconClass: "bg-slate-100 text-slate-600",
//         badgeClass: "bg-slate-100 text-slate-600",
//         dotClass: "bg-slate-400",
//       };
//   }
// };
const getAttendanceStatusStyle = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "PRESENT":
      return {
        icon: "bi-person-check",
        iconClass: "bg-green-100 text-green-600",
        badgeClass: "bg-green-100 text-green-700",
        dotClass: "bg-green-500",
        textClass: "text-lg text-green-700",
      };

    case "LATE":
      return {
        icon: "bi-clock-history",
        iconClass: "bg-orange-100 text-orange-600",
        badgeClass: "bg-orange-100 text-orange-700",
        dotClass: "bg-orange-500",
        textClass: "text-lg text-orange-700",
      };

    case "ABSENT":
      return {
        icon: "bi-person-x",
        iconClass: "bg-red-100 text-red-600",
        badgeClass: "bg-red-100 text-red-700",
        dotClass: "bg-red-500",
        textClass: "text-lg text-red-700",
      };

    case "HALF_DAY":
      return {
        icon: "bi-hourglass-split",
        iconClass: "bg-yellow-100 text-yellow-600",
        badgeClass: "bg-yellow-100 text-yellow-700",
        dotClass: "bg-yellow-500",
        textClass: "text-lg text-yellow-700",
      };

    case "SHORT_HOURS":
      return {
        icon: "bi-hourglass-split",
        iconClass: "bg-red-100 text-red-600",
        badgeClass: "bg-red-100 text-red-700",
        dotClass: "bg-red-500",
        textClass: "text-base text-red-700",
      };

    default:
      return {
        icon: "bi-person-dash",
        iconClass: "bg-slate-100 text-slate-600",
        badgeClass: "bg-slate-100 text-slate-600",
        dotClass: "bg-slate-400",
        textClass: "text-lg text-slate-600",
      };
  }
};
export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState({});
  const [brief, setBrief] = useState(null);
  const [holiday, setHoliday] = useState(null);
  const [performance, setPerformance] = useState(null);

  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(false);

  const role = localStorage.getItem("role") || "";

  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("employeeName") ||
    "User";

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const response = await dashboard.get();

        setData(response.data || {});
      } catch (error) {
        console.error("Dashboard load error:", error);

        Swal.fire(
          "Dashboard Error",
          "Unable to load dashboard information.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    const loadHoliday = async () => {
      try {
        const response = await holidays.upcoming();

        const responseData = response.data;

        if (Array.isArray(responseData)) {
          setHoliday(responseData[0] || null);
        } else {
          setHoliday(responseData || null);
        }
      } catch (error) {
        console.error("Upcoming holiday error:", error);
      }
    };

    const loadAdminBrief = async () => {
      if (role !== "ADMIN") {
        return;
      }

      try {
        const response = await dashboard.brief();

        setBrief(response.data || null);
      } catch (error) {
        console.error("Admin daily brief error:", error);
      }
    };

    loadDashboard();
    loadHoliday();
    loadAdminBrief();
  }, [role]);

  const attendanceStyle = useMemo(
    () => getAttendanceStatusStyle(data.attendanceStatus),
    [data.attendanceStatus],
  );

  const formattedWorkingHours = useMemo(() => {
    return Number(data.workingHours || 0).toFixed(2);
  }, [data.workingHours]);

  const departmentChartData = useMemo(() => {
    const stats = data.employeesByDepartment || {};

    return {
      labels: Object.keys(stats),

      datasets: [
        {
          label: "Employees",

          data: Object.values(stats),

          backgroundColor: [
            "#3b82f6",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#06b6d4",
            "#6366f1",
            "#ec4899",
            "#84cc16",
          ],

          borderRadius: 7,

          maxBarThickness: 44,
        },
      ],
    };
  }, [data.employeesByDepartment]);

  const leaveChartData = useMemo(() => {
    const stats = data.leaveStatusStats || {};

    return {
      labels: ["Pending", "Approved", "Rejected"],

      datasets: [
        {
          data: [
            Number(stats.PENDING || 0),

            Number(stats.APPROVED || 0),

            Number(stats.REJECTED || 0),
          ],

          backgroundColor: ["#f59e0b", "#22c55e", "#ef4444"],

          borderWidth: 0,

          hoverOffset: 6,
        },
      ],
    };
  }, [data.leaveStatusStats]);

  const payrollChartData = useMemo(() => {
    const stats = data.monthlyPayrollStats || [];

    return {
      labels: stats.map((item) => {
        if (!item.monthName) {
          return "";
        }

        return item.monthName.charAt(0) + item.monthName.slice(1).toLowerCase();
      }),

      datasets: [
        {
          label: "Payroll",

          data: stats.map((item) => Number(item.amount || 0)),

          borderColor: "#2563eb",

          backgroundColor: "rgba(37, 99, 235, 0.10)",

          pointBackgroundColor: "#2563eb",

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,

          pointRadius: 4,

          pointHoverRadius: 6,

          borderWidth: 3,

          tension: 0.35,

          fill: true,
        },
      ],
    };
  }, [data.monthlyPayrollStats]);

  const attendanceChartData = useMemo(() => {
    return {
      labels: ["Present", "Absent"],

      datasets: [
        {
          data: [Number(data.presentToday || 0), Number(data.absentToday || 0)],

          backgroundColor: ["#22c55e", "#ef4444"],

          borderWidth: 0,

          hoverOffset: 6,
        },
      ],
    };
  }, [data.presentToday, data.absentToday]);

  const departmentOptions = useMemo(
    () => ({
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) =>
              ` ${context.raw} employee${Number(context.raw) === 1 ? "" : "s"}`,
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          ticks: {
            color: "#64748b",
          },
        },

        y: {
          beginAtZero: true,

          ticks: {
            precision: 0,
            color: "#64748b",
          },

          grid: {
            color: "#f1f5f9",
          },
        },
      },
    }),
    [],
  );

  const payrollOptions = useMemo(
    () => ({
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false,
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) => ` ${formatMoney(context.raw)}`,
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          ticks: {
            color: "#64748b",
          },
        },

        y: {
          beginAtZero: true,

          ticks: {
            color: "#64748b",

            callback: (value) => {
              if (value >= 100000) {
                return `₹${(value / 100000).toFixed(1)}L`;
              }

              if (value >= 1000) {
                return `₹${Math.round(value / 1000)}K`;
              }

              return `₹${value}`;
            },
          },

          grid: {
            color: "#f1f5f9",
          },
        },
      },
    }),
    [],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,

      maintainAspectRatio: false,

      cutout: "68%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            usePointStyle: true,

            padding: 18,
          },
        },
      },
    }),
    [],
  );

  const generatePerformanceSummary = async () => {
    try {
      setAiLoading(true);

      const now = new Date();

      const response = await employees.myPerformance(
        now.getMonth() + 1,
        now.getFullYear(),
      );

      setPerformance(response.data);
    } catch (error) {
      console.error("AI performance error:", error);

      Swal.fire(
        "AI Summary",
        "Unable to generate performance summary.",
        "error",
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

        <p className="mt-1 text-sm text-slate-500">Welcome back, {userName}</p>
      </div>

      {role === "ADMIN" && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              label="Total Employees"
              value={data.totalEmployees}
              icon="bi-people"
              iconClass="bg-blue-100 text-blue-600"
            />

            <Card
              label="Present Today"
              value={data.presentToday}
              icon="bi-person-check"
              iconClass="bg-green-100 text-green-600"
            />

            <Card
              label="Pending Leaves"
              value={data.pendingLeaves}
              icon="bi-calendar2-week"
              iconClass="bg-orange-100 text-orange-600"
            />

            <Card
              label="Monthly Payroll"
              value={formatMoney(data.monthlyPayroll)}
              icon="bi-cash-stack"
              iconClass="bg-purple-100 text-purple-600"
            />
          </div>

          {brief && (
            <div className="card overflow-hidden border-l-4 border-l-purple-500">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <i className="bi bi-stars text-xl" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-800">
                        AI Admin Daily Brief
                      </h2>

                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        AI
                      </span>
                    </div>

                    <p className="mt-2 leading-7 text-slate-600">
                      {brief.summary}
                    </p>

                    {brief.date && (
                      <p className="mt-3 text-xs text-slate-400">
                        Generated for {brief.date}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="card p-6">
              <div className="mb-5">
                <h2 className="font-bold text-slate-800">
                  Employees by Department
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current employee distribution across departments
                </p>
              </div>

              <div className="h-[320px]">
                <Bar data={departmentChartData} options={departmentOptions} />
              </div>
            </div>

            <div className="card p-6">
              <div className="mb-5">
                <h2 className="font-bold text-slate-800">Today's Attendance</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Present and absent employees today
                </p>
              </div>

              <div className="relative h-[320px]">
                <Doughnut
                  data={attendanceChartData}
                  options={doughnutOptions}
                />

                <div className="pointer-events-none absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-3xl font-bold text-slate-800">
                    {data.totalEmployees || 0}
                  </p>

                  <p className="text-xs text-slate-500">Employees</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card p-6 xl:col-span-2">
              <div className="mb-5">
                <h2 className="font-bold text-slate-800">
                  Monthly Payroll Trend
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Payroll generated across the year
                </p>
              </div>

              <div className="h-[330px]">
                <Line data={payrollChartData} options={payrollOptions} />
              </div>
            </div>

            <div className="card p-6">
              <div className="mb-5">
                <h2 className="font-bold text-slate-800">Leave Status</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current leave request distribution
                </p>
              </div>

              <div className="h-[330px]">
                <Doughnut data={leaveChartData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <i className="bi bi-calendar-event text-xl" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">Upcoming Holiday</h2>

                  <p className="text-sm text-slate-500">
                    Next scheduled company holiday
                  </p>
                </div>
              </div>

              {holiday ? (
                <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4">
                  <p className="text-lg font-semibold text-slate-800">
                    {holiday.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    <i className="bi bi-calendar3 mr-2" />

                    {formatDate(holiday.holidayDate)}

                    {holiday.type && ` • ${holiday.type}`}
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No upcoming holiday
                </p>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <i className="bi bi-lightning-charge text-xl" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">Quick Overview</h2>

                  <p className="text-sm text-slate-500">
                    Today's workforce status
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs text-green-600">Present</p>

                  <p className="mt-1 text-xl font-bold text-green-700">
                    {data.presentToday || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-600">Absent</p>

                  <p className="mt-1 text-xl font-bold text-red-700">
                    {data.absentToday || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="text-xs text-orange-600">Pending Leaves</p>

                  <p className="mt-1 text-xl font-bold text-orange-700">
                    {data.pendingLeaves || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">Departments</p>

                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {Object.keys(data.employeesByDepartment || {}).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {role === "EMPLOYEE" && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              label="Attendance Status"
              value={data.attendanceStatus || "Not Marked"}
              icon={attendanceStyle.icon}
              iconClass={attendanceStyle.iconClass}
              valueClass={attendanceStyle.textClass}
            />

            <Card
              label="Working Hours"
              value={formattedWorkingHours}
              helper="Hours worked today"
              icon="bi-clock"
              iconClass="bg-blue-100 text-blue-600"
            />

            <Card
              label="Pending Leaves"
              value={data.myPendingLeaves || 0}
              icon="bi-calendar2-week"
              iconClass="bg-orange-100 text-orange-600"
            />

            <Card
              label="Latest Net Salary"
              value={
                data.latestNetSalary ? formatMoney(data.latestNetSalary) : "₹0"
              }
              icon="bi-wallet2"
              iconClass="bg-purple-100 text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card p-6 xl:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">
                    Today's Attendance
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your attendance activity for today
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${attendanceStyle.badgeClass}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${attendanceStyle.dotClass}`}
                  />

                  {data.attendanceStatus || "Not Marked"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                      <i className="bi bi-box-arrow-in-right" />
                    </div>

                    <div>
                      <p className="text-xs text-green-700">Check In</p>

                      <p className="mt-1 font-bold text-slate-800">
                        {formatTime(data.checkIn)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <i className="bi bi-box-arrow-right" />
                    </div>

                    <div>
                      <p className="text-xs text-red-700">Check Out</p>

                      <p className="mt-1 font-bold text-slate-800">
                        {formatTime(data.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <i className="bi bi-clock-history" />
                    </div>

                    <div>
                      <p className="text-xs text-blue-700">Working Hours</p>

                      <p className="mt-1 font-bold text-slate-800">
                        {formattedWorkingHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <i className="bi bi-calendar-event text-xl" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">Upcoming Holiday</h2>

                  <p className="text-sm text-slate-500">Next company holiday</p>
                </div>
              </div>

              {holiday ? (
                <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4">
                  <p className="font-semibold text-slate-800">{holiday.name}</p>

                  <p className="mt-2 text-sm text-slate-600">
                    <i className="bi bi-calendar3 mr-2" />

                    {formatDate(holiday.holidayDate)}
                  </p>

                  {holiday.type && (
                    <span className="mt-3 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                      {holiday.type}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No upcoming holiday
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <i className="bi bi-stars" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    AI Performance Summary
                  </h2>

                  <p className="text-sm text-slate-500">
                    Factual monthly attendance and work summary
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={generatePerformanceSummary}
                disabled={aiLoading}
              >
                <i
                  className={`bi ${
                    aiLoading ? "bi-arrow-repeat animate-spin" : "bi-stars"
                  }`}
                />

                {aiLoading ? "Generating..." : "Generate Summary"}
              </button>
            </div>

            {performance ? (
              <div className="mt-5 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
                <div className="flex items-start gap-3">
                  <i className="bi bi-stars mt-1 text-purple-600" />

                  <p className="whitespace-pre-line leading-7 text-slate-700">
                    {performance.summary ||
                      performance.performanceSummary ||
                      JSON.stringify(performance)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 py-10 text-center">
                <i className="bi bi-stars text-4xl text-slate-300" />

                <p className="mt-3 font-medium text-slate-600">
                  No AI summary generated
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Generate a factual performance summary for this month.
                </p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div>
              <h2 className="font-bold text-slate-800">Quick Access</h2>

              <p className="mt-1 text-sm text-slate-500">
                Common employee actions
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => navigate("/attendance")}
                className="group cursor-pointer rounded-xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <i className="bi bi-clock-history" />
                </div>

                <p className="mt-3 font-semibold text-slate-800">Attendance</p>

                <p className="mt-1 text-xs text-slate-500">
                  Check today's attendance
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate("/leaves")}
                className="group cursor-pointer rounded-xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <i className="bi bi-calendar2-check" />
                </div>

                <p className="mt-3 font-semibold text-slate-800">Leaves</p>

                <p className="mt-1 text-xs text-slate-500">
                  Apply or view leave
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate("/salary")}
                className="group cursor-pointer rounded-xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <i className="bi bi-cash-stack" />
                </div>

                <p className="mt-3 font-semibold text-slate-800">Salary</p>

                <p className="mt-1 text-xs text-slate-500">
                  View salary & payslip
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="group cursor-pointer rounded-xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <i className="bi bi-person-circle" />
                </div>

                <p className="mt-3 font-semibold text-slate-800">My Profile</p>

                <p className="mt-1 text-xs text-slate-500">
                  View personal details
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
