import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { customerProfileApi } from "../../services/api";
import { Button, Card, Input, PageHeader, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const emptyProfile = {
  fullName: "",
  phone: "",
  address: "",
};

export default function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [originalProfile, setOriginalProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isLoginError = (error) => /log\s?in|logged\s?in/i.test(error?.message || "");

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  const setField = (key) => (e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    let alive = true;

    customerProfileApi.getProfile()
      .then((data) => {
        if (!alive) return;
        const nextProfile = {
          fullName: data.fullName || "",
          phone: data.phone || "",
          address: data.address || "",
        };
        setProfile(nextProfile);
        setOriginalProfile(nextProfile);
      })
      .catch((e) => {
        if (!alive) return;
        if (user?.role === "Customer" && isLoginError(e)) {
          setProfile({
            fullName: user?.fullName || "",
            phone: user?.phone || "",
            address: user?.address || "",
          });
          return;
        }
        toast.error(e.message || "Failed to load your profile.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  const validate = () => {
    if (!profile.fullName.trim()) return "Full name is required.";
    if (!profile.phone.trim()) return "Phone number is required.";
    if (!/^\d{10,15}$/.test(profile.phone.trim())) return "Phone must be 10 to 15 digits.";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const res = await customerProfileApi.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
      });
      toast.success(res?.message || "Profile updated successfully.");
      setOriginalProfile(profile);
    } catch (e) {
      toast.error(e.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Manage Profile"
        subtitle="Update your personal information and contact details."
      />

      <Card style={{ padding: "22px", maxWidth: "560px" }}>
        <div style={{ display: "grid", gap: "12px" }}>
          <Input
            label="Full name"
            placeholder="Your full name"
            value={profile.fullName}
            onChange={setField("fullName")}
          />
          <Input
            label="Phone"
            placeholder="98XXXXXXXX"
            value={profile.phone}
            onChange={setField("phone")}
          />
          <Input
            label="Address"
            placeholder="Street, City"
            value={profile.address}
            onChange={setField("address")}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setProfile(originalProfile)} disabled={saving}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
