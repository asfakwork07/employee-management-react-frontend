import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import Modal from "../components/Modal";
import { holidays } from "../api/services";
import { errorMessage } from "../api/client";

const holidayTypes = ["NATIONAL", "FESTIVAL", "OPTIONAL", "COMPANY"];

const blankHoliday = {
  holidayDate: "",
  name: "",
  type: "NATIONAL",
  description: "",
};

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

const getResponseMessage = (response, fallback) => {
  if (typeof response?.data === "string") {
    return response.data;
  }

  return response?.data?.message || fallback;
};

const getTypeClass = (type) => {
  switch (type) {
    case "NATIONAL":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "FESTIVAL":
      return "bg-purple-100 text-purple-700 border-purple-200";

    case "OPTIONAL":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "COMPANY":
      return "bg-green-100 text-green-700 border-green-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case "NATIONAL":
      return "bi-flag";

    case "FESTIVAL":
      return "bi-stars";

    case "OPTIONAL":
      return "bi-calendar-plus";

    case "COMPANY":
      return "bi-buildings";

    default:
      return "bi-calendar-event";
  }
};

const StatCard = ({ label, value, icon, iconClass }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
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

export default function Holidays() {
  const role = localStorage.getItem("role") || "";

  const [list, setList] = useState([]);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState(blankHoliday);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadHolidays = async () => {
    setLoading(true);

    try {
      const response = await holidays.all();

      setList(response.data || []);
    } catch (error) {
      console.error("Unable to load holidays:", error);

      Swal.fire(
        "Unable to Load Holidays",
        errorMessage(error) || "Unable to load holiday records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const filteredHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();

    return list
      .filter((holiday) => {
        const matchesType = typeFilter === "ALL" || holiday.type === typeFilter;

        const searchable = `
          ${holiday.name || ""}
          ${holiday.description || ""}
          ${holiday.type || ""}
        `.toLowerCase();

        const matchesSearch = !query || searchable.includes(query);

        return matchesType && matchesSearch;
      })
      .sort((a, b) =>
        String(a.holidayDate).localeCompare(String(b.holidayDate)),
      );
  }, [list, search, typeFilter]);

  const stats = useMemo(() => {
    const upcoming = list.filter(
      (holiday) => holiday.holidayDate >= today,
    ).length;

    const past = list.filter((holiday) => holiday.holidayDate < today).length;

    const optional = list.filter(
      (holiday) => holiday.type === "OPTIONAL",
    ).length;

    return {
      total: list.length,
      upcoming,
      past,
      optional,
    };
  }, [list, today]);

  const openAddHoliday = () => {
    setEditId(null);

    setForm({
      ...blankHoliday,
    });

    setShowModal(true);
  };

  const openEditHoliday = (holiday) => {
    setEditId(holiday.id);

    setForm({
      holidayDate: holiday.holidayDate || "",
      name: holiday.name || "",
      type: holiday.type || "NATIONAL",
      description: holiday.description || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditId(null);

    setForm({
      ...blankHoliday,
    });
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.holidayDate) {
      return "Holiday date is required.";
    }

    if (!form.name.trim()) {
      return "Holiday name is required.";
    }

    if (!form.type) {
      return "Holiday type is required.";
    }

    return null;
  };

  const saveHoliday = async () => {
    const validationError = validateForm();

    if (validationError) {
      Swal.fire("Validation Error", validationError, "warning");

      return;
    }

    const payload = {
      holidayDate: form.holidayDate,

      name: form.name.trim(),

      type: form.type,

      description: form.description.trim(),
    };

    setSaving(true);

    try {
      const response = editId
        ? await holidays.update(editId, payload)
        : await holidays.create(payload);

      setShowModal(false);

      await loadHolidays();

      Swal.fire({
        icon: "success",

        title: editId ? "Holiday Updated" : "Holiday Added",

        text: getResponseMessage(
          response,
          editId
            ? "Holiday updated successfully."
            : "Holiday created successfully.",
        ),
      });

      setEditId(null);

      setForm({
        ...blankHoliday,
      });
    } catch (error) {
      Swal.fire(
        "Unable to Save Holiday",
        errorMessage(error) || "Something went wrong.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteHoliday = async (holiday) => {
    const confirmation = await Swal.fire({
      icon: "warning",

      title: "Delete Holiday?",

      html: `
          Are you sure you want to delete
          <b>${holiday.name}</b>?
        `,

      showCancelButton: true,

      confirmButtonText: "Yes, Delete",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#dc2626",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setDeletingId(holiday.id);

    try {
      const response = await holidays.remove(holiday.id);

      await loadHolidays();

      Swal.fire({
        icon: "success",

        title: "Holiday Deleted",

        text: getResponseMessage(response, "Holiday deleted successfully."),
      });
    } catch (error) {
      Swal.fire(
        "Unable to Delete",
        errorMessage(error) || "Unable to delete holiday.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Holidays</h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage the company holiday calendar
          </p>
        </div>

        {role === "ADMIN" && (
          <button
            type="button"
            className="btn btn-primary cursor-pointer"
            onClick={openAddHoliday}
          >
            <i className="bi bi-calendar-plus" />
            Add Holiday
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Holidays"
          value={stats.total}
          icon="bi-calendar-event"
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon="bi-calendar-check"
          iconClass="bg-green-100 text-green-600"
        />

        <StatCard
          label="Past Holidays"
          value={stats.past}
          icon="bi-clock-history"
          iconClass="bg-slate-100 text-slate-600"
        />

        <StatCard
          label="Optional"
          value={stats.optional}
          icon="bi-calendar-plus"
          iconClass="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Search
            </label>

            <div className="relative">
              <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                className="field w-full pl-11"
                placeholder="Search holidays..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:max-w-52">
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
              Holiday Type
            </label>

            <select
              className="field w-full"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="ALL">All Types</option>

              {holidayTypes.map((holidayType) => (
                <option value={holidayType} key={holidayType}>
                  {holidayType}
                </option>
              ))}
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
            {filteredHolidays.length}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{list.length}</span>{" "}
          holidays
        </p>
      </div>

      {loading ? (
        <div className="card flex min-h-[350px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-3 text-sm text-slate-500">Loading holidays...</p>
          </div>
        </div>
      ) : filteredHolidays.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredHolidays.map((holiday) => {
            const upcoming = holiday.holidayDate >= today;

            return (
              <div
                className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                key={holiday.id}
              >
                <div
                  className={`h-1.5 ${
                    upcoming ? "bg-green-500" : "bg-slate-300"
                  }`}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getTypeClass(
                        holiday.type,
                      )}`}
                    >
                      <i className={`bi ${getTypeIcon(holiday.type)}`} />

                      {holiday.type || "--"}
                    </span>

                    {role === "ADMIN" && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Edit Holiday"
                          onClick={() => openEditHoliday(holiday)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 transition hover:bg-yellow-200"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>

                        <button
                          type="button"
                          title="Delete Holiday"
                          disabled={deletingId === holiday.id}
                          onClick={() => deleteHoliday(holiday)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-100 text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <i
                            className={`bi ${
                              deletingId === holiday.id
                                ? "bi-arrow-repeat animate-spin"
                                : "bi-trash"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          upcoming
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <i className="bi bi-calendar-event text-xl" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {holiday.name}
                        </h3>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {formatDate(holiday.holidayDate)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 min-h-[42px] text-sm leading-6 text-slate-600">
                      {holiday.description || "No description available."}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        upcoming ? "text-green-700" : "text-slate-400"
                      }`}
                    >
                      <i
                        className={`bi ${
                          upcoming ? "bi-clock" : "bi-check-circle"
                        }`}
                      />

                      {upcoming ? "Upcoming Holiday" : "Past Holiday"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 text-center">
          <i className="bi bi-calendar-x text-5xl text-slate-300" />

          <p className="mt-4 font-semibold text-slate-700">No holidays found</p>

          <p className="mt-1 text-sm text-slate-500">
            Try changing your filters or add a new holiday.
          </p>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editId ? "Edit Holiday" : "Add Holiday"}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Holiday Date *
            </label>

            <input
              className="field w-full"
              type="date"
              value={form.holidayDate}
              onChange={(event) =>
                updateForm("holidayDate", event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Holiday Name *
            </label>

            <input
              className="field w-full"
              placeholder="e.g. Independence Day"
              value={form.name}
              maxLength={100}
              onChange={(event) => updateForm("name", event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Holiday Type *
            </label>

            <select
              className="field w-full"
              value={form.type}
              onChange={(event) => updateForm("type", event.target.value)}
            >
              {holidayTypes.map((holidayType) => (
                <option value={holidayType} key={holidayType}>
                  {holidayType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              className="field min-h-28 w-full resize-none"
              placeholder="Enter holiday description..."
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {form.description.length}
              /500
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              className="btn border bg-white"
              onClick={closeModal}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              className="btn btn-primary min-w-36"
              onClick={saveHoliday}
            >
              <i
                className={`bi ${
                  saving ? "bi-arrow-repeat animate-spin" : "bi-check-lg"
                }`}
              />

              {saving ? "Saving..." : editId ? "Update Holiday" : "Add Holiday"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
