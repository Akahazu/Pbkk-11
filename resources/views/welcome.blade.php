<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Welcome - Autonomous SOC Analyst</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Styles / Scripts -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif

        <!-- Prism.js for syntax highlighting (Challenge 2) -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    </head>
    <body class="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-emerald-500/20 selection:text-emerald-500">

        <!-- Header -->
        <header class="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-border bg-card/50 px-8 backdrop-blur-md">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 shadow-sm dark:text-emerald-400">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <span class="block text-lg font-bold tracking-tight">LogIn SOC</span>
                    <span class="block font-mono text-[10px] tracking-wider text-emerald-600 uppercase dark:text-emerald-400">Agentic AI SIEM</span>
                </div>
            </div>

            <nav class="flex items-center gap-4">
                @auth
                    <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500">
                        <span>Go to Dashboard</span>
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                @else
                    <a href="{{ route('login') }}" class="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Log In
                    </a>
                    <a href="{{ route('register') }}" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500">
                        <span>Get Started</span>
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                @endauth
            </nav>
        </header>

        <!-- Main Content -->
        <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center space-y-24 px-6 py-16">

            <!-- Hero Section -->
            <div class="max-w-3xl space-y-6 text-center">
                <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500 motion-reduce:animate-none"></span>
                    Autonomous Threat Intelligence &amp; Response
                </div>
                <h1 class="text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">
                    Autonomous SOC Analyst powered by
                    <span class="text-emerald-600 dark:text-emerald-400">Agentic AI</span>.
                </h1>
                <p class="text-base leading-relaxed text-muted-foreground sm:text-lg">
                    LogIn ingests, correlates, and autonomously mitigates infrastructure threats in real-time using deterministic rule engines and ReAct AI agents.
                </p>
                <div class="flex items-center justify-center gap-4 pt-4">
                    @auth
                        <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500">
                            <span>Open SOC Command Center</span>
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    @else
                        <a href="{{ route('login') }}" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-500">
                            <span>Access SOC Command Center</span>
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    @endauth
                    <a href="https://github.com/ilhmpbta/LogIn" target="_blank" rel="noreferrer" class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted">
                        View on GitHub
                    </a>
                </div>
            </div>

            <!-- Feature Grid -->
            <div class="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div class="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-base font-bold text-foreground">Real-time Ingestion</h3>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                            High-throughput normalized log streaming and virtualized terminal viewing via Laravel Reverb WebSockets.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-base font-bold text-foreground">Deterministic Rules</h3>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                            Instant threshold-based and heuristic rule correlation to flag brute-force, SQLi, and port scans.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-base font-bold text-foreground">ReAct AI Agents</h3>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                            Autonomous reasoning loops inspecting server state, querying tools, and proposing verified remediation playbooks.
                        </p>
                    </div>
                </div>

                <div class="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-base font-bold text-foreground">Autonomous Mitigation</h3>
                        <p class="text-xs leading-relaxed text-muted-foreground">
                            One-click or fully automated firewall blocking (`iptables`), IP isolation, and service safeguards.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Architecture / Data Flow Diagram Block -->
            <div class="w-full space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div class="space-y-2 text-center">
                    <h2 class="font-mono text-sm font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">Architecture &amp; Data Flow</h2>
                    <p class="text-xl font-bold text-foreground">How LogIn Processes Threats in Milliseconds</p>
                </div>
                <div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-5">
                    <div class="space-y-2 rounded-xl border border-border bg-background p-4 text-center">
                        <div class="font-mono text-xs font-bold text-muted-foreground">01</div>
                        <div class="text-sm font-semibold">Server Logs</div>
                        <p class="text-[11px] text-muted-foreground">Syslog, Auth, Nginx &amp; DB streams</p>
                    </div>
                    <div class="space-y-2 rounded-xl border border-border bg-background p-4 text-center">
                        <div class="font-mono text-xs font-bold text-muted-foreground">02</div>
                        <div class="text-sm font-semibold">Normalization Pipeline</div>
                        <p class="text-[11px] text-muted-foreground">Parsed into structured DTOs</p>
                    </div>
                    <div class="space-y-2 rounded-xl border border-border bg-background p-4 text-center">
                        <div class="font-mono text-xs font-bold text-muted-foreground">03</div>
                        <div class="text-sm font-semibold">Rule Engine</div>
                        <p class="text-[11px] text-muted-foreground">Deterministic anomaly triggers</p>
                    </div>
                    <div class="space-y-2 rounded-xl border border-border bg-background p-4 text-center">
                        <div class="font-mono text-xs font-bold text-muted-foreground">04</div>
                        <div class="text-sm font-semibold">AI ReAct Agent</div>
                        <p class="text-[11px] text-muted-foreground">Autonomous tool execution</p>
                    </div>
                    <div class="space-y-2 rounded-xl border border-border bg-background p-4 text-center">
                        <div class="font-mono text-xs font-bold text-muted-foreground">05</div>
                        <div class="text-sm font-semibold">Reverb Dashboard</div>
                        <p class="text-[11px] text-muted-foreground">Real-time operator command</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="flex h-16 items-center justify-between border-t border-border bg-card/50 px-8 text-xs text-muted-foreground backdrop-blur-md">
            <div>&copy; 2026 LogIn SOC. All rights reserved.</div>
            <div class="flex items-center gap-4">
                <span class="font-mono text-[11px]">System Status: Operational</span>
            </div>
        </footer>

    </body>
</html>
