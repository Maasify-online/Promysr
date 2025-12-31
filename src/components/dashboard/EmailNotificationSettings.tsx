import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Clock, Calendar, Save, Eye, Users, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailSettings {
    promise_created_enabled: boolean;
    review_needed_enabled: boolean;
    promise_closed_enabled: boolean;
    promise_missed_enabled: boolean;
    daily_brief_enabled: boolean;
    weekly_reminder_enabled: boolean;
    completion_rejected_enabled: boolean;
    promise_verified_enabled: boolean;
    leader_daily_radar_enabled: boolean;
    leader_weekly_report_enabled: boolean;
    daily_brief_time: string;
    daily_brief_timezone: string;
    daily_brief_days: string[];
    weekly_reminder_day: string;
    weekly_reminder_time: string;
    weekly_reminder_timezone: string;
    weekly_reminder_frequency: string;
    leader_daily_radar_time: string;
    leader_daily_radar_days: string[];
    leader_weekly_report_time: string;
    leader_weekly_report_day: string;
    leader_weekly_report_frequency: string;
    leader_report_timezone: string;
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

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export const EmailNotificationSettings = () => {
    const [settings, setSettings] = useState<EmailSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewType, setPreviewType] = useState<string | null>(null);

    const getEmailPreview = (type: string) => {
        const sampleData: Record<string, any> = {
            'promise-created': {
                title: 'New Promise Assigned',
                preview: `<div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <h2 style="color: #007AFF; margin-top: 0;">New Promise Assigned</h2>
                    <p>Hi <strong>John Doe</strong>,</p>
                    <p>You have been assigned a new promise:</p>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
                        <p style="margin: 0; font-weight: 600;">Complete Q4 Financial Report</p>
                        <p style="margin: 8px 0 0 0; color: #64748b;">Due: Dec 30, 2025</p>
                    </div>
                    <a href="#" style="display: inline-block; background: #007AFF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">View Promise</a>
                </div>`
            },
            'review-needed': {
                title: 'Action Required: Review Needed',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>Manager</strong>,</p>
                    <p style="color: #334155; font-size: 16px;"><strong>John Doe</strong> has marked a promise as complete and needs your verification:</p>
                    <blockquote style="border-left: 4px solid #f59e0b; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "Complete Q4 Financial Report"
                    </blockquote>
                    <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fcd34d;">
                        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Marked Complete:</strong> Dec 29, 2025 at 2:00 PM</p>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <a href="#" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; flex: 1; text-align: center; min-width: 140px;">✓ Verify Completion</a>
                        <a href="#" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; flex: 1; text-align: center; min-width: 140px;">✗ Reject</a>
                    </div>
                </div>`
            },
            'promise-verified': {
                title: '✓ Promise Verified',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>John Doe</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">🎉 Congratulations! Your promise has been <span style="color: #16a34a; font-weight: bold;">verified and completed</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "Complete Q4 Financial Report"
                    </blockquote>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #dcfce7;">
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Verified By:</strong> Manager</p>
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Completion Time:</strong> Dec 29, 2025</p>
                        <p style="margin: 12px 0 4px 0; color: #166534; font-size: 16px; font-weight: 600;">📊 Your Integrity Score: 95%</p>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View My Stats</a>
                </div>`
            },
            'completion-rejected': {
                title: 'Completion Not Verified',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>John Doe</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Your promise completion was <span style="color: #ef4444; font-weight: bold;">not verified</span> by Manager:</p>
                    <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "Complete Q4 Financial Report"
                    </blockquote>
                    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fecaca;">
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Feedback:</strong></p>
                        <p style="margin: 8px 0; color: #991b1b; font-size: 14px;">Please include the financial summary section</p>
                        <p style="margin: 12px 0 4px 0; color: #991b1b; font-size: 14px;"><strong>Rejected At:</strong> Dec 29, 2025</p>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Please review the feedback and resubmit when ready.</p>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Resubmit Completion</a>
                </div>`
            },
            'promise-closed': {
                title: 'Promise Kept',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>Manager</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Good news! <strong>John Doe</strong> has marked a promise as <span style="color: #16a34a; font-weight: bold;">Kept</span>:</p>
                    <blockquote style="border-left: 4px solid #16a34a; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "Complete Q4 Financial Report"
                    </blockquote>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #dcfce7;">
                        <p style="margin: 4px 0; color: #166534; font-size: 14px;"><strong>Completion Time:</strong> Dec 29, 2025</p>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Details</a>
                </div>`
            },
            'promise-missed': {
                title: 'MISSED: Promise Deadline Passed',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>Manager</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">A promise has been <span style="color: #ef4444; font-weight: bold;">missed</span>:</p>
                    <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 24px 0; color: #1e293b; font-size: 18px; font-weight: 500;">
                        "Complete Q4 Financial Report"
                    </blockquote>
                    <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fecaca;">
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Original Due Date:</strong> Dec 28, 2025</p>
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Owner:</strong> John Doe</p>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Dashboard</a>
                </div>`
            },
            'daily-brief': {
                title: 'Your Daily Brief',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <p style="color: #334155; font-size: 16px;">Good Morning <strong>John Doe</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Here are your commitments due today:</p>
                    <div style="margin: 24px 0;">
                        <div style="padding: 16px; border-left: 4px solid #007AFF; background: #f8fafc; margin-bottom: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">"Complete Q4 Financial Report"</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Due by 5:00 PM</p>
                        </div>
                        <div style="padding: 16px; border-left: 4px solid #007AFF; background: #f8fafc; margin-bottom: 12px;">
                            <p style="margin: 0; font-weight: 600; color: #1e293b;">"Review team performance metrics"</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Due by EOD</p>
                        </div>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">Mark as Complete</a>
                </div>`
            },
            'weekly-reminder': {
                title: 'Weekly Accountability Report',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <h2 style="color: #1e293b; margin-bottom: 8px;">📊 Your Weekly Report</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Week of Dec 23, 2025</p>
                    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; color: #0369a1;">This Week's Performance</h3>
                        <p style="margin: 4px 0; color: #075985;">✓ Completed: <strong>5 promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⏳ In Progress: <strong>3 promises</strong></p>
                        <p style="margin: 4px 0; color: #075985;">⚠️ Missed: <strong>1 promise</strong></p>
                        <p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 600; color: #0369a1;">📊 Integrity Score: 92%</p>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Full Report</a>
                </div>`
            },
            'leader-daily-radar': {
                title: '👑 Leader Daily Radar',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <h2 style="color: #1e293b; margin-top: 0;">👑 Leader Briefing</h2>
                    <p style="color: #334155; font-size: 16px;">Hi <strong>Manager</strong>,</p>
                    <p style="color: #334155; font-size: 16px;">Your team has <strong>3 items</strong> due today or overdue:</p>
                    <div style="margin: 24px 0;">
                        <div style="padding: 16px; border-left: 4px solid #ef4444; background: #fef2f2; margin-bottom: 12px; border-radius: 4px;">
                            <p style="margin: 0; font-weight: 600; color: #991b1b;">Sarah Johnson</p>
                            <p style="margin: 4px 0; color: #1e293b;">"Complete client proposal"</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Status: Open | Due: Dec 30, 2025</p>
                        </div>
                        <div style="padding: 16px; border-left: 4px solid #ef4444; background: #fef2f2; margin-bottom: 12px; border-radius: 4px;">
                            <p style="margin: 0; font-weight: 600; color: #991b1b;">Mike Chen</p>
                            <p style="margin: 4px 0; color: #1e293b;">"Update project documentation"</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Status: Missed | Due: Dec 29, 2025</p>
                        </div>
                    </div>
                    <a href="#" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px;">View Team Dashboard</a>
                </div>`
            },
            'leader-weekly-report': {
                title: '👑 Weekly Team Report',
                preview: `<div style="font-family: 'Inter', sans-serif; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="margin-bottom: 24px; text-align: center;">
                        <h1 style="font-weight: 800; font-size: 24px; color: #0f172a; font-family: sans-serif; margin: 0 0 12px 0;">
                            Promy<span style="background: linear-gradient(135deg, #00C9B7 0%, #007AFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Sr</span>
                        </h1>
                        <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #007AFF 0%, #00C9B7 100%); border-radius: 2px;"></div>
                    </div>
                    <h2 style="color: #1e293b; margin-top: 0;">👑 Your Weekly Team Report</h2>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Week of Dec 23, 2025</p>
                    
                    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e9d5ff;">
                        <h3 style="margin: 0 0 12px 0; color: #7c3aed;">Team Performance</h3>
                        <p style="margin: 4px 0; color: #6b21a8;">👥 Team Members: <strong>5</strong></p>
                        <p style="margin: 4px 0; color: #6b21a8;">📋 Active Promises: <strong>12</strong></p>
                        <p style="margin: 4px 0; color: #6b21a8;">⏳ Pending Verification: <strong>3</strong></p>
                        <p style="margin: 4px 0; color: #6b21a8;">⚠️ Overdue: <strong>2</strong></p>
                        <p style="margin: 4px 0; color: #6b21a8;">❌ Missed: <strong>1</strong></p>
                        <p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 600; color: #7c3aed;">📊 Team Avg Integrity: 88%</p>
                    </div>

                    <h3 style="color: #1e293b; margin-bottom: 12px;">🚩 Red Flags (Overdue/Missed)</h3>
                    <div style="margin: 16px 0;">
                        <div style="padding: 12px; background: #fef2f2; border-left: 3px solid #ef4444; margin-bottom: 8px; border-radius: 4px;">
                            <p style="margin: 0; font-weight: 600; color: #991b1b;">Sarah Johnson</p>
                            <p style="margin: 4px 0; color: #1e293b; font-size: 14px;">Complete client proposal</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Overdue | Due: Dec 28, 2025</p>
                        </div>
                    </div>

                    <a href="#" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; margin-top: 24px;">View Team Dashboard</a>
                </div>`
            }
        };

        return sampleData[type] || { title: 'Preview', preview: '<p>No preview available</p>' };
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('email_notification_settings' as any)
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading settings:', error);
                return;
            }

            if (data) {
                const typedData = data as unknown as EmailSettings;
                setSettings({
                    ...typedData,
                    daily_brief_days: typedData.daily_brief_days || []
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
                    daily_brief_timezone: 'Asia/Kolkata', // Default to IST
                    daily_brief_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    weekly_reminder_day: 'monday',
                    weekly_reminder_time: '10:00:00',
                    weekly_reminder_timezone: 'Asia/Kolkata',
                    weekly_reminder_frequency: 'weekly',
                    leader_daily_radar_time: '08:00:00',
                    leader_weekly_report_time: '09:00:00',
                    leader_weekly_report_frequency: 'weekly',
                    leader_report_timezone: 'Asia/Kolkata'
                };

                const { data: newSettings, error: insertError } = await supabase
                    .from('email_notification_settings' as any)
                    .insert({ user_id: user.id, ...defaultSettings })
                    .select()
                    .single();

                if (!insertError && newSettings) {
                    const typedNewSettings = newSettings as unknown as EmailSettings;
                    setSettings({ ...typedNewSettings, daily_brief_days: typedNewSettings.daily_brief_days || [] });
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
                .from('email_notification_settings' as any)
                .update(settings)
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success('Email notification settings saved');

            // IMMEDIATE ACTION: Check scheduler for this user right now
            // This handles the user request: "whenever it is changed it actions on it internally"
            supabase.functions.invoke('send-scheduled-emails', {
                body: { user_id: user.id }
            }).then(({ error: invokeError }) => {
                if (invokeError) console.error('Immediate scheduler check failed:', invokeError);
                else console.log('Immediate scheduler check triggered');
            });

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
                <CardTitle className="text-xl flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Manage how you receive updates about your team and your own tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="leader" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="leader" className="flex items-center gap-2">
                            <span>👑 Team Leader</span>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 ml-2">Team Updates</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="task-owner" className="flex items-center gap-2">
                            <span>👤 Task Owner</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 ml-2">My Tasks</Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* --- LEADER TAB --- */}
                    <TabsContent value="leader" className="space-y-6">
                        <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 mb-4">
                            <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4" />
                                Team Oversight
                            </h3>
                            <p className="text-sm text-purple-700">
                                Configure when you receive updates about your team's performance and slipped promises.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Leader Daily Radar */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col gap-1">
                                        <span className="font-medium flex items-center gap-2">
                                            Daily Team Radar
                                            <Badge variant="outline" className="text-xs font-normal">08:00 AM Default</Badge>
                                        </span>
                                        <span className="text-sm text-muted-foreground">Summary of team tasks due today</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewType('leader-daily-radar')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={settings.leader_daily_radar_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, leader_daily_radar_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {settings.leader_daily_radar_enabled && (
                                    <div className="pl-4 border-l-2 border-purple-200 space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Select
                                                    value={settings.leader_daily_radar_time?.substring(0, 5) || '08:00'}
                                                    onValueChange={(value) => setSettings({ ...settings, leader_daily_radar_time: value + ':00' })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIME_SLOTS.map(time => (
                                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Timezone</Label>
                                                <Select
                                                    value={settings.leader_report_timezone || 'Asia/Kolkata'}
                                                    onValueChange={(value) => setSettings({ ...settings, leader_report_timezone: value })}
                                                >
                                                    <SelectTrigger>
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
                                                        variant={(settings.leader_daily_radar_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).includes(day.value) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            const current = settings.leader_daily_radar_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                                                            const updated = current.includes(day.value)
                                                                ? current.filter(d => d !== day.value)
                                                                : [...current, day.value];
                                                            setSettings({ ...settings, leader_daily_radar_days: updated });
                                                        }}
                                                        className={`w-14 ${!(settings.leader_daily_radar_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']).includes(day.value) ? 'text-muted-foreground' : ''}`}
                                                    >
                                                        {day.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Leader Weekly Report */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col gap-1">
                                        <span className="font-medium flex items-center gap-2">
                                            Weekly Team Report
                                            <Badge variant="outline" className="text-xs font-normal">Mondays</Badge>
                                        </span>
                                        <span className="text-sm text-muted-foreground">Comprehensive team performance analysis</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewType('leader-weekly-report')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={settings.leader_weekly_report_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, leader_weekly_report_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {settings.leader_weekly_report_enabled && (
                                    <div className="pl-4 border-l-2 border-purple-200 space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Send On</Label>
                                                <Select
                                                    value={settings.leader_weekly_report_day || 'monday'}
                                                    onValueChange={(value) => setSettings({ ...settings, leader_weekly_report_day: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DAYS.map(day => (
                                                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Select
                                                    value={settings.leader_weekly_report_time?.substring(0, 5) || '09:00'}
                                                    onValueChange={(value) => setSettings({ ...settings, leader_weekly_report_time: value + ':00' })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIME_SLOTS.map(time => (
                                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Frequency</Label>
                                                <Select
                                                    value={settings.leader_weekly_report_frequency || 'weekly'}
                                                    onValueChange={(value) => setSettings({ ...settings, leader_weekly_report_frequency: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Leader Event Notifications */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <Label className="font-semibold mb-4 block">Event Notifications</Label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Ready for Review</Label>
                                            <p className="text-xs text-muted-foreground">When a team member marks a promise as done</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewType('review-needed')}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={settings.review_needed_enabled}
                                                onCheckedChange={(checked) => setSettings({ ...settings, review_needed_enabled: checked })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Promise Missed</Label>
                                            <p className="text-xs text-muted-foreground">When a deadline passes without completion</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewType('promise-missed')}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={settings.promise_missed_enabled}
                                                onCheckedChange={(checked) => setSettings({ ...settings, promise_missed_enabled: checked })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Promise Created</Label>
                                            <p className="text-xs text-muted-foreground">When you assign or receive a new promise</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewType('promise-created')}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={settings.promise_created_enabled}
                                                onCheckedChange={(checked) => setSettings({ ...settings, promise_created_enabled: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- TASK OWNER TAB --- */}
                    <TabsContent value="task-owner" className="space-y-6">
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                                <User className="w-4 h-4" />
                                My Commitments
                            </h3>
                            <p className="text-sm text-blue-700">
                                Manage notifications for promises you need to deliver.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* User Daily Brief */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col gap-1">
                                        <span className="font-medium">My Daily Brief</span>
                                        <span className="text-sm text-muted-foreground">Your tasks due today</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewType('daily-brief')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={settings.daily_brief_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, daily_brief_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {settings.daily_brief_enabled && (
                                    <div className="pl-4 border-l-2 border-blue-200 space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Select
                                                    value={settings.daily_brief_time.substring(0, 5)}
                                                    onValueChange={(value) => setSettings({ ...settings, daily_brief_time: value + ':00' })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIME_SLOTS.map(time => (
                                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Timezone</Label>
                                                <Select
                                                    value={settings.daily_brief_timezone}
                                                    onValueChange={(value) => setSettings({ ...settings, daily_brief_timezone: value })}
                                                >
                                                    <SelectTrigger>
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
                                    </div>
                                )}
                            </div>

                            {/* User Weekly Reminder */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between">
                                    <Label className="flex flex-col gap-1">
                                        <span className="font-medium">My Weekly Summary</span>
                                        <span className="text-sm text-muted-foreground">Overview of your upcoming week</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewType('weekly-reminder')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={settings.weekly_reminder_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, weekly_reminder_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {settings.weekly_reminder_enabled && (
                                    <div className="pl-4 border-l-2 border-blue-200 space-y-4 pt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Send On</Label>
                                                <Select
                                                    value={settings.weekly_reminder_day}
                                                    onValueChange={(value) => setSettings({ ...settings, weekly_reminder_day: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DAYS.map(day => (
                                                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Select
                                                    value={settings.weekly_reminder_time.substring(0, 5)}
                                                    onValueChange={(value) => setSettings({ ...settings, weekly_reminder_time: value + ':00' })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIME_SLOTS.map(time => (
                                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Event Notifications */}
                            <div className="space-y-4 border rounded-lg p-4 bg-white">
                                <Label className="font-semibold mb-4 block">Event Notifications</Label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Promise Verified</Label>
                                            <p className="text-xs text-muted-foreground">When your leader marks your task as correct</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewType('promise-verified')}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={settings.promise_verified_enabled}
                                                onCheckedChange={(checked) => setSettings({ ...settings, promise_verified_enabled: checked })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Completion Rejected</Label>
                                            <p className="text-xs text-muted-foreground">When your work needs revision</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPreviewType('completion-rejected')}
                                                className="h-8 w-8"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Switch
                                                checked={settings.completion_rejected_enabled}
                                                onCheckedChange={(checked) => setSettings({ ...settings, completion_rejected_enabled: checked })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Save Button */}
                <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save All Preferences'}
                    </Button>
                </div>
            </CardContent>

            {/* Email Preview Modal */}
            <Dialog open={!!previewType} onOpenChange={() => setPreviewType(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{previewType && getEmailPreview(previewType).title}</DialogTitle>
                        <DialogDescription>
                            This is a preview of what the email will look like
                        </DialogDescription>
                    </DialogHeader>
                    <div
                        className="mt-4"
                        dangerouslySetInnerHTML={{ __html: previewType ? getEmailPreview(previewType).preview : '' }}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
};
