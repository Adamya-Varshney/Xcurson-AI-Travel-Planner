import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import ChipSelector from "@/components/onboarding/ChipSelector";

const INTERESTS = [
  "Beaches", "Mountains", "Temples", "History", "Art & museums",
  "Nightlife", "Shopping", "Wildlife", "Trekking", "Scuba diving",
  "Photography", "Road trips", "Yoga & meditation", "Festivals",
];
const DIETARY = ["Vegetarian", "Vegan", "Non-vegetarian", "Pescatarian", "Jain", "Halal", "Gluten-free", "No restrictions"];
const CUISINES = ["Indian", "Italian", "Japanese", "Thai", "Mexican", "Mediterranean", "Chinese", "Korean", "Local street food"];

const Profile = () => {
  const { profile, isLoading, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);

  const startEditing = () => {
    setFullName(profile?.full_name || "");
    setHomeCity(profile?.home_city || "");
    setHomeCountry(profile?.home_country || "");
    setInterests((profile?.experience_preferences as any)?.interests || []);
    setDietary((profile?.food_preferences as any)?.dietary || []);
    setCuisines((profile?.food_preferences as any)?.cuisines || []);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        home_city: homeCity,
        home_country: homeCountry,
        experience_preferences: { ...(profile?.experience_preferences as any || {}), interests },
        food_preferences: { dietary, cuisines },
      });
      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-border">
        <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-lg font-display font-bold text-foreground">Profile</h1>
        <div className="ml-auto">
          {editing ? (
            <Button onClick={handleSave} disabled={saving} size="sm" className="gradient-primary border-0">
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button onClick={startEditing} variant="outline" size="sm">Edit</Button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                <Input value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder="City" />
                <Input value={homeCountry} onChange={(e) => setHomeCountry(e.target.value)} placeholder="Country" />
              </>
            ) : (
              <>
                <div><span className="text-sm text-muted-foreground">Name:</span> <span className="font-medium">{profile?.full_name || "—"}</span></div>
                <div><span className="text-sm text-muted-foreground">Location:</span> <span className="font-medium">{[profile?.home_city, profile?.home_country].filter(Boolean).join(", ") || "—"}</span></div>
                <div><span className="text-sm text-muted-foreground">Level:</span> <Badge variant="outline">{profile?.experience_level || "first_timer"}</Badge></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Interests</CardTitle></CardHeader>
          <CardContent>
            {editing ? (
              <ChipSelector options={INTERESTS} selected={interests} onChange={setInterests} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {((profile?.experience_preferences as any)?.interests || []).map((i: string) => <Badge key={i} variant="secondary">{i}</Badge>)}
                {!((profile?.experience_preferences as any)?.interests?.length) && <span className="text-muted-foreground text-sm">Not set</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Food Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Dietary</label>
                  <ChipSelector options={DIETARY} selected={dietary} onChange={setDietary} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Cuisines</label>
                  <ChipSelector options={CUISINES} selected={cuisines} onChange={setCuisines} />
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {((profile?.food_preferences as any)?.dietary || []).map((d: string) => <Badge key={d} variant="secondary">{d}</Badge>)}
                {((profile?.food_preferences as any)?.cuisines || []).map((c: string) => <Badge key={c} variant="outline">{c}</Badge>)}
                {!((profile?.food_preferences as any)?.dietary?.length) && !((profile?.food_preferences as any)?.cuisines?.length) && <span className="text-muted-foreground text-sm">Not set</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
