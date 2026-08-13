import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import Modal from "../components/Modal";

import { employees, salary } from "../api/services";

import { errorMessage } from "../api/client";

const months = Array.from(
  {
    length: 12,
  },
  (_, index) => ({
    value: index + 1,

    name: new Date(2000, index).toLocaleString("en", {
      month: "long",
    }),
  }),
);

const currentYear = new Date().getFullYear();

const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getResponseMessage = (response, fallback) => {
  if (typeof response?.data === "string") {
    return response.data;
  }

  return response?.data?.message || fallback;
};

const getDeductions = (item) =>
  Number(item?.pf || 0) +
  Number(item?.professionalTax || 0) +
  Number(item?.incomeTax || 0);

const StatCard = ({ label, value, icon, iconClass }) => (
  <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>

        <p className="mt-2 truncate text-xl font-bold text-slate-800">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <i className={`bi ${icon} text-xl`} />
      </div>
    </div>
  </div>
);

export default function Salary() {
  const role = localStorage.getItem("role") || "";

  const ownEmployeeId = Number(localStorage.getItem("employeeId")) || 0;

  const [employeesList, setEmployeesList] = useState([]);

  const [salaryList, setSalaryList] = useState([]);

  const [filterEmployeeId, setFilterEmployeeId] = useState("");

  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",

    salaryMonth: new Date().getMonth() + 1,

    salaryYear: new Date().getFullYear(),
  });

  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [selectedSalaryId, setSelectedSalaryId] = useState(null);

  const [aiExplanation, setAiExplanation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);

  const [payslipLoading, setPayslipLoading] = useState(false);

  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const [aiLoadingId, setAiLoadingId] = useState(null);

  const loadSalary = async () => {
    setLoading(true);

    try {
      const response =
        role === "ADMIN"
          ? await salary.all()
          : await salary.employee(ownEmployeeId);

      setSalaryList(response.data || []);
    } catch (error) {
      console.error("Salary load error:", error);

      Swal.fire(
        "Unable to Load Salary",
        errorMessage(error) || "Unable to load salary records.",
        "error",
      );
    } finally {
      setLoading(false);
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
      console.error("Employee load error:", error);
    }
  };

  useEffect(() => {
    loadSalary();

    if (role === "ADMIN") {
      loadEmployees();
    }
  }, []);

  const filteredSalaryList = useMemo(() => {
    if (!filterEmployeeId) {
      return salaryList;
    }

    return salaryList.filter(
      (item) => String(item.employeeId) === String(filterEmployeeId),
    );
  }, [salaryList, filterEmployeeId]);

  const totalGross = useMemo(
    () =>
      salaryList.reduce(
        (total, item) => total + Number(item.grossSalary || 0),
        0,
      ),
    [salaryList],
  );

  const totalNet = useMemo(
    () =>
      salaryList.reduce(
        (total, item) => total + Number(item.netSalary || 0),
        0,
      ),
    [salaryList],
  );

  const totalDeductions = useMemo(
    () => salaryList.reduce((total, item) => total + getDeductions(item), 0),
    [salaryList],
  );

  const openGenerateModal = () => {
    setShowGenerateModal(true);
  };

  const closeGenerateModal = () => {
    if (generating) {
      return;
    }

    setShowGenerateModal(false);
  };

  const generateSalary = async () => {
    if (!form.employeeId) {
      Swal.fire("Employee Required", "Please select an employee.", "warning");

      return;
    }

    if (!form.salaryMonth) {
      Swal.fire("Month Required", "Please select salary month.", "warning");

      return;
    }

    if (!form.salaryYear || form.salaryYear < 2000) {
      Swal.fire("Invalid Year", "Please enter a valid salary year.", "warning");

      return;
    }

    const request = {
      employeeId: Number(form.employeeId),

      salaryMonth: Number(form.salaryMonth),

      salaryYear: Number(form.salaryYear),
    };

    setGenerating(true);

    try {
      const response = await salary.generate(request);

      setShowGenerateModal(false);

      await loadSalary();

      await Swal.fire({
        icon: "success",
        title: "Salary Generated",
        text: getResponseMessage(response, "Salary generated successfully."),
      });
    } catch (error) {
      Swal.fire(
        "Unable to Generate Salary",
        errorMessage(error) || "Unable to generate salary.",
        "error",
      );
    } finally {
      setGenerating(false);
    }
  };

  const openPayslip = async (salaryId) => {
    if (!salaryId) {
      Swal.fire("Invalid Salary", "Salary ID is missing.", "error");

      return;
    }

    setPayslipLoading(true);

    setSelectedSalaryId(salaryId);

    try {
      const response = await salary.payslip(salaryId);

      setSelectedPayslip(response.data);
    } catch (error) {
      setSelectedSalaryId(null);

      setSelectedPayslip(null);

      Swal.fire(
        "Unable to Load Payslip",
        errorMessage(error) || "Unable to load payslip.",
        "error",
      );
    } finally {
      setPayslipLoading(false);
    }
  };

  const closePayslip = () => {
    if (payslipLoading || pdfLoadingId) {
      return;
    }

    setSelectedPayslip(null);

    setSelectedSalaryId(null);
  };

  const downloadPdf = async (salaryId) => {
    if (!salaryId) {
      Swal.fire(
        "Invalid Payslip",
        "Salary ID is missing. Please close and open the payslip again.",
        "error",
      );

      return;
    }

    setPdfLoadingId(salaryId);

    try {
      const response = await salary.pdf(salaryId);

      const blob = response.data;

      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Invalid PDF response received.");
      }

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `payslip-${salaryId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);

      Swal.fire(
        "Download Failed",
        errorMessage(error) || "Unable to download payslip.",
        "error",
      );
    } finally {
      setPdfLoadingId(null);
    }
  };

  const explainSalary = async (salaryId) => {
    if (!salaryId) {
      return;
    }

    setAiLoadingId(salaryId);

    setAiExplanation({
      loading: true,
    });

    try {
      const response = await salary.explain(salaryId);

      setAiExplanation(response.data);
    } catch (error) {
      setAiExplanation(null);

      Swal.fire(
        "AI Explanation Failed",
        errorMessage(error) || "Unable to generate payroll explanation.",
        "error",
      );
    } finally {
      setAiLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Salary Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {role === "ADMIN"
              ? "Generate payroll, review payslips and manage employee salary records"
              : "View your salary history, payslips and AI payroll explanations"}
          </p>
        </div>

        {role === "ADMIN" && (
          <button
            type="button"
            onClick={openGenerateModal}
            className="btn btn-primary cursor-pointer"
          >
            <i className="bi bi-cash-stack" />
            Generate Salary
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={role === "EMPLOYEE" ? "My Salary Records" : "Salary Records"}
          value={salaryList.length}
          icon="bi-receipt"
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          label="Total Gross"
          value={money(totalGross)}
          icon="bi-currency-rupee"
          iconClass="bg-green-100 text-green-600"
        />

        <StatCard
          label="Total Deductions"
          value={money(totalDeductions)}
          icon="bi-dash-circle"
          iconClass="bg-red-100 text-red-600"
        />

        <StatCard
          label="Total Net"
          value={money(totalNet)}
          icon="bi-wallet2"
          iconClass="bg-purple-100 text-purple-600"
        />
      </div>

      {role === "ADMIN" && (
        <div className="card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-sm">
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                Employee Filter
              </label>

              <select
                className="field w-full"
                value={filterEmployeeId}
                onChange={(event) => setFilterEmployeeId(event.target.value)}
              >
                <option value="">All Employees</option>

                {employeesList.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredSalaryList.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {salaryList.length}
              </span>{" "}
              salary records
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-800">
            {role === "EMPLOYEE" ? "My Salary History" : "Salary History"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Payroll and payslip records
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-slate-500">
                Loading salary records...
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[1150px]">
              <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Period
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Basic
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Gross
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Deductions
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Net Salary
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSalaryList.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {item.employeeName?.charAt(0) || "E"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.employeeName}
                          </p>

                          <p className="text-xs text-slate-400">
                            Salary ID #{item.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {months[item.salaryMonth - 1]?.name} {item.salaryYear}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {money(item.basicSalary)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-green-700">
                      {money(item.grossSalary)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-red-600">
                      {money(getDeductions(item))}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      {money(item.netSalary)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openPayslip(item.id)}
                          title="View Payslip"
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition hover:bg-blue-200"
                        >
                          <i className="bi bi-file-earmark-text" />
                        </button>

                        <button
                          type="button"
                          onClick={() => explainSalary(item.id)}
                          disabled={aiLoadingId === item.id}
                          title="AI Explain"
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-purple-100 text-purple-700 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <i
                            className={`bi ${
                              aiLoadingId === item.id
                                ? "bi-arrow-repeat animate-spin"
                                : "bi-stars"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSalaryList.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <i className="bi bi-cash-stack text-4xl text-slate-300" />

                      <p className="mt-3 font-semibold text-slate-700">
                        No salary records found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {role === "ADMIN"
                          ? "Generate salary to create payroll records."
                          : "No salary records are available for your account."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showGenerateModal}
        onClose={closeGenerateModal}
        title="Generate Salary"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Employee
            </label>

            <select
              className="field w-full"
              value={form.employeeId}
              disabled={generating}
              onChange={(event) =>
                setForm({
                  ...form,
                  employeeId: event.target.value,
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Salary Month
              </label>

              <select
                className="field w-full"
                value={form.salaryMonth}
                disabled={generating}
                onChange={(event) =>
                  setForm({
                    ...form,
                    salaryMonth: Number(event.target.value),
                  })
                }
              >
                {months.map((month) => (
                  <option value={month.value} key={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Salary Year
              </label>

              <select
                className="field w-full"
                value={form.salaryYear}
                disabled={generating}
                onChange={(event) =>
                  setForm({
                    ...form,
                    salaryYear: Number(event.target.value),
                  })
                }
              >
                {yearOptions.map((year) => (
                  <option value={year} key={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <i className="bi bi-info-circle mt-0.5 text-blue-600" />

              <p className="text-sm leading-6 text-blue-700">
                Salary will be calculated using the configured HRA, allowance,
                PF, professional tax and income tax rules.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={generating}
              onClick={closeGenerateModal}
              className="btn border bg-white"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={generating}
              onClick={generateSalary}
              className="btn btn-primary min-w-40"
            >
              <i
                className={`bi ${
                  generating ? "bi-arrow-repeat animate-spin" : "bi-cash-stack"
                }`}
              />

              {generating ? "Generating..." : "Generate Salary"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedPayslip || payslipLoading}
        onClose={closePayslip}
        title="Salary Payslip"
        width="max-w-4xl"
      >
        {payslipLoading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-3 text-sm text-slate-500">Loading payslip...</p>
          </div>
        ) : (
          selectedPayslip && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedPayslip.employeeName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedPayslip.department} •{" "}
                      {selectedPayslip.designation}
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {months[selectedPayslip.salaryMonth - 1]?.name}{" "}
                    {selectedPayslip.salaryYear}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-green-100">
                  <div className="border-b border-green-100 bg-green-50 px-5 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-green-700">
                      <i className="bi bi-plus-circle" />
                      Earnings
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      ["Basic Salary", selectedPayslip.basicSalary],
                      ["HRA", selectedPayslip.hra],
                      ["Allowance", selectedPayslip.allowance],
                      ["Gross Salary", selectedPayslip.grossSalary],
                    ].map(([label, value]) => (
                      <div
                        className="flex items-center justify-between px-5 py-4"
                        key={label}
                      >
                        <span className="text-slate-600">{label}</span>

                        <span className="font-semibold text-slate-800">
                          {money(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-red-100">
                  <div className="border-b border-red-100 bg-red-50 px-5 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-red-700">
                      <i className="bi bi-dash-circle" />
                      Deductions
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      ["PF", selectedPayslip.pf],
                      ["Professional Tax", selectedPayslip.professionalTax],
                      ["Income Tax", selectedPayslip.incomeTax],
                      ["Total Deductions", getDeductions(selectedPayslip)],
                    ].map(([label, value]) => (
                      <div
                        className="flex items-center justify-between px-5 py-4"
                        key={label}
                      >
                        <span className="text-slate-600">{label}</span>

                        <span className="font-semibold text-slate-800">
                          {money(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-300">Net Salary</p>

                  <p className="mt-1 text-xs text-slate-400">
                    Final payable amount
                  </p>
                </div>

                <p className="text-3xl font-bold">
                  {money(selectedPayslip.netSalary)}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={
                    !selectedSalaryId || pdfLoadingId === selectedSalaryId
                  }
                  onClick={() => downloadPdf(selectedSalaryId)}
                  className="btn btn-primary"
                >
                  <i
                    className={`bi ${
                      pdfLoadingId === selectedSalaryId
                        ? "bi-arrow-repeat animate-spin"
                        : "bi-download"
                    }`}
                  />

                  {pdfLoadingId === selectedSalaryId
                    ? "Downloading..."
                    : "Download PDF"}
                </button>
              </div>
            </div>
          )
        )}
      </Modal>

      <Modal
        open={!!aiExplanation}
        onClose={() => !aiExplanation?.loading && setAiExplanation(null)}
        title="AI Payroll Explainer"
        width="max-w-3xl"
      >
        {aiExplanation?.loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <i className="bi bi-stars animate-pulse text-xl" />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              AI is analyzing your salary
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Preparing a simple payroll explanation...
            </p>
          </div>
        ) : (
          aiExplanation && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Gross Salary", aiExplanation.grossSalary, "text-green-700"],
                  ["Deductions", aiExplanation.totalDeductions, "text-red-700"],
                  ["Net Salary", aiExplanation.netSalary, "text-purple-700"],
                ].map(([label, value, valueClass]) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={label}
                  >
                    <p className="text-xs text-slate-500">{label}</p>

                    <p className={`mt-1 text-lg font-bold ${valueClass}`}>
                      {money(value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <i className="bi bi-stars" />
                  </div>

                  <div>
                    <h3 className="font-bold text-purple-700">
                      AI Explanation
                    </h3>

                    <p className="text-xs text-purple-500">
                      Simple payroll breakdown
                    </p>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
                  {aiExplanation.explanation ||
                    aiExplanation.summary ||
                    "No explanation available."}
                </p>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
