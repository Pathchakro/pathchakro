'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Save, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Database,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SystemConfigData {
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  googleAnalyticsPropertyId?: string;
  metaPixelId?: string;
  facebookAccessToken?: string;
  facebookDomainVerification?: string;
  facebookTestEventCode?: string;
  googleSearchConsoleId?: string;
  searchConsoleMeta?: string;
  superAdminNote?: string;
}

export default function SystemDesignClient({ initialConfig }: { initialConfig: SystemConfigData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfigData>(initialConfig || {});

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('System Infrastructure Configured Successfully!');
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <ShieldCheck className="h-4 w-4" /> System Design & Trackings
          </div>
          <h1 className="text-3xl font-black tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground text-sm">
            Manage search console verification, marketing pixels, tag managers, and secure admin records.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button 
            onClick={handleUpdate} 
            disabled={saving}
            className="h-11 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 text-sm"
          >
            {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Configuration</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Tag Manager & Analytics */}
        <Card className="border shadow-md overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/50 border-b p-5">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Globe className="h-5 w-5 text-primary" /> Google Analytics & Tag Manager
            </CardTitle>
            <CardDescription>Configure Google tools for traffic analysis and tag firing.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gtm-id" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Google Tag Manager ID (GTM)</Label>
              <input 
                id="gtm-id"
                value={config.googleTagManagerId || ''} 
                onChange={(e) => setConfig({ ...config, googleTagManagerId: e.target.value })}
                placeholder="GTM-XXXXXXX"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga4-id" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">GA4 Measurement ID (G-XXXX)</Label>
              <input 
                id="ga4-id"
                value={config.googleAnalyticsId || ''} 
                onChange={(e) => setConfig({ ...config, googleAnalyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga4-property-id" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">GA4 Property ID (Analytics)</Label>
              <input 
                id="ga4-property-id"
                value={config.googleAnalyticsPropertyId || ''} 
                onChange={(e) => setConfig({ ...config, googleAnalyticsPropertyId: e.target.value })}
                placeholder="e.g. 534447077"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Google Search Console */}
        <Card className="border shadow-md overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/50 border-b p-5">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Code className="h-5 w-5 text-primary" /> Google Search Console
            </CardTitle>
            <CardDescription>Verify domain ownership and track performance on Google Search.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sc-id" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Search Console Site URL / ID</Label>
              <input 
                id="sc-id"
                value={config.googleSearchConsoleId || ''} 
                onChange={(e) => setConfig({ ...config, googleSearchConsoleId: e.target.value })}
                placeholder="e.g. https://www.example.com/ or sc-domain:example.com"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-meta" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">HTML Verification Meta Tag</Label>
              <input 
                id="sc-meta"
                value={config.searchConsoleMeta || ''} 
                onChange={(e) => setConfig({ ...config, searchConsoleMeta: e.target.value })}
                placeholder='<meta name="google-site-verification" content="..." />'
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Facebook Pixel & Meta Integrations */}
        <Card className="border shadow-md overflow-hidden rounded-2xl md:col-span-2">
          <CardHeader className="bg-muted/50 border-b p-5">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <BarChart3 className="h-5 w-5 text-primary" /> Meta Pixel & Marketing Tracking
            </CardTitle>
            <CardDescription>Track events, page views, and configure conversions API.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixel-id" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Meta Pixel ID</Label>
              <input 
                id="pixel-id"
                value={config.metaPixelId || ''} 
                onChange={(e) => setConfig({ ...config, metaPixelId: e.target.value })}
                placeholder="Pixel ID"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-domain" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Facebook Domain Verification Code</Label>
              <input 
                id="fb-domain"
                value={config.facebookDomainVerification || ''} 
                onChange={(e) => setConfig({ ...config, facebookDomainVerification: e.target.value })}
                placeholder="Domain verification key"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fb-token" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Facebook Conversions Access Token</Label>
              <input 
                id="fb-token"
                type="password"
                value={config.facebookAccessToken || ''} 
                onChange={(e) => setConfig({ ...config, facebookAccessToken: e.target.value })}
                placeholder="EAAG..."
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fb-test-code" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Facebook Test Event Code (Optional)</Label>
              <input 
                id="fb-test-code"
                value={config.facebookTestEventCode || ''} 
                onChange={(e) => setConfig({ ...config, facebookTestEventCode: e.target.value })}
                placeholder="TESTXXXXX"
                className="w-full h-11 rounded-xl border-2 border-input px-4 focus:border-primary outline-none text-sm transition-all bg-card"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Super Admin Note */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white overflow-hidden rounded-2xl md:col-span-2">
          <CardHeader className="border-b border-indigo-900/30 p-5">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Database className="h-5 w-5 text-indigo-400" /> Super Admin Note
            </CardTitle>
            <CardDescription className="text-indigo-200">
              Private storage for DB credentials, API keys, server configurations, or development notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <textarea 
              value={config.superAdminNote || ''} 
              onChange={(e) => setConfig({ ...config, superAdminNote: e.target.value })}
              placeholder="Store secure MongoDB URLs, email configurations, SMS gateway secrets, or other private developer details..."
              className="w-full min-h-[180px] p-4 rounded-xl border-2 border-indigo-900/40 focus:border-indigo-400 outline-none text-sm font-mono bg-slate-950/80 text-emerald-400 placeholder:text-slate-500 transition-all resize-y"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
