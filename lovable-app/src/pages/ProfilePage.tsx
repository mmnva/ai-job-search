import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function ProfilePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("United States");
  const [headline, setHeadline] = useState("");
  const [skillsPrimary, setSkillsPrimary] = useState("");
  const [skillsSecondary, setSkillsSecondary] = useState("");
  const [languages, setLanguages] = useState("English: native");
  const [dealbreakers, setDealbreakers] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [experience, setExperience] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setFullName(data.full_name ?? "");
        setLocation(data.location ?? "");
        setCountry(data.country ?? "United States");
        setHeadline(data.headline ?? "");
        setSkillsPrimary((data.skills_primary ?? []).join(", "));
        setSkillsSecondary((data.skills_secondary ?? []).join(", "));
        setDealbreakers((data.dealbreakers ?? []).join(", "));
        setTargetRoles((data.target_roles ?? []).join(", "));
        const langs = Array.isArray(data.languages)
          ? (data.languages as { language?: string; level?: string }[])
              .map((l) => `${l.language ?? ""}: ${l.level ?? ""}`)
              .join("\n")
          : "";
        setLanguages(langs || "English: native");
        setExperience(
          typeof data.experience === "string"
            ? data.experience
            : JSON.stringify(data.experience ?? [], null, 2),
        );
      });
  }, [user]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErr(null);
    const langRows = languages
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [language, ...rest] = line.split(":");
        return { language: language.trim(), level: rest.join(":").trim() || "unspecified" };
      });
    let experienceJson: unknown = [];
    try {
      experienceJson = experience.trim() ? JSON.parse(experience) : [];
    } catch {
      experienceJson = [{ summary: experience }];
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      location,
      country,
      headline,
      languages: langRows,
      skills_primary: skillsPrimary.split(",").map((s) => s.trim()).filter(Boolean),
      skills_secondary: skillsSecondary.split(",").map((s) => s.trim()).filter(Boolean),
      dealbreakers: dealbreakers.split(",").map((s) => s.trim()).filter(Boolean),
      target_roles: targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
      experience: experienceJson,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    nav("/pipeline");
  }

  return (
    <form className="card" onSubmit={onSave}>
      <h1>Profile</h1>
      <p className="muted">Structured profile used for fit scoring and drafting. No fabrication later.</p>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="headline">Headline</label>
          <input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="loc">Location</label>
          <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="country">Country</label>
          <input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="skills">Primary skills (comma-separated)</label>
        <input id="skills" value={skillsPrimary} onChange={(e) => setSkillsPrimary(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="skills2">Secondary skills</label>
        <input id="skills2" value={skillsSecondary} onChange={(e) => setSkillsSecondary(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="langs">Languages (one per line: Language: level)</label>
        <textarea id="langs" rows={3} value={languages} onChange={(e) => setLanguages(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="roles">Target roles</label>
        <input id="roles" value={targetRoles} onChange={(e) => setTargetRoles(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="db">Dealbreakers</label>
        <input id="db" value={dealbreakers} onChange={(e) => setDealbreakers(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="exp">Experience (JSON array or free text)</label>
        <textarea id="exp" rows={8} value={experience} onChange={(e) => setExperience(e.target.value)} />
      </div>
      {err && <p className="error">{err}</p>}
      <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
