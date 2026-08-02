import React, { useState } from "react";
import {
  Users,
  MapPin,
  Phone,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Home,
  Building,
  Globe,
  Mail,
  Heart,
  UserPlus,
  Info,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  age?: number | string;
  occupation?: string;
  phone?: string;
  email?: string;
  address?: {
    country?: string;
    province?: string;
    district?: string;
    municipality?: string;
    ward?: string;
    tole?: string;
    street?: string;
    postalCode?: string;
  };
  citizenshipNumber?: string;
  isEmergencyContact?: boolean;
}

function AddressPreview({ address }: { address: FamilyMember["address"] }) {
  if (!address) return <span className="text-slate-400">—</span>;

  const parts = [
    address.street,
    address.tole,
    address.ward && `Ward ${address.ward}`,
    address.municipality,
    address.district,
    address.province,
    address.country,
    address.postalCode && `Postal: ${address.postalCode}`,
  ].filter(Boolean);

  if (parts.length === 0) return <span className="text-slate-400">—</span>;

  return (
    <div className="space-y-1">
      {parts.map((part, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {part}
          </span>
        </div>
      ))}
    </div>
  );
}

function MobileFamilyCard({
  member,
  index,
}: {
  member: FamilyMember;
  index: number;
}) {
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-white">
              {member.name}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {member.relationship}
              {member.isEmergencyContact && (
                <span className="ml-2 inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <Heart className="w-3 h-3 fill-current" />
                  Emergency
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-2">
        {member.age && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Age: {member.age}
            </span>
          </div>
        )}
        {member.occupation && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
              {member.occupation}
            </span>
          </div>
        )}
      </div>

      {/* Contact Actions */}
      <div className="flex gap-2">
        {member.phone && (
          <button
            onClick={() => handleCopy(member.phone!, "phone")}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {member.phone}
            </span>
            {copied === "phone" ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        )}
        {member.email && (
          <button
            onClick={() => handleCopy(member.email!, "email")}
            className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors group"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            {copied === "email" ? (
              <Check className="w-3 h-3 text-emerald-500 ml-1" />
            ) : null}
          </button>
        )}
      </div>

      {/* Address Toggle */}
      {member.address && (
        <div>
          <button
            onClick={() => setShowAddress(!showAddress)}
            className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Address
              </span>
            </div>
            {showAddress ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAddress && (
            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
              <AddressPreview address={member.address} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FamilyTable({ family }: { family: FamilyMember[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!family || family.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-8">
        <div className="text-center">
          <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            No Family Members
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            No family members have been added to this registration yet.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Family Member
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Family Members
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {family.length} member{family.length !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
          {family.filter((m) => m.isEmergencyContact).length} emergency contact
          {family.filter((m) => m.isEmergencyContact).length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/30">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Member
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Relationship
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Age
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Occupation
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Address
              </th>
            </tr>
          </thead>
          <tbody>
            {family.map((member, index) => (
              <React.Fragment key={member.id || member.name || index}>
                <tr
                  className={`border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    member.isEmergencyContact
                      ? "bg-rose-50/30 dark:bg-rose-900/10"
                      : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-white">
                          {member.name}
                        </div>
                        {member.isEmergencyContact && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400">
                            <Heart className="w-2.5 h-2.5 fill-current" />
                            Emergency Contact
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {member.relationship}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {member.age || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {member.occupation || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {member.phone && (
                        <button
                          onClick={() =>
                            handleCopy(
                              member.phone!,
                              `${member.id || index}-phone`,
                            )
                          }
                          className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{member.phone}</span>
                          {copiedField === `${member.id || index}-phone` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}
                      {member.email && (
                        <button
                          onClick={() =>
                            handleCopy(
                              member.email!,
                              `${member.id || index}-email`,
                            )
                          }
                          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 group"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">
                            {member.email}
                          </span>
                          {copiedField === `${member.id || index}-email` ? (
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {member.address ? (
                      <button
                        onClick={() => toggleRow(member.id || String(index))}
                        className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View Address</span>
                        {expandedRows.has(member.id || String(index)) ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
                {/* Expanded Address Row */}
                {member.address &&
                  expandedRows.has(member.id || String(index)) && (
                    <tr
                      key={`${member.id || index}-address`}
                      className="bg-slate-50 dark:bg-slate-800/30"
                    >
                      <td colSpan={6} className="py-3 px-4">
                        <div className="ml-11 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Home className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Residential Address
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {member.address.street && (
                              <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.street}
                                </span>
                              </div>
                            )}
                            {member.address.tole && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.tole}
                                </span>
                              </div>
                            )}
                            {member.address.ward && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  Ward {member.address.ward}
                                </span>
                              </div>
                            )}
                            {member.address.municipality && (
                              <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.municipality}
                                </span>
                              </div>
                            )}
                            {member.address.district && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.district}
                                </span>
                              </div>
                            )}
                            {member.address.province && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.province}
                                </span>
                              </div>
                            )}
                            {member.address.country && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  {member.address.country}
                                </span>
                              </div>
                            )}
                            {member.address.postalCode && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                  Postal: {member.address.postalCode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-3">
        {family.map((member, index) => (
          <MobileFamilyCard
            key={member.id || index}
            member={member}
            index={index}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            <span>Click on address to expand details</span>
          </div>
          <span>
            {family.length} total member{family.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
