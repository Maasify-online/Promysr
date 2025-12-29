import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Clock, Calendar, Save } from 'lucide-react';

interface EmailSettings {
    promise_created_enabled: boolean;
    review_needed_enabled: boolean;
    promise_closed_enabled: boolean;
    promise_missed_enabled: boolean;
    daily_brief_enabled: boolean;
    weekly_reminder_enabled: boolean;
    completion_rejected_enabled: boolean;
    promise_verified_enabled: boolean;
    daily_brief_time: string;
    daily_brief_timezone: string;
    daily_brief_days: string[];
    weekly_reminder_day: string;
    weekly_reminder_time: string;
    weekly_reminder_timezone: string;
    weekly_reminder_frequency: string;
}

const DAYS = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
];

const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Kolkata', label: 'IST (India)' },
    { value: 'America/New_York', label: 'EST (US East)' },
    { value: 'America/Los_Angeles', label: 'PST (US West)' },
    { value: 'Europe/London', label: 'GMT (London)' },
    { value: 'Asia/Tokyo', label: 'JST (Tokyo)' }
];

export const EmailNotificationSettings = () => {
    const [settings, setSettings] = useState<EmailSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('email_notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading settings:', error);
                return;
            }

            if (data) {
                setSettings({
                    ...data,
                    daily_brief_days: data.daily_brief_days || []
                });
            } else {
                // Create default settings
                const defaultSettings: Partial<EmailSettings> = {
                    promise_created_enabled: true,
                    review_needed_enabled: true,
                    promise_closed_enabled: true,
                    promise_missed_enabled: true,
                    daily_brief_enabled: true,
                    weekly_reminder_enabled: true,
                    completion_rejected_enabled: true,
                    promise_verified_enabled: true,
                    daily_brief_time: '08:00:00',
                    daily_brief_timezone: 'UTC',
                    daily_brief_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    weekly_reminder_day: 'monday',
                    weekly_reminder_time: '10:00:00',
                    weekly_reminder_timezone: 'Asia/Kolkata',
                    weekly_reminder_frequency: 'weekly'
                };

                const { data: newSettings, error: insertError } = await supabase
                    .from('email_notification_settings')
                    .insert({ user_id: user.id, ...defaultSettings })
                    .select()
                    .single();

                if (!insertError && newSettings) {
                    setSettings({ ...newSettings, daily_brief_days: newSettings.daily_brief_days || [] });
                }
            }
        } catch (err) {
            console.error('Error in loadSettings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('email_notification_settings')
                .update(settings)
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success('Email notification settings saved');
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        if (!settings) return;
        const days = settings.daily_brief_days || [];
        const newDays = days.includes(day)
            ? days.filter(d => d !== day)
            : [...days, day];
        setSettings({ ...settings, daily_brief_days: newDays });
    };

    if (loading) {
        return <div className="p-6">Loading settings...</div>;
    }

    if (!settings) {
        return <div className="p-6">Failed to load settings</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Customize which email notifications you receive and when
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    {/* Event-Based Notifications */}
                    <AccordionItem value="event-based">
                        <AccordionTrigger className="text-base font-semibold">
                            Event-Based Notifications
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="promise-created" className="flex-1">
                                        <div className="font-medium">Promise Created</div>
                                        <div className="text-sm text-muted-foreground">When a new promise is assigned to you</div>
                                    </Label>
                                    <Switch
                                        id="promise-created"
                                        checked={settings.promise_created_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, promise_created_enabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="review-needed" className="flex-1">
                                        <div className="font-medium">Review Needed</div>
                                        <div className="text-sm text-muted-foreground">When a team member marks a promise as complete</div>
                                    </Label>
                                    <Switch
                                        id="review-needed"
                                        checked={settings.review_needed_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, review_needed_enabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="promise-closed" className="flex-1">
                                        <div className="font-medium">Promise Closed</div>
                                        <div className="text-sm text-muted-foreground">When a promise is verified and closed</div>
                                    </Label>
                                    <Switch
                                        id="promise-closed"
                                        checked={settings.promise_closed_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, promise_closed_enabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="promise-verified" className="flex-1">
                                        <div className="font-medium">Promise Verified</div>
                                        <div className="text-sm text-muted-foreground">When your completed promise is verified</div>
                                    </Label>
                                    <Switch
                                        id="promise-verified"
                                        checked={settings.promise_verified_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, promise_verified_enabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="completion-rejected" className="flex-1">
                                        <div className="font-medium">Completion Rejected</div>
                                        <div className="text-sm text-muted-foreground">When your completion is rejected with feedback</div>
                                    </Label>
                                    <Switch
                                        id="completion-rejected"
                                        checked={settings.completion_rejected_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, completion_rejected_enabled: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="promise-missed" className="flex-1">
                                        <div className="font-medium">Promise Missed</div>
                                        <div className="text-sm text-muted-foreground">When a promise deadline is missed</div>
                                    </Label>
                                    <Switch
                                        id="promise-missed"
                                        checked={settings.promise_missed_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, promise_missed_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Daily Brief */}
                    <AccordionItem value="daily-brief">
                        <AccordionTrigger className="text-base font-semibold">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Daily Brief
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="daily-brief" className="font-medium">Enable Daily Brief</Label>
                                    <Switch
                                        id="daily-brief"
                                        checked={settings.daily_brief_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, daily_brief_enabled: checked })}
                                    />
                                </div>

                                {settings.daily_brief_enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Time</Label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="time"
                                                    value={settings.daily_brief_time.substring(0, 5)}
                                                    onChange={(e) => setSettings({ ...settings, daily_brief_time: e.target.value + ':00' })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                />
                                                <Select
                                                    value={settings.daily_brief_timezone}
                                                    onValueChange={(value) => setSettings({ ...settings, daily_brief_timezone: value })}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIMEZONES.map(tz => (
                                                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Days</Label>
                                            <div className="flex gap-2 flex-wrap">
                                                {DAYS.map(day => (
                                                    <Button
                                                        key={day.value}
                                                        variant={settings.daily_brief_days.includes(day.value) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => toggleDay(day.value)}
                                                        className="w-14"
                                                    >
                                                        {day.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Weekly Reminder */}
                    <AccordionItem value="weekly-reminder">
                        <AccordionTrigger className="text-base font-semibold">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Weekly Reminder
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="weekly-reminder" className="font-medium">Enable Weekly Reminder</Label>
                                    <Switch
                                        id="weekly-reminder"
                                        checked={settings.weekly_reminder_enabled}
                                        onCheckedChange={(checked) => setSettings({ ...settings, weekly_reminder_enabled: checked })}
                                    />
                                </div>

                                {settings.weekly_reminder_enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Day of Week</Label>
                                            <Select
                                                value={settings.weekly_reminder_day}
                                                onValueChange={(value) => setSettings({ ...settings, weekly_reminder_day: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DAYS.map(day => (
                                                        <SelectItem key={day.value} value={day.value}>
                                                            {day.value.charAt(0).toUpperCase() + day.value.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Time</Label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="time"
                                                    value={settings.weekly_reminder_time.substring(0, 5)}
                                                    onChange={(e) => setSettings({ ...settings, weekly_reminder_time: e.target.value + ':00' })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                />
                                                <Select
                                                    value={settings.weekly_reminder_timezone}
                                                    onValueChange={(value) => setSettings({ ...settings, weekly_reminder_timezone: value })}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIMEZONES.map(tz => (
                                                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Frequency</Label>
                                            <Select
                                                value={settings.weekly_reminder_frequency}
                                                onValueChange={(value) => setSettings({ ...settings, weekly_reminder_frequency: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                                                    <SelectItem value="monthly">Monthly (Every 4 weeks)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Save Button */}
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSave} disabled={saving} size="lg">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
