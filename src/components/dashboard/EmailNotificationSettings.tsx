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
import { Bell, Clock, Calendar, Save, Eye } from 'lucide-react';

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
                    daily_brief_timezone: 'UTC',
                    daily_brief_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    weekly_reminder_day: 'monday',
                    weekly_reminder_time: '10:00:00',
                    weekly_reminder_timezone: 'Asia/Kolkata',
                    weekly_reminder_frequency: 'weekly'
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
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="promise-created" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Promise Created</span>
                                            <Badge variant="secondary" className="text-xs">Task Owner</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When a new promise is assigned to you</div>
                                    </Label>
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
                                            id="promise-created"
                                            checked={settings.promise_created_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, promise_created_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="review-needed" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Review Needed</span>
                                            <Badge variant="default" className="text-xs bg-blue-600">Leader</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When a team member marks a promise as complete</div>
                                    </Label>
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
                                            id="review-needed"
                                            checked={settings.review_needed_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, review_needed_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="promise-closed" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Promise Closed</span>
                                            <Badge variant="default" className="text-xs bg-blue-600">Leader</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When a promise is verified and closed</div>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewType('promise-closed')}
                                            className="h-8 w-8"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            id="promise-closed"
                                            checked={settings.promise_closed_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, promise_closed_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="promise-verified" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Promise Verified</span>
                                            <Badge variant="secondary" className="text-xs">Task Owner</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When your completed promise is verified</div>
                                    </Label>
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
                                            id="promise-verified"
                                            checked={settings.promise_verified_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, promise_verified_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="completion-rejected" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Completion Rejected</span>
                                            <Badge variant="secondary" className="text-xs">Task Owner</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When your completion is rejected with feedback</div>
                                    </Label>
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
                                            id="completion-rejected"
                                            checked={settings.completion_rejected_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, completion_rejected_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="promise-missed" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Promise Missed</span>
                                            <Badge variant="default" className="text-xs bg-blue-600">Leader</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">When a promise deadline is missed</div>
                                    </Label>
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
                                            id="promise-missed"
                                            checked={settings.promise_missed_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, promise_missed_enabled: checked })}
                                        />
                                    </div>
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
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="daily-brief" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Enable Daily Brief</span>
                                            <Badge variant="secondary" className="text-xs">Task Owner</Badge>
                                        </div>
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
                                            id="daily-brief"
                                            checked={settings.daily_brief_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, daily_brief_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {/* Leader Radar Toggle */}
                                <div className="flex items-center justify-between gap-2 pl-4 border-l-2 border-purple-200">
                                    <Label htmlFor="leader-daily-radar" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">👑 Enable Leader Daily Radar</span>
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Leader</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Receive team member tasks due today</div>
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
                                            id="leader-daily-radar"
                                            checked={settings.leader_daily_radar_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, leader_daily_radar_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {settings.daily_brief_enabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Time</Label>
                                            <div className="flex gap-2">
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={settings.daily_brief_time.substring(0, 5)}
                                                        onValueChange={(value) => setSettings({ ...settings, daily_brief_time: value + ':00' })}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select time" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TIME_SLOTS.map(time => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                <div className="flex items-center justify-between gap-2">
                                    <Label htmlFor="weekly-reminder" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Enable Weekly Reminder</span>
                                            <Badge variant="secondary" className="text-xs">Task Owner</Badge>
                                        </div>
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
                                            id="weekly-reminder"
                                            checked={settings.weekly_reminder_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, weekly_reminder_enabled: checked })}
                                        />
                                    </div>
                                </div>

                                {/* Leader Weekly Report Toggle */}
                                <div className="flex items-center justify-between gap-2 pl-4 border-l-2 border-purple-200">
                                    <Label htmlFor="leader-weekly-report" className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">👑 Enable Leader Weekly Team Report</span>
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Leader</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Receive team performance stats weekly</div>
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
                                            id="leader-weekly-report"
                                            checked={settings.leader_weekly_report_enabled}
                                            onCheckedChange={(checked) => setSettings({ ...settings, leader_weekly_report_enabled: checked })}
                                        />
                                    </div>
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
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={settings.weekly_reminder_time.substring(0, 5)}
                                                        onValueChange={(value) => setSettings({ ...settings, weekly_reminder_time: value + ':00' })}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select time" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TIME_SLOTS.map(time => (
                                                                <SelectItem key={time} value={time}>
                                                                    {time}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
