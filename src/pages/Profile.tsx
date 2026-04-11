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
  "Architecture", "Local markets", "Camping", "Water sports",
];
const DIETARY = ["Vegetarian", "Vegan", "Non-vegetarian", "Pescatarian", "Jain", "Halal", "Kosher", "Gluten-free", "No restrictions"];
const CUISINES = ["Indian", "Italian", "Japanese", "Thai", "Mexican", "Mediterranean", "Chinese", "Korean", "Middle Eastern", "Street food", "French", "American"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Mandarin", "Japanese", "Arabic", "Portuguese", "Korean"];
const ACCOMMODATION = ["Hotels", "Hostels", "Airbnb", "Resorts", "Camping", "Homestays", "Boutique"];
const TRAVEL_STYLES = ["Backpacker", "Luxury", "Budget-friendly", "Adventure", "Cultural", "Foodie", "Wellness", "Party", "Road Trip", "Solo"];
const COMPANIONS = ["Solo", "Partner", "Friends", "Family", "Group tour"];
const MOBILITY = ["No special needs", "Wheelchair access", "Limited walking", "Elevator needed", "Senior-friendly"];
const CULTURAL = ["Spiritual", "Traditional", "Modern", "Offbeat", "Mainstream", "Family-friendly"];
const PACES = ["Packed", "Balanced", "Relaxed"];

const Profile = () => {
  const { profile, isLoading, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState<string[]>([]);
  const [travelPace, setTravelPace] = useState<string[]>([]);
  const [accommodation, setAccommodation] = useState<string[]>([]);
  const [companions, setCompanions] = useState<string[]>([]);
  const [mobility, setMobility] = useState<string[]>([]);
  const [culturalPrefs, setCulturalPrefs] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);

  const ep = () => (profile?.experience_preferences as any) || {};
  const pp = () => (profile?.place_preferences as any) || {};
  const fp = () => (profile?.food_preferences as any) || {};
  const cp = () => (profile?.cultural_preferences as any) || {};

  const startEditing = () => {
    setFullName(profile?.full_name || "");
    setHomeCity(profile?.home_city || "");
    setHomeCountry(profile?.home_country || "");
    setAge(ep().age || "");
    setGender(ep().gender || "");
    setLanguages(ep().languages || []);
    setInterests(ep().interests || []);
    setTravelStyle(ep().travel_style || []);
    setTravelPace(pp().travel_pace ? [pp().travel_pace] : []);
    setAccommodation(pp().preferred_accommodation || []);
    setCompanions(ep().travel_companions || []);
    setMobility(ep().mobility_needs || []);
    setCulturalPrefs(cp().preferences || []);
    setDietary(fp().dietary || []);
    setCuisines(fp().cuisines || []);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        home_city: homeCity,
        home_country: homeCountry,
        experience_preferences: {
          ...ep(),
          interests,
          travel_style: travelStyle,
          travel_companions: companions,
          mobility_needs: mobility,
          age,
          gender,
          languages,
        },
        place_preferences: {
          ...pp(),
          travel_pace: travelPace[0] || "balanced",
          preferred_accommodation: accommodation,
        },
        cultural_preferences: { preferences: culturalPrefs },
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

  const renderBadges = (items: string[], variant: "secondary" | "outline" = "secondary") =>
    items.length ? items.map((i: string) => <Badge key={i} variant={variant} className="text-[10px] sm:text-xs">{i}</Badge>) : <span className="text-muted-foreground text-xs sm:text-sm">Not set</span>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 border-b border-border">
        <Link to="/"><Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></Button></Link>
        <h1 className="text-base sm:text-lg font-display font-bold text-foreground">Profile</h1>
        <div className="ml-auto">
          {editing ? (
            <Button onClick={handleSave} disabled={saving} size="sm" className="gradient-primary border-0 text-xs sm:text-sm">
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button onClick={startEditing} variant="outline" size="sm" className="text-xs sm:text-sm">Edit</Button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {editing ? (
              <>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Name</label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="text-sm" /></div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">City</label><Input value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder="City" className="text-sm" /></div>
                  <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Country</label><Input value={homeCountry} onChange={(e) => setHomeCountry(e.target.value)} placeholder="Country" className="text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Age</label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="text-sm" /></div>
                  <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Gender</label><ChipSelector options={GENDERS} selected={gender ? [gender] : []} onChange={(s) => setGender(s[0] || "")} multiple={false} /></div>
                </div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Languages</label><ChipSelector options={LANGUAGES} selected={languages} onChange={setLanguages} /></div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{profile?.full_name || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{[profile?.home_city, profile?.home_country].filter(Boolean).join(", ") || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Age:</span> <span className="font-medium">{ep().age || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{ep().gender || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Languages:</span> <span className="font-medium">{(ep().languages || []).join(", ") || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Level:</span> <Badge variant="outline" className="text-[10px] sm:text-xs">{profile?.experience_level || "first_timer"}</Badge></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Travel Style */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Travel Style</CardTitle></CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {editing ? (
              <>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Style</label><ChipSelector options={TRAVEL_STYLES} selected={travelStyle} onChange={setTravelStyle} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Pace</label><ChipSelector options={PACES} selected={travelPace} onChange={setTravelPace} multiple={false} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Accommodation</label><ChipSelector options={ACCOMMODATION} selected={accommodation} onChange={setAccommodation} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Travel companions</label><ChipSelector options={COMPANIONS} selected={companions} onChange={setCompanions} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Mobility / accessibility</label><ChipSelector options={MOBILITY} selected={mobility} onChange={setMobility} /></div>
              </>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Style:</span><div className="flex flex-wrap gap-1">{renderBadges(ep().travel_style || [])}</div></div>
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Pace:</span> <Badge variant="outline" className="text-[10px] sm:text-xs">{pp().travel_pace || "—"}</Badge></div>
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Accommodation:</span><div className="flex flex-wrap gap-1">{renderBadges(pp().preferred_accommodation || [], "outline")}</div></div>
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Companions:</span><div className="flex flex-wrap gap-1">{renderBadges(ep().travel_companions || [])}</div></div>
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Mobility:</span><div className="flex flex-wrap gap-1">{renderBadges(ep().mobility_needs || [], "outline")}</div></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Interests & Culture</CardTitle></CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {editing ? (
              <>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Interests</label><ChipSelector options={INTERESTS} selected={interests} onChange={setInterests} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Cultural vibe</label><ChipSelector options={CULTURAL} selected={culturalPrefs} onChange={setCulturalPrefs} /></div>
              </>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Interests:</span><div className="flex flex-wrap gap-1">{renderBadges(ep().interests || [])}</div></div>
                <div><span className="text-xs sm:text-sm text-muted-foreground block mb-1">Cultural:</span><div className="flex flex-wrap gap-1">{renderBadges(cp().preferences || [], "outline")}</div></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Food */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Food Preferences</CardTitle></CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {editing ? (
              <>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Dietary</label><ChipSelector options={DIETARY} selected={dietary} onChange={setDietary} /></div>
                <div><label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Cuisines</label><ChipSelector options={CUISINES} selected={cuisines} onChange={setCuisines} /></div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {renderBadges(fp().dietary || [])}
                {renderBadges(fp().cuisines || [], "outline")}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
