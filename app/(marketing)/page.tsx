'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  FileText,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Headphones,
  Languages,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { user, isDemo } = useAuth();

  const ctaHref = user ? '/dashboard' : '/signup';
  const ctaText = user ? 'Go to Dashboard' : 'Get started for free';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Mic className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                Aawaz
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 font-mono">
                आवाज़
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-4xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-card/60 text-xs text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Powered by Sarvam AI Indic Models</span>
          <span className="text-border">|</span>
          <span className="text-foreground font-medium">11+ Indian Languages</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-2xl mx-auto leading-[1.15]">
          Bolo. Hum likh denge.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Speak or type in any Indian language or code-mixed Hinglish. Aawaz transcribes, organizes, and writes professional notes and formal applications in seconds.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={ctaHref}>
            <Button size="lg" className="w-full sm:w-auto shadow-sm">
              {ctaText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/studio">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Try Studio directly
            </Button>
          </Link>
        </div>

        {/* Feature Cards: Mode A and Mode B */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Card 1: Notes */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3 hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Aawaz Notes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Turns casual conversations, classes, and meeting discussions into clean, actionable notes: executive summary, bullet points, interactive action items, and decisions.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[11px]">Executive Summary</Badge>
              <Badge variant="secondary" className="text-[11px]">Action Checklists</Badge>
              <Badge variant="secondary" className="text-[11px]">Decisions</Badge>
            </div>
          </div>

          {/* Card 2: Bol Ke Likho */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3 hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center text-foreground mb-2">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Bol Ke Likho
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Speak or describe your real-life grievance in your native tongue. Aawaz formats it into a ready-to-send formal letter or application with highlighted placeholder tags.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[11px]">Complaints & Demands</Badge>
              <Badge variant="secondary" className="text-[11px]">Leave Applications</Badge>
              <Badge variant="secondary" className="text-[11px]">Tone Tuning</Badge>
            </div>
          </div>
        </div>

        {/* 3-Step How It Works */}
        <div className="pt-16 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="text-xs text-muted-foreground">
              Simple 3-step pipeline designed for speed and clarity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
              <span className="text-xs font-mono font-semibold text-primary">01</span>
              <h4 className="text-sm font-semibold text-foreground">Speak or Type</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use your microphone for Indic speech or type your thoughts in Hindi, Marathi, Hinglish or English.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
              <span className="text-xs font-mono font-semibold text-primary">02</span>
              <h4 className="text-sm font-semibold text-foreground">AI Structures It</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sarvam AI transcribes audio with Saaras and formats it cleanly without hallucinating facts.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
              <span className="text-xs font-mono font-semibold text-primary">03</span>
              <h4 className="text-sm font-semibold text-foreground">Listen, Copy & Export</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Read aloud with Bulbul voice synthesis, translate to any language, or download as markdown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Aawaz. Powered by{' '}
            <a
              href="https://sarvam.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              Sarvam AI
            </a>
          </p>
          <div className="flex items-center gap-4">
            <span>Saaras STT</span>
            <span>·</span>
            <span>Bulbul TTS</span>
            <span>·</span>
            <span>Sarvam LLM</span>
            <span>·</span>
            <span>Sarvam Translate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
