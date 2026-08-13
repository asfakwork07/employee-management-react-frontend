import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { settings } from "../api/services";
import { errorMessage } from "../api/client";
const tabs = ["company", "attendance", "leave", "salary", "security"];
export default function Settings() {
  const [tab, setTab] = useState("company"),
    [s, setS] = useState({});
  const load = async () => {
    try {
      const response = await settings.get();
      setS(response.data || {});
    } catch (error) {
      console.error("Unable to load settings:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);
  const save = async () => {
    try {
      await settings.update(s);
      Swal.fire(
        "Settings Saved",
        "System settings updated successfully.",
        "success",
      );
      load();
    } catch (e) {
      Swal.fire("Unable to Save Settings", errorMessage(e), "error");
    }
  };
  const fields = {
    company: [
      ["companyName", "Company Name"],
      ["companyEmail", "Company Email"],
      ["companyPhone", "Company Phone"],
      ["companyAddress", "Company Address"],
    ],
    attendance: [
      ["officeStartTime", "Office Start Time"],
      ["officeEndTime", "Office End Time"],
      ["workingHours", "Working Hours"],
      ["gracePeriod", "Grace Period"],
    ],
    leave: [
      ["casualLeave", "Casual Leave"],
      ["sickLeave", "Sick Leave"],
      ["earnedLeave", "Earned Leave"],
    ],
    salary: [
      ["pfPercentage", "PF Percentage"],
      ["hraPercentage", "HRA Percentage"],
      ["professionalTax", "Professional Tax"],
      ["defaultAllowance", "Default Allowance"],
    ],
    security: [
      ["minimumPasswordLength", "Minimum Password Length"],
      ["sessionTimeout", "Session Timeout"],
    ],
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-slate-500">
          Configure company-wide EMS settings
        </p>
      </div>
      <div className="card overflow-hidden">
        <div className="flex overflow-auto border-b">
          {tabs.map((x) => (
            <button
              onClick={() => setTab(x)}
              className={`px-5 py-4 capitalize font-semibold cursor-pointer ${tab === x ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500"}`}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-5">
          {fields[tab].map(([k, l]) => (
            <label key={k}>
              <span className="mb-2 block text-sm font-semibold">{l}</span>
              <input
                className="field"
                type={
                  k.toLowerCase().includes("time")
                    ? "time"
                    : typeof s[k] === "number"
                      ? "number"
                      : "text"
                }
                value={s[k] ?? ""}
                onChange={(e) =>
                  setS({
                    ...s,
                    [k]:
                      e.target.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            </label>
          ))}
          {tab === "security" && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!s.forcePasswordChange}
                onChange={(e) =>
                  setS({ ...s, forcePasswordChange: e.target.checked })
                }
              />
              Force password change
            </label>
          )}
        </div>
        <div className="border-t bg-slate-50 p-5 text-right">
          <button className="btn btn-primary" onClick={save}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
