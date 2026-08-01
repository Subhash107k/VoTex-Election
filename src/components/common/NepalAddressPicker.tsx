import React, { useMemo } from "react";
import SearchableSelect from "../dashboard/SearchableSelect.tsx";
import { NEPAL_ADDRESS_DATA } from "../../data/nepalAddressData.ts";
import { MapPin } from "lucide-react";

export interface AddressData {
  country: string;
  province: string;
  district: string;
  municipality: string;
  wardNumber: string;
  tole: string;
}

interface NepalAddressPickerProps {
  title: string;
  value: AddressData;
  onChange: (updated: AddressData) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  isSameAsPermanent?: boolean;
  onToggleSameAsPermanent?: (checked: boolean) => void;
  showSameAsCheckbox?: boolean;
}

export default function NepalAddressPicker({
  title,
  value,
  onChange,
  errors = {},
  disabled = false,
  isSameAsPermanent = false,
  onToggleSameAsPermanent,
  showSameAsCheckbox = false,
}: NepalAddressPickerProps) {
  // Available provinces
  const provinceOptions = useMemo(
    () => NEPAL_ADDRESS_DATA.map((p) => ({ value: p.name, label: p.name })),
    [],
  );

  // Selected province object
  const selectedProvinceObj = useMemo(
    () => NEPAL_ADDRESS_DATA.find((p) => p.name === value.province),
    [value.province],
  );

  // Available districts for selected province
  const districtOptions = useMemo(() => {
    if (!selectedProvinceObj) return [];
    return Object.keys(selectedProvinceObj.districts).map((d) => ({
      value: d,
      label: d,
    }));
  }, [selectedProvinceObj]);

  // Available municipalities for selected district
  const municipalityOptions = useMemo(() => {
    if (!selectedProvinceObj || !value.district) return [];
    const munis = selectedProvinceObj.districts[value.district] || [];
    return munis.map((m) => ({ value: m, label: m }));
  }, [selectedProvinceObj, value.district]);

  const handleProvinceChange = (newProvince: string) => {
    onChange({
      ...value,
      province: newProvince,
      district: "",
      municipality: "",
    });
  };

  const handleDistrictChange = (newDistrict: string) => {
    onChange({
      ...value,
      district: newDistrict,
      municipality: "",
    });
  };

  const handleMunicipalityChange = (newMuni: string) => {
    onChange({
      ...value,
      municipality: newMuni,
    });
  };

  return (
    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-black text-xs uppercase tracking-wider">
            {title}
          </span>
        </div>
      </div>

      {showSameAsCheckbox && onToggleSameAsPermanent && (
        <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3 hover:border-emerald-500/40 transition-colors">
          <input
            id="sameAsPermanentCheck"
            type="checkbox"
            checked={isSameAsPermanent}
            onChange={(e) => onToggleSameAsPermanent(e.target.checked)}
            className="w-4.5 h-4.5 rounded text-emerald-500 bg-slate-900 border-slate-700 outline-none focus:ring-emerald-500 cursor-pointer accent-emerald-500"
          />
          <label
            htmlFor="sameAsPermanentCheck"
            className="select-none cursor-pointer"
          >
            <span className="text-xs font-black text-white block uppercase tracking-wider">
              Same as Permanent Address
            </span>
            <span className="text-[10px] text-slate-500">
              Automatically syncs and locks temporary address fields as
              identical to permanent coordinates.
            </span>
          </label>
        </div>
      )}

      {/* Country Fixed or Select */}
      <div className="grid grid-cols-1 gap-4">
        <div className="w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-white flex items-center justify-between min-h-[38px] border-slate-800">
          <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
            Country *
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {value.country || "Nepal"}
          </span>
        </div>
      </div>

      {/* Cascade Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province */}
        <div>
          <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
            Province (State) *
          </label>
          <SearchableSelect
            options={provinceOptions}
            value={value.province}
            onChange={handleProvinceChange}
            placeholder="Select Province"
            disabled={disabled || isSameAsPermanent}
            error={errors.province}
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
            District *
          </label>
          <SearchableSelect
            options={districtOptions}
            value={value.district}
            onChange={handleDistrictChange}
            placeholder={
              value.province ? "Select District" : "Select Province first"
            }
            disabled={disabled || isSameAsPermanent || !value.province}
            error={errors.district}
          />
        </div>

        {/* Municipality */}
        <div>
          <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
            Municipality *
          </label>
          <SearchableSelect
            options={municipalityOptions}
            value={value.municipality}
            onChange={handleMunicipalityChange}
            placeholder={
              value.district ? "Select Municipality" : "Select District first"
            }
            disabled={disabled || isSameAsPermanent || !value.district}
            error={errors.municipality}
          />
        </div>

        {/* Ward Number */}
        <div className="md:col-span-1">
          <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
            Ward Number *
          </label>
          <input
            placeholder="e.g. 3"
            maxLength={3}
            disabled={disabled || isSameAsPermanent}
            value={value.wardNumber}
            onChange={(e) =>
              onChange({
                ...value,
                wardNumber: e.target.value.replace(/\D/g, ""),
              })
            }
            className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] transition-colors ${
              errors.wardNumber
                ? "border-rose-500"
                : "border-slate-800 focus:border-emerald-500"
            } ${disabled || isSameAsPermanent ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {errors.wardNumber && (
            <p className="text-[10px] text-rose-400 font-medium mt-1">
              {errors.wardNumber}
            </p>
          )}
        </div>

        {/* Tole / Street Name */}
        <div className="md:col-span-2">
          <label className="block text-slate-400 font-bold uppercase mb-1 text-[11px] tracking-wide">
            Tole / Street Name *
          </label>
          <input
            placeholder="e.g. New Baneshwor"
            disabled={disabled || isSameAsPermanent}
            value={value.tole}
            onChange={(e) => onChange({ ...value, tole: e.target.value })}
            className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white outline-none min-h-[38px] transition-colors ${
              errors.tole
                ? "border-rose-500"
                : "border-slate-800 focus:border-emerald-500"
            } ${disabled || isSameAsPermanent ? "opacity-60 cursor-not-allowed" : ""}`}
          />
          {errors.tole && (
            <p className="text-[10px] text-rose-400 font-medium mt-1">
              {errors.tole}
            </p>
          )}
        </div>
      </div>

      {/* Address Summary Badge */}
      {value.province && value.district && value.municipality && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[10px] uppercase font-bold">
            Address Coordinates:
          </span>
          <span className="text-emerald-400 font-bold">
            Ward {value.wardNumber || "?"}, {value.tole || "Tole"},{" "}
            {value.municipality}, {value.district}, {value.province}
          </span>
        </div>
      )}
    </div>
  );
}
