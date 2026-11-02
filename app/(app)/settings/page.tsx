'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { User, Globe, Sliders, Moon, Sun, Laptop, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { INPUT_LANGUAGES, OUTPUT_LANGUAGES, TONES } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = React.useState('');
  const [defaultInputLang, setDefaultInputLang] = React.useState('auto');
  const [defaultOutputLang, setDefaultOutputLang] = React.useState('en-IN');
  const [defaultTone, setDefaultTone] = React.useState('formal');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.fullName || '');
      setDefaultInputLang(profile.default_input_language || 'auto');
      setDefaultOutputLang(profile.default_output_language || 'en-IN');
      setDefaultTone(profile.default_tone || 'formal');
    } else if (user) {
      setDisplayName(user.fullName || '');
    }
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateProfile({
        display_name: displayName,
        default_input_language: defaultInputLang,
        default_output_language: defaultOutputLang,
        default_tone: defaultTone,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Settings saved successfully');
      }
    } catch {
      toast.error('Could not save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences and default AI parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>
              Your public display name and account details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Rahul Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Email Address
              </label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted/40 cursor-not-allowed font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Defaults Preferences Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Default Languages & Tone
            </CardTitle>
            <CardDescription>
              Pre-selected choices in the Studio workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="default-input-lang"
                label="Default Input Language"
                value={defaultInputLang}
                onChange={(e) => setDefaultInputLang(e.target.value)}
              >
                {INPUT_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} — {lang.nativeName}
                  </option>
                ))}
              </Select>

              <Select
                id="default-output-lang"
                label="Default Output Language"
                value={defaultOutputLang}
                onChange={(e) => setDefaultOutputLang(e.target.value)}
              >
                {OUTPUT_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              id="default-letter-tone"
              label="Default Letter Tone"
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* Theme Preferences Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Theme Appearance
            </CardTitle>
            <CardDescription>
              Choose light, dark or follow your system preference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
                { key: 'system', label: 'System', icon: Laptop },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all ${
                    theme === key
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border/70 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit & Logout */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOut}
            className="text-xs text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Log out
          </Button>

          <Button type="submit" disabled={isSaving} className="px-6">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
